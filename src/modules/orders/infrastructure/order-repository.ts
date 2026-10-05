import { assertLegacyOrderWriteCompatible } from "../domain/legacy-order-write-guard";
import { readOrderItem, type OrderItemReadRow } from "../domain/order-item-read-model";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { AppSupabase } from "@/services/types";
import type { OrderDietarySnapshot } from "@/types/dietary";

export type OrderRow = Tables<"orders"> & { revision?: number; write_contract_version?: 1 | 2 };
export type OrderItemRow = Tables<"order_items"> &
  Partial<Omit<OrderItemReadRow, "id" | "dish_id">>;

/** SELECT * projection accepts future custom rows without widening legacy writes. */
export type OrderItemReadProjection = Omit<OrderItemRow, "dish_id"> & OrderItemReadRow;

export type ProgramOrderItemInput = {
  dishId: string;
  dayDate: string;
  qty: number;
  unitPrice?: number | null;
  priceSnapshotStatus?: "captured" | "explicit_zero" | "historical_unavailable";
};

export type ProgramOrderInput = {
  customerId: string;
  weekStart: string;
  total: number;
  notes?: string | null;
  dietarySnapshot?: OrderDietarySnapshot | null;
  deliveryAddressId?: string | null;
  items: ProgramOrderItemInput[];
  demandChannel?: "individual" | "company";
  companyId?: string | null;
  siteId?: string | null;
  organizationalUnitId?: string | null;
  deliveryGroupId?: string | null;
};

export type OrderWithItems = {
  order: OrderRow;
  items: OrderItemRow[];
};

type ProgramDraftRpcResult = {
  order: OrderRow;
  items: OrderItemRow[];
};

/**
 * Persistence only — CAP-004 draft · CAP-006 confirm.
 */
export function createOrderRepository(supabase: AppSupabase, tenantId: string) {
  async function findByIdWithItems(
    orderId: string,
  ): Promise<{ order: OrderRow; items: OrderItemReadProjection[] } | null> {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", orderId)
      .is("deleted_at", null)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return null;

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("order_id", orderId)
      .is("deleted_at", null)
      .order("day_date", { ascending: true });
    if (itemsError) throw itemsError;

    return { order: order as OrderRow, items: (items ?? []) as OrderItemReadProjection[] };
  }

  return {
    async findCustomerIdForUser(userId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },

    /**
     * Atomic order + items via SECURITY DEFINER RPC (INC-05).
     * Audit remains in OrderService after success.
     */
    async insertDraft(
      input: ProgramOrderInput,
    ): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
      const payload: Json = input.items.map((item) => ({
        dish_id: item.dishId,
        day_date: item.dayDate,
        qty: item.qty,
        unit_price: item.unitPrice ?? null,
        price_snapshot_status:
          item.priceSnapshotStatus ??
          (item.unitPrice !== undefined && item.unitPrice !== null
            ? item.unitPrice === 0
              ? "explicit_zero"
              : "captured"
            : undefined),
      }));

      // TODO(HP-001): program_draft_order RPC pending migration.
      const { data, error } = await (
        supabase.rpc as unknown as (
          name: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: unknown }>
      )("program_draft_order", {
        _tenant_id: tenantId,
        _customer_id: input.customerId,
        _week_start: input.weekStart,
        _total: input.total,
        _notes: input.notes ?? null,
        _items: payload,
        _demand_channel: input.demandChannel ?? "individual",
        _company_id: input.companyId ?? null,
        _site_id: input.siteId ?? null,
        _organizational_unit_id: input.organizationalUnitId ?? null,
        _delivery_group_id: input.deliveryGroupId ?? null,
      });
      if (error) throw error;

      const result = data as unknown as ProgramDraftRpcResult;
      if (!result?.order || !Array.isArray(result.items)) {
        throw new Error("program_draft_order returned unexpected payload");
      }

      const updatePayload: { dietary_snapshot?: Json; delivery_address_id?: string | null } = {};
      if (input.dietarySnapshot) {
        updatePayload.dietary_snapshot = input.dietarySnapshot as unknown as Json;
      }
      if (input.deliveryAddressId !== undefined) {
        updatePayload.delivery_address_id = input.deliveryAddressId;
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateErr } = await supabase
          .from("orders")
          .update(updatePayload)
          .eq("tenant_id", tenantId)
          .eq("id", result.order.id);
        if (!updateErr) {
          if (input.dietarySnapshot) {
            result.order.dietary_snapshot = input.dietarySnapshot as unknown as Json;
          }
          if (input.deliveryAddressId !== undefined) {
            result.order.delivery_address_id = input.deliveryAddressId;
          }
        }
      }

      return { order: result.order, items: result.items };
    },

    findByIdWithItems,

    /** Expanded read projection, retaining every item; legacy writers remain dish-only. */
    async findItemReadModels(orderId: string) {
      const result = await findByIdWithItems(orderId);
      if (!result) return null;
      return {
        order: result.order,
        items: result.items.map((item) => ({ ...item, line: readOrderItem(item) })),
      };
    },

    /** CAP-006 — Draft → Confirmed (status guard + soft-delete filter). */
    async confirmDraft(orderId: string): Promise<{ old: OrderRow; order: OrderRow }> {
      const current = await findByIdWithItems(orderId);
      if (!current) {
        throw new Error(`Order not found: ${orderId}`);
      }
      assertLegacyOrderWriteCompatible(current.order, current.items);
      if (current.order.status !== "draft") {
        throw new Error(`Order ${orderId} is not draft (status=${current.order.status})`);
      }

      const { data: order, error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .eq("status", "draft")
        .is("deleted_at", null)
        .select("*")
        .single();
      if (error) throw error;

      return { old: current.order, order: order as OrderRow };
    },

    /** Compensating action: revert confirmed order back to draft if audit/snapshot fails. */
    async revertToDraft(orderId: string): Promise<void> {
      const { error } = await supabase
        .from("orders")
        .update({ status: "draft" })
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .eq("status", "confirmed")
        .is("deleted_at", null);
      if (error) throw error;
    },
  };
}

export type OrderRepository = ReturnType<typeof createOrderRepository>;
