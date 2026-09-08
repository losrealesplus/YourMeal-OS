import { AuditService } from "@/services/audit-service";
import { FeatureFlagService } from "@/services/feature-flag-service";
import type { ServiceContext } from "@/services/types";
import { requireCapability, hasStaffAccess } from "@/permissions";
import { DomainError } from "@/domain/errors";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";
import { createWeeklyMenuRepository } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import { canAcceptOrders } from "@/modules/bootstrap-integrity";
import {
  CommercialPricingEngine,
  resolveOrderCommercialPricing,
  type CustomerTier,
  type ExtraItemInput,
} from "@/modules/commercial";
import {
  createOrderRepository,
  type OrderItemRow,
  type OrderRow,
  type ProgramOrderItemInput,
} from "../infrastructure/order-repository";

export type ProgramDraftOrderCommand = {
  weekStart: string;
  dayDate: string;
  /** Candidate dish ids from UI — validated against published offer; never trusted for price. */
  dishIds: string[];
  notes?: string | null;
  clientRequestId?: string;
  offerCode?: string;
  customerTier?: CustomerTier;
  extras?: ExtraItemInput[];
};

/** Multi-day draft (EP-002A.2 repeat). Each line validated against its day offer. */
export type ProgramDraftItemsCommand = {
  weekStart: string;
  items: ProgramOrderItemInput[];
  notes?: string | null;
  customerId?: string;
  clientRequestId?: string;
  offerCode?: string;
  customerTier?: CustomerTier;
  extras?: ExtraItemInput[];
};

export type ProgramDraftOrderResult = {
  order: OrderRow;
  items: OrderItemRow[];
};

type IdempotencyEntry = {
  timestamp: number;
  resultPromise?: Promise<ProgramDraftOrderResult>;
  result?: ProgramDraftOrderResult;
};

const idempotencyStore = new Map<string, IdempotencyEntry>();

export function clearOrderServiceIdempotencyForTests(): void {
  idempotencyStore.clear();
}

/**
 * CAP-004 programDraft · CAP-006 confirm — Mutation Pattern.
 * Audit is part of every write flow.
 *
 * ADR 0017: UI capture must go through OrderIntakeService.
 * This service remains the internal Order builder invoked by Intake.
 */
