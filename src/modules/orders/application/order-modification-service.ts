import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import type { ServiceContext } from "@/services/types";
import { createDishRepository } from "@/modules/dish-library/infrastructure/dish-repository";
import type { UniversalOrderCaptureLineInput } from "./staff-order-capture-service";
import type { OrderRow, OrderItemRow } from "../infrastructure/order-repository";

export interface ModifyConfirmedOrderDTO {
  orderId: string;
  lines: UniversalOrderCaptureLineInput[];
  orderNotes?: string | null;
  reason?: string | null;
}

export interface ModifyConfirmedOrderResult {
  order: OrderRow;
  items: OrderItemRow[];
  total: number;
  auditWritten: boolean;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MODIFIABLE_STATUSES = new Set([
  "draft",
  "confirmed",
  "in_production",
  "in_preparation",
  "prepared",
]);

/**
 * OPS-01 G3 — OrderModificationService
 *
 * Canonical L4 Use Case for Post-Confirmation Order Modification:
 * - Allows staff to adjust quantities, culinary comments, or apply order-scoped price overrides.
 * - Enforces absolute catalog integrity (no mutation of `dishes`, `menus`, or `menu_schedules`).
 * - Emits mandatory structured Audit Trail via `AuditService.write` recording actor, old_data, and new_data.
 */
export const OrderModificationService = {
  async modifyOrder(
    ctx: ServiceContext,
    dto: ModifyConfirmedOrderDTO,
  ): Promise<ModifyConfirmedOrderResult> {
    requireCapability(ctx.roles, "orders.write");

    if (!dto.orderId?.trim()) {
      throw new DomainError("INVALID_STATE", "orderId is required.");
    }

    if (!Array.isArray(dto.lines) || dto.lines.length === 0) {
      throw new DomainError("INVALID_STATE", "Order modification requires at least one line item.");
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

    // 1. Fetch existing order and current items
    const { data: currentOrder, error: orderFetchError } = await ctx.supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", dto.orderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (orderFetchError) {
      throw new DomainError("INVALID_STATE", `Failed to fetch order: ${orderFetchError.message}`);
    }
    if (!currentOrder) {
      throw new DomainError("NOT_FOUND", `Order ${dto.orderId} not found in tenant.`);
    }

    if (!MODIFIABLE_STATUSES.has(currentOrder.status)) {
      throw new DomainError(
        "INVALID_STATE",
        `Order ${dto.orderId} with status '${currentOrder.status}' cannot be modified.`,
      );
    }

    const { data: currentItems, error: itemsFetchError } = await ctx.supabase
      .from("order_items")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("order_id", dto.orderId)
      .is("deleted_at", null);

    if (itemsFetchError) {
      throw new DomainError("INVALID_STATE", `Failed to fetch existing items: ${itemsFetchError.message}`);
    }

    const oldSnapshot = {
      order: currentOrder,
      items: currentItems ?? [],
      total: currentOrder.total,
      notes: currentOrder.notes,
    };

    // 2. Validate Dishes against Tenant Catalog (Strictly read-only)
    const uniqueDishIds = [...new Set(dto.lines.map((l) => l.dishId))];
    const dishRepo = createDishRepository(ctx.supabase, ctx.tenantId);
    const catalogDishes = await dishRepo.listCatalogByIds(uniqueDishIds);
    const catalogMap = new Map<string, { id: string; price: number; name: string }>();

    for (const d of catalogDishes) {
      catalogMap.set(d.id, {
        id: d.id,
        price: Number(d.price),
        name: d.name,
      });
    }

    for (const dishId of uniqueDishIds) {
      if (!catalogMap.has(dishId)) {
        throw new DomainError("NOT_FOUND", `Dish ${dishId} not found in tenant catalog.`);
      }
    }

    // 3. Compute New Line Prices & Grand Total
    let newGrandTotal = 0;
    const itemRowsToInsert: Array<{
      dish_id: string;
      day_date: string;
      qty: number;
      comment: string | null;
      effectiveUnitPrice: number;
    }> = [];

    for (const line of dto.lines) {
      const catalogDish = catalogMap.get(line.dishId)!;
      const effectiveUnitPrice =
        line.unitPriceOverride !== undefined && line.unitPriceOverride !== null
          ? line.unitPriceOverride
          : catalogDish.price;

      const lineSubtotal = effectiveUnitPrice * line.qty;
      newGrandTotal += lineSubtotal;

      itemRowsToInsert.push({
        dish_id: line.dishId,
        day_date: line.dayDate,
        qty: line.qty,
        comment: line.comment?.trim() ? line.comment.trim() : null,
        effectiveUnitPrice,
      });
    }

    newGrandTotal = Math.round(newGrandTotal * 100) / 100;

    // 4. Update Order header (total and notes)
    const updatedNotes = dto.orderNotes !== undefined ? dto.orderNotes?.trim() ?? null : currentOrder.notes;

    const { data: updatedOrderData, error: updateOrderError } = await ctx.supabase
      .from("orders")
      .update({
        total: newGrandTotal,
        notes: updatedNotes,
      })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", dto.orderId)
      .select("*")
      .single();

    if (updateOrderError || !updatedOrderData) {
      throw new DomainError("INVALID_STATE", `Failed to update order: ${updateOrderError?.message ?? "Unknown error"}`);
    }

    // 5. Replace existing order items with updated lines
    await ctx.supabase
      .from("order_items")
      .delete()
      .eq("tenant_id", ctx.tenantId)
      .eq("order_id", dto.orderId);

    const itemsPayload = itemRowsToInsert.map((item) => ({
      tenant_id: ctx.tenantId,
      order_id: dto.orderId,
      dish_id: item.dish_id,
      day_date: item.day_date,
      qty: item.qty,
      comment: item.comment,
    }));

    const { data: newItemsData, error: insertItemsError } = await ctx.supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("*");

    if (insertItemsError || !newItemsData) {
      throw new DomainError("INVALID_STATE", `Failed to insert modified order items: ${insertItemsError?.message ?? "Unknown error"}`);
    }

    const updatedOrder = updatedOrderData as OrderRow;
    const updatedItems = newItemsData as OrderItemRow[];

    const newSnapshot = {
      order: updatedOrder,
      items: updatedItems,
      total: newGrandTotal,
      notes: updatedNotes,
      modificationReason: dto.reason ?? null,
      lineDetails: itemRowsToInsert.map((item) => ({
        dishId: item.dish_id,
        dayDate: item.day_date,
        qty: item.qty,
        effectiveUnitPrice: item.effectiveUnitPrice,
        comment: item.comment,
      })),
    };

    // 6. Write to Canonical AuditService (ADR-0006)
    let auditWritten = false;
    try {
      await AuditService.write(ctx, {
        entityType: "order",
        entityId: dto.orderId,
        action: "update",
        oldData: oldSnapshot as unknown as Record<string, unknown>,
        newData: newSnapshot as unknown as Record<string, unknown>,
      });
      auditWritten = true;
    } catch {
      // Non-fatal if audit fails after update
    }

    return {
      order: updatedOrder,
      items: updatedItems,
      total: newGrandTotal,
      auditWritten,
    };
  },
};
