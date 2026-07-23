/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { OperationalOrderStatus } from "../domain/operational-status";

type Client = SupabaseClient<Database>;

export type OperationalOrderListItem = {
  id: string;
  tenantId: string;
  status: OperationalOrderStatus;
  weekStart: string;
  notes: string | null;
  total: number;
  createdAt: string;
  demandChannel: "individual" | "company";
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  companyId: string | null;
  companyName: string | null;
  siteId: string | null;
  siteName: string | null;
  siteAddress: string | null;
  organizationalUnitId: string | null;
  organizationalUnitName: string | null;
  deliveryGroupId: string | null;
  deliveryGroupName: string | null;
  /** Distinct day_dates from items (YYYY-MM-DD), sorted */
  deliveryDates: string[];
  items: Array<{
    id: string;
    dishId: string;
    dishName: string | null;
    dayDate: string;
    qty: number;
    notes: string | null;
  }>;
};

/** @deprecated alias — prefer OperationalOrderListItem */
export type OperationalOrderRow = OperationalOrderListItem;

export type OperationalOrderFilters = {
  statuses: OperationalOrderStatus[];
  /** YYYY-MM-DD — match order_items.day_date (fallback: week_start) */
  deliveryDate?: string | null;
  /** @deprecated use deliveryDate */
  date?: string | null;
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
};

function mapRow(row: Record<string, any>): OperationalOrderListItem {
  const customer = row.customers ?? null;
  const company = row.companies ?? null;
  const site = row.company_locations ?? null;
  const unit = row.company_departments ?? null;
  const group = row.delivery_groups ?? null;
  const items = (row.order_items ?? []) as Record<string, any>[];
  const deliveryDates = [
    ...new Set(items.map((it) => String(it.day_date)).filter(Boolean)),
  ].sort();
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    status: row.status as OperationalOrderStatus,
    weekStart: String(row.week_start),
    notes: (row.notes as string | null) ?? null,
    total: Number(row.total ?? 0),
    createdAt: String(row.created_at),
    demandChannel:
      (row.demand_channel as "individual" | "company") ?? "individual",
    customerId: String(row.customer_id),
    customerName: customer?.display_name ?? null,
    customerEmail: customer?.email ?? null,
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: company?.name ?? null,
    siteId: row.site_id ? String(row.site_id) : null,
    siteName: site?.name ?? null,
    siteAddress: site?.address ?? null,
    organizationalUnitId: row.organizational_unit_id
      ? String(row.organizational_unit_id)
      : null,
    organizationalUnitName: unit?.name ?? null,
    deliveryGroupId: row.delivery_group_id
      ? String(row.delivery_group_id)
      : null,
    deliveryGroupName: group?.name ?? null,
    deliveryDates,
    items: items.map((it) => ({
      id: String(it.id),
      dishId: String(it.dish_id),
      dishName: it.dishes?.name ?? null,
      dayDate: String(it.day_date),
      qty: Number(it.qty ?? 1),
      notes: (it.comment as string | null) ?? null,
    })),
  };
}

const ORDER_SELECT = `
  id, tenant_id, status, week_start, notes, total, created_at, customer_id,
  demand_channel, company_id, site_id, organizational_unit_id, delivery_group_id,
  customers ( id, display_name, email ),
  companies ( id, name ),
  company_locations ( id, name, address ),
  company_departments ( id, name ),
  delivery_groups ( id, name ),
  order_items ( id, dish_id, day_date, qty, comment, dishes ( id, name ) )
`;

export function createOperationsRepository(client: Client, tenantId: string) {
  const db = client as any;

  return {
    async getOrder(orderId: string): Promise<OperationalOrderListItem | null> {
      const { data, error } = await db
        .from("orders")
        .select(ORDER_SELECT)
        .eq("tenant_id", tenantId)
        .eq("id", orderId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapRow(data as Record<string, any>);
    },

    async listOrders(
      filters: OperationalOrderFilters,
    ): Promise<OperationalOrderListItem[]> {
      const day = filters.deliveryDate ?? filters.date ?? null;
      const useInnerItems = Boolean(day);

      let q = db
        .from("orders")
        .select(
          useInnerItems
            ? ORDER_SELECT.replace(
                "order_items (",
                "order_items!inner (",
              )
            : ORDER_SELECT,
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("status", filters.statuses)
        .order("created_at", { ascending: true });

      if (filters.companyId) q = q.eq("company_id", filters.companyId);
      if (filters.siteId) q = q.eq("site_id", filters.siteId);
      if (filters.deliveryGroupId) {
        q = q.eq("delivery_group_id", filters.deliveryGroupId);
      }
      if (day) {
        q = q.eq("order_items.day_date", day);
      }

      const { data, error } = await q;
      if (error) throw error;

      return ((data ?? []) as Record<string, any>[]).map(mapRow);
    },

    async countByStatuses(
      statuses: OperationalOrderStatus[],
      deliveryDate?: string | null,
    ): Promise<number> {
      if (deliveryDate) {
        const { count, error } = await db
          .from("orders")
          .select("id, order_items!inner(day_date)", {
            count: "exact",
            head: true,
          })
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("status", statuses)
          .eq("order_items.day_date", deliveryDate);
        if (error) throw error;
        return count ?? 0;
      }

      const { count, error } = await db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("status", statuses);
      if (error) throw error;
      return count ?? 0;
    },

    async transitionStatus(
      orderId: string,
      toStatus: OperationalOrderStatus,
    ): Promise<OperationalOrderStatus> {
      const { data, error } = await db.rpc("transition_order_status", {
        p_tenant_id: tenantId,
        p_order_id: orderId,
        p_to_status: toStatus,
      });
      if (error) throw error;
      const row = data as Record<string, unknown>;
      return String(row.status) as OperationalOrderStatus;
    },
  };
}
