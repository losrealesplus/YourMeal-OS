import type { Tables, TablesInsert } from "@/integrations/supabase/types";
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
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return null;

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("order_id", orderId)
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
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },

    async insertDraft(
      input: ProgramOrderInput,
    ): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
      const orderInsert: TablesInsert<"orders"> = {
        tenant_id: tenantId,
        customer_id: input.customerId,
        week_start: input.weekStart,
        status: "draft",
        total: input.total,
        notes: input.notes ?? null,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderInsert)
        .select("*")
        .single();
      if (orderError) throw orderError;

      const itemRows: TablesInsert<"order_items">[] = input.items.map((item) => ({
        tenant_id: tenantId,
        order_id: order.id,
        dish_id: item.dishId,
        day_date: item.dayDate,
        qty: item.qty,
      }));

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .insert(itemRows)
        .select("*");
      if (itemsError) throw itemsError;

      return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[] };
    },

    findByIdWithItems,

    /** CAP-006 — atomic Draft → Confirmed. */
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
        .select("*")
        .single();
      if (error) throw error;

      return { old: current.order, order: order as OrderRow };
    },
  };
}

export type OrderRepository = ReturnType<typeof createOrderRepository>;