export const OrderService = {
  async programDraft(
    ctx: ServiceContext,
    command: ProgramDraftOrderCommand,
  ): Promise<ProgramDraftOrderResult> {
    return OrderService.programDraftItems(ctx, {
      weekStart: command.weekStart,
      notes: command.notes,
      clientRequestId: command.clientRequestId,
      items: command.dishIds.map((dishId) => ({
        dishId,
        dayDate: command.dayDate,
        qty: 1,
      })),
    });
  },

  async programDraftItems(
    ctx: ServiceContext,
    command: ProgramDraftItemsCommand,
  ): Promise<ProgramDraftOrderResult> {
    requireCapability(ctx.roles, "orders.write");

    if (!(await FeatureFlagService.isEnabled(ctx, "order_programming"))) {
      throw new DomainError("UNIMPLEMENTED", "Order programming is disabled by feature flag");
    }

    if (!command.items.length) {
      throw new DomainError("INVALID_STATE", "Order programming requires at least one dish");
    }
    if (!command.weekStart) {
      throw new DomainError("INVALID_STATE", "weekStart is required");
    }

    const idempotencyKey = command.clientRequestId?.trim()
      ? `${ctx.tenantId}:${command.clientRequestId.trim()}`
      : null;

    if (idempotencyKey) {
      const existing = idempotencyStore.get(idempotencyKey);
      if (existing) {
        if (existing.resultPromise) {
          return existing.resultPromise;
        }
        if (existing.result) {
          return existing.result;
        }
      }
    }

    const execute = async (): Promise<ProgramDraftOrderResult> => {
      for (const item of command.items) {
        if (!item.dishId || !item.dayDate || item.qty <= 0) {
          throw new DomainError("INVALID_STATE", "Each item needs dishId, dayDate and qty > 0");
        }
      }

      const uniqueDishIds = [...new Set(command.items.map((i) => i.dishId))];
      const menuRepo = createWeeklyMenuRepository(ctx.supabase, ctx.tenantId);
      const menu = await menuRepo.findPublishedByWeekStart(command.weekStart);
      if (!menu) {
        const gate = canAcceptOrders({ publishedMenuCount: 0 });
        throw new DomainError("MENU_LOCKED", gate.message, { code: gate.code });
      }

      const slots = await menuRepo.listSlotsWithDishes(menu.id);
      const offeredByDay = new Map<string, Set<string>>();
      for (const s of slots) {
        if (!s.day_date || !s.dishes || s.dishes.deleted_at) continue;
        const set = offeredByDay.get(s.day_date) ?? new Set<string>();
        set.add(s.dish_id);
        offeredByDay.set(s.day_date, set);
      }

      for (const item of command.items) {
        const offered = offeredByDay.get(item.dayDate);
        if (!offered?.has(item.dishId)) {
          throw new DomainError(
            "INVALID_STATE",
            `Dish ${item.dishId} is not offered on ${item.dayDate} for week ${command.weekStart}`,
          );
        }
      }

      const tenantSlug =
        ctx.tenantSlug ??
        (ctx.tenantId === "8bba00ba-331b-42c8-9283-4e3836ffb870"
          ? "eatclean"
          : "yourmeal-os");

      const commercialPricing = resolveOrderCommercialPricing({
        tenantSlug,
        customerTier: command.customerTier ?? "public",
        offerCode: command.offerCode,
        items: command.items,
        extras: command.extras,
      });

      let total = 0;
      if (commercialPricing) {
        total = commercialPricing.grandTotalFinalPrice.cents / 100;
      } else {
        const dishRepo = createDishRepository(ctx.supabase, ctx.tenantId);
        const dishes = await dishRepo.listCatalogByIds(uniqueDishIds);
        const priceById = new Map<string, number>();
        for (const d of dishes) {
          priceById.set(d.id, Number(d.price));
        }
        for (const item of command.items) {
          const unit = priceById.get(item.dishId);
          if (unit === undefined) {
            throw new DomainError("NOT_FOUND", `Dish not found for pricing: ${item.dishId}`);
          }
          total += unit * item.qty;
        }
        total = Math.round(total * 100) / 100;
      }

      const items: ProgramOrderItemInput[] = command.items.map((item) => ({
        dishId: item.dishId,
        dayDate: item.dayDate,
        qty: item.qty,
      }));

      const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
      let customerId = command.customerId ?? (await repo.findCustomerIdForUser(ctx.userId));
      if (!customerId) {
        // Structural correction ADR 0015 — provision Individual Customer without breaking CJ-001.
        const { CompanyAccountService } =
          await import("@/modules/company-account/application/company-account-service");
        customerId = await CompanyAccountService.ensureIndividualCustomer(ctx);
      }

      const { CompanyAccountService } =
        await import("@/modules/company-account/application/company-account-service");
      const demand = await CompanyAccountService.resolveOrderDemandContext(ctx, customerId);

      const result = await repo.insertDraft({
        customerId,
        weekStart: command.weekStart,
        total,
        notes: command.notes ?? null,
        items,
        demandChannel: demand.demandChannel,
        companyId: demand.companyId,
        siteId: demand.siteId,
        organizationalUnitId: demand.organizationalUnitId,
        deliveryGroupId: demand.deliveryGroupId,
      });

      try {
        await AuditService.write(ctx, {
          entityType: "order",
          entityId: result.order.id,
          action: "create",
          newData: {
            order: result.order,
            items: result.items,
          } as unknown as Record<string, unknown>,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Audit write failed after draft persist";
        throw new DomainError("INVALID_STATE", message);
      }

      return result;
    };

    if (!idempotencyKey) {
      return execute();
    }

    const promise = execute();
    const entry: IdempotencyEntry = {
      timestamp: Date.now(),
      resultPromise: promise,
    };
    idempotencyStore.set(idempotencyKey, entry);

    try {
      const res = await promise;
      entry.result = res;
      delete entry.resultPromise;
      return res;
    } catch (err) {
      idempotencyStore.delete(idempotencyKey);
      throw err;
    }
  },

  /**
   * CAP-006 — OM: Draft → Confirmed.
   * @see docs/17-operational-model/04-lifecycles/spine-transitions.md
   */
  async confirm(
    ctx: ServiceContext,
    orderId: string,
    options?: { expectedTotal?: number },
  ): Promise<OrderRow> {
    requireCapability(ctx.roles, "orders.write");

    if (!(await FeatureFlagService.isEnabled(ctx, "order_confirmation"))) {
      throw new DomainError("UNIMPLEMENTED", "Order confirmation is disabled by feature flag");
    }

    if (!orderId) {
      throw new DomainError("INVALID_STATE", "orderId is required");
    }

    const repo = createOrderRepository(ctx.supabase, ctx.tenantId);
    const current = await repo.findByIdWithItems(orderId);
    if (!current) {
      throw new DomainError("NOT_FOUND", `Order not found: ${orderId}`);
    }

    // INC-03 — app-layer ownership for customers (staff keep tenant-scoped write).
    if (!hasStaffAccess(ctx.roles)) {
      const customerId = await repo.findCustomerIdForUser(ctx.userId);
      if (!customerId || current.order.customer_id !== customerId) {
        throw new DomainError("PERMISSION_DENIED", "Cannot confirm an order you do not own");
      }
    }

    const tenantSlug =
      ctx.tenantSlug ??
      (ctx.tenantId === "8bba00ba-331b-42c8-9283-4e3836ffb870"
        ? "eatclean"
        : "yourmeal-os");

    // Re-evaluate commercial pricing authoritatively at confirmation time
    const commercialPricing = resolveOrderCommercialPricing({
      tenantSlug,
      customerTier: "public",
      items: current.items.map((i) => ({
        dishId: i.dish_id,
        dayDate: i.day_date,
        qty: i.qty,
      })),
    });

    const evaluatedTotal = commercialPricing
      ? commercialPricing.grandTotalFinalPrice.cents / 100
      : current.order.total;

    // Detect price change between draft and confirmation (Anti-Drift Guard)
    if (options?.expectedTotal !== undefined) {
      if (Math.abs(evaluatedTotal - options.expectedTotal) > 0.001) {
        throw new DomainError(
          "PRICE_MISMATCH",
          `El precio del pedido ha cambiado de ${options.expectedTotal.toFixed(2)} € a ${evaluatedTotal.toFixed(2)} €. Por favor, revisa el nuevo importe antes de confirmar.`,
          { expectedTotal: options.expectedTotal, actualTotal: evaluatedTotal },
        );
      }
    }

    let result: { old: OrderRow; order: OrderRow };
    try {
      result = await repo.confirmDraft(orderId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Confirm failed";
      if (message.includes("not found")) {
        throw new DomainError("NOT_FOUND", message);
      }
      throw new DomainError("INVALID_STATE", message);
    }

    // Generate immutable Price Snapshot
    const priceSnapshot = commercialPricing
      ? CommercialPricingEngine.createSnapshot(commercialPricing, {
          orderId: result.order.id,
          lineItems: current.items.map((item) => ({
            dishId: item.dish_id,
            dishName: item.dish_id,
            itemType: "menu_dish",
            qty: item.qty,
            basePriceCents: Math.round(
              commercialPricing.grandTotalBasePrice.cents /
                Math.max(1, current.items.length),
            ),
            finalPriceCents: Math.round(
              commercialPricing.grandTotalFinalPrice.cents /
                Math.max(1, current.items.length),
            ),
            discountCents: Math.round(
              commercialPricing.grandTotalSavings.cents /
                Math.max(1, current.items.length),
            ),
          })),
        })
      : null;

    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: result.order.id,
        action: "status_change",
        oldData: { status: result.old.status } as Record<string, unknown>,
        newData: {
          status: result.order.status,
          priceSnapshot,
        } as Record<string, unknown>,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Audit write failed after confirm";
      throw new DomainError("INVALID_STATE", message);
    }

    return result.order;
  },
};
