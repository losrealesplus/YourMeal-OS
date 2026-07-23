import type { Json, Tables } from "@/integrations/supabase/types";
import type { AppSupabase } from "@/services/types";

export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;

export type ProgramOrderItemInput = {
  dishId: string;
  dayDate: string;
  qty: number;
};

export type ProgramOrderInput = {
  customerId: string;
  weekStart: string;
  total: number;
  notes?: string | null;
  items: ProgramOrderItemInput[];
  demandChannel?: "individual" | "company";
  companyId?: string | null;
  siteId?: string | null;
  organizationalUnitId?: string | null;
  deliveryGroupId?: string | null;
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
  ): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
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

    return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[] };
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
      }));

      // TODO(HP-001): program_draft_order RPC pending migration.
      const { data, error } = await (supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)("program_draft_order", {
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
      return { order: result.order, items: result.items };
    },

    findByIdWithItems,

    /** CAP-006 — Draft → Confirmed (status guard + soft-delete filter). */
    async confirmDraft(orderId: string): Promise<{ old: OrderRow; order: OrderRow }> {
      const current = await findByIdWithItems(orderId);
      if (!current) {
        throw new Error(`Order not found: ${orderId}`);
      }
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
  };
}

export type OrderRepository = ReturnType<typeof createOrderRepository>;

