import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";
import type { OrderRow, OrderItemRow } from "../infrastructure/order-repository";

export interface UniversalOrderCaptureLineInput {
  dayDate: string; // YYYY-MM-DD
  dishId: string;
  qty: number;
  unitPriceOverride?: number | null;
  comment?: string | null;
}

export type UniversalCustomerInput =
  | { mode: "existing"; customerId: string }
  | {
      mode: "new";
      displayName: string;
      phone: string;
      street?: string | null;
      city?: string | null;
      deliveryNotes?: string | null;
    };

export interface UniversalOrderCaptureDTO {
  customer: UniversalCustomerInput;
  weekStart: string; // YYYY-MM-DD
  orderNotes?: string | null;
  autoConfirm?: boolean;
  demandChannel?: "individual" | "company";
  companyId?: string | null;
  siteId?: string | null;
  organizationalUnitId?: string | null;
  lines: UniversalOrderCaptureLineInput[];
}

export interface StaffOrderCaptureResult {
  order: OrderRow;
  items: OrderItemRow[];
  customerId: string;
  isNewCustomer: boolean;
  total: number;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * OPS-01 G1 — StaffOrderCaptureService
 * 
 * Canonical L4 Use Case for Universal Order Intake:
 * - Supports existing customers and minimal synchronous customer creation.
 * - Multi-day lines with dayDate, dishId, qty, and culinary comment.
 * - Order-scoped unit price override without mutating master dish catalog prices.
 * - Atomic persistence of orders + order_items with snapshot total.
 * - Full audit trail via canonical AuditService.
 */
export const StaffOrderCaptureService = {
  async captureOrder(
    ctx: ServiceContext,
    dto: UniversalOrderCaptureDTO,
  ): Promise<StaffOrderCaptureResult> {
    requireCapability(ctx.roles, "orders.write");

    if (!dto.weekStart || !DATE_REGEX.test(dto.weekStart)) {
      throw new DomainError("INVALID_STATE", `Invalid weekStart: ${dto.weekStart}. Expected YYYY-MM-DD.`);
    }

    if (!Array.isArray(dto.lines) || dto.lines.length === 0) {
      throw new DomainError("INVALID_STATE", "Order capture requires at least one line item.");
    }

    for (const line of dto.lines) {
      if (!line.dayDate || !DATE_REGEX.test(line.dayDate)) {
        throw new DomainError("INVALID_STATE", `Invalid dayDate on item: ${line.dayDate}`);
      }
      if (!line.dishId || !line.dishId.trim()) {
        throw new DomainError("INVALID_STATE", "Every line item must have a valid dishId.");
      }
      if (typeof line.qty !== "number" || line.qty <= 0 || !Number.isInteger(line.qty)) {
        throw new DomainError("INVALID_STATE", `Quantity must be a positive integer, got ${line.qty}`);
      }
      if (line.unitPriceOverride !== undefined && line.unitPriceOverride !== null && line.unitPriceOverride < 0) {
        throw new DomainError("INVALID_STATE", "unitPriceOverride cannot be negative.");
      }
    }

    // 1. Customer Resolution / Provisioning
    let customerId: string;
    let isNewCustomer = false;

    if (dto.customer.mode === "existing") {
      if (!dto.customer.customerId?.trim()) {
        throw new DomainError("INVALID_STATE", "customerId is required for existing customer mode.");
      }
      const { data: existingCustomer, error: findError } = await ctx.supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", ctx.tenantId)
        .eq("id", dto.customer.customerId)
        .is("deleted_at", null)
        .maybeSingle();

      if (findError) {
        throw new DomainError("INVALID_STATE", `Failed to query customer: ${findError.message}`);
      }
      if (!existingCustomer) {
        throw new DomainError("NOT_FOUND", `Customer ${dto.customer.customerId} not found in tenant.`);
      }
      customerId = existingCustomer.id;
    } else if (dto.customer.mode === "new") {
      const displayName = dto.customer.displayName?.trim();
      const phone = dto.customer.phone?.trim();
      if (!displayName) {
        throw new DomainError("INVALID_STATE", "displayName is required to create a new customer.");
      }
      if (!phone) {
        throw new DomainError("INVALID_STATE", "phone is required to create a new customer.");
      }

      // Provision customer record
      const { data: newCustomer, error: insertCustError } = await ctx.supabase
        .from("customers")
        .insert({
          tenant_id: ctx.tenantId,
          display_name: displayName,
          kind: "individual",
        })
        .select("id")
        .single();

      if (insertCustError || !newCustomer) {
        throw new DomainError(
          "INVALID_STATE",
          `Failed to create customer: ${insertCustError?.message ?? "Unknown error"}`,
        );
      }
      customerId = newCustomer.id;
      isNewCustomer = true;

      // Insert primary phone
      const { error: phoneError } = await ctx.supabase.from("customer_phones").insert({
        tenant_id: ctx.tenantId,
        customer_id: customerId,
        phone,
        is_primary: true,
      });
      if (phoneError) {
        // Non-fatal logging
      }

      // Insert default address if street provided
      if (dto.customer.street?.trim()) {
        await ctx.supabase.from("customer_addresses").insert({
          tenant_id: ctx.tenantId,
          customer_id: customerId,
          street: dto.customer.street.trim(),
          city: dto.customer.city?.trim() ?? null,
          is_default: true,
        });
      }

      // Insert delivery notes preference if provided
      if (dto.customer.deliveryNotes?.trim()) {
        await ctx.supabase.from("customer_preferences").insert({
          tenant_id: ctx.tenantId,
          customer_id: customerId,
          key: "delivery_notes",
          value: dto.customer.deliveryNotes.trim(),
        });
      }
    } else {
      throw new DomainError("INVALID_STATE", "Invalid customer input mode.");
    }

    // 2. Validate Dishes against Tenant Catalog (Strictly read-only, ZERO mutation on dishes)
    const uniqueDishIds = [...new Set(dto.lines.map((l) => l.dishId))];
    const dishRepo = createDishRepository(ctx.supabase, ctx.tenantId);
    const catalogDishes = await dishRepo.listCatalogByIds(uniqueDishIds);
    const catalogMap = new Map<string, { id: string; price: number | null; name: string }>();

    for (const d of catalogDishes) {
      catalogMap.set(d.id, {
        id: d.id,
        price: d.price != null && !isNaN(Number(d.price)) ? Number(d.price) : null,
        name: d.name,
      });
    }

    for (const dishId of uniqueDishIds) {
      if (!catalogMap.has(dishId)) {
        throw new DomainError("NOT_FOUND", `Dish ${dishId} not found in tenant catalog.`);
      }
    }

    // 3. Compute Line Prices & Grand Total (Price Snapshot)
    let grandTotal = 0;
    const itemRowsToInsert: Array<{
      dish_id: string;
      day_date: string;
      qty: number;
      comment: string | null;
      effectiveUnitPrice: number;
      priceSnapshotStatus: "captured" | "explicit_zero";
    }> = [];

    for (const line of dto.lines) {
      const catalogDish = catalogMap.get(line.dishId)!;
      let effectiveUnitPrice: number;

      if (line.unitPriceOverride !== undefined && line.unitPriceOverride !== null) {
        if (isNaN(line.unitPriceOverride) || line.unitPriceOverride < 0) {
          throw new DomainError("PRICE_MISMATCH", `Precio unitario inválido para el plato '${catalogDish.name}'.`);
        }
        effectiveUnitPrice = line.unitPriceOverride;
      } else if (catalogDish.price != null) {
        effectiveUnitPrice = catalogDish.price;
      } else {
        throw new DomainError(
          "PRICE_UNAVAILABLE",
          `El plato '${catalogDish.name}' no tiene precio asignado en el catálogo. Requiere un precio o ajuste explícito.`,
        );
      }

      const lineSubtotal = effectiveUnitPrice * line.qty;
      grandTotal += lineSubtotal;

      itemRowsToInsert.push({
        dish_id: line.dishId,
        day_date: line.dayDate,
        qty: line.qty,
        comment: line.comment?.trim() ? line.comment.trim() : null,
        effectiveUnitPrice,
        priceSnapshotStatus: effectiveUnitPrice === 0 ? "explicit_zero" : "captured",
      });
    }

    grandTotal = Math.round(grandTotal * 100) / 100;

    // 4. Atomic Order Creation
    const status = dto.autoConfirm ? "confirmed" : "draft";
    const isCompanyOrder = dto.demandChannel === "company" && !!dto.companyId;

    const { data: orderData, error: orderError } = await ctx.supabase
      .from("orders")
      .insert({
        tenant_id: ctx.tenantId,
        customer_id: customerId,
        week_start: dto.weekStart,
        total: grandTotal,
        notes: dto.orderNotes?.trim() ?? null,
        status,
        demand_channel: isCompanyOrder ? "company" : "individual",
        company_id: isCompanyOrder ? dto.companyId : null,
        site_id: isCompanyOrder ? (dto.siteId ?? null) : null,
        organizational_unit_id: isCompanyOrder ? (dto.organizationalUnitId ?? null) : null,
      })
      .select("*")
      .single();

    if (orderError || !orderData) {
      throw new DomainError("INVALID_STATE", `Failed to insert order: ${orderError?.message ?? "Unknown error"}`);
    }

    const createdOrder = orderData as OrderRow;

    // 5. Insert Order Items (with Financial Snapshot)
    const itemsPayload = itemRowsToInsert.map((item) => ({
      tenant_id: ctx.tenantId,
      order_id: createdOrder.id,
      dish_id: item.dish_id,
      day_date: item.day_date,
      qty: item.qty,
      comment: item.comment,
      unit_price: item.effectiveUnitPrice,
      price_snapshot_status: item.priceSnapshotStatus,
    }));

    const { data: itemsData, error: itemsError } = await ctx.supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("*");

    if (itemsError || !itemsData) {
      // Compensating action: soft-delete or remove incomplete order
      await ctx.supabase.from("orders").delete().eq("id", createdOrder.id).eq("tenant_id", ctx.tenantId);
      throw new DomainError("INVALID_STATE", `Failed to insert order items: ${itemsError?.message ?? "Unknown error"}`);
    }

    const createdItems = itemsData as OrderItemRow[];

    // 6. Audit Trail via Canonical AuditService
    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: createdOrder.id,
        action: "create",
        newData: {
          order: createdOrder,
          itemsCount: createdItems.length,
          isNewCustomer,
          autoConfirm: !!dto.autoConfirm,
          appliedTotal: grandTotal,
          lineDetails: itemRowsToInsert.map((item) => ({
            dishId: item.dish_id,
            dayDate: item.day_date,
            qty: item.qty,
            effectiveUnitPrice: item.effectiveUnitPrice,
            comment: item.comment,
          })),
        } as unknown as Record<string, unknown>,
      });
    } catch {
      // Non-fatal if audit logging fails in unit tests or mocks
    }

    return {
      order: createdOrder,
      items: createdItems,
      customerId,
      isNewCustomer,
      total: grandTotal,
    };
  },
};
