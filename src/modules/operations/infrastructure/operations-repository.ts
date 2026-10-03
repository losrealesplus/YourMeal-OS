/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { OperationalOrderStatus } from "../domain/operational-status";
import type { OrderDietarySnapshot } from "@/types/dietary";
import type {
  DeliveryServiceModel,
  DeliveryServiceStatus,
  DeliveryAddressSnapshot,
  CustomerContactSnapshot,
} from "../domain/delivery-service";

type Client = SupabaseClient<Database>;

export type OperationalOrderListItem = {
  id: string;
  tenantId: string;
  status: OperationalOrderStatus;
  weekStart: string;
  notes: string | null;
  dietarySnapshot?: OrderDietarySnapshot | null;
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
  deliveryAddressId?: string | null;
  deliveryAddress?: {
    id: string;
    label: string | null;
    street: string;
    city: string | null;
    zip: string | null;
  } | null;
  /** Distinct day_dates from items (YYYY-MM-DD), sorted */
  deliveryDates: string[];
  items: Array<{
    id: string;
    dishId: string;
    dishName: string | null;
    dayDate: string;
    qty: number;
    notes: string | null;
    unitPrice?: number | null;
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
  const customerAddress = row.customer_addresses ?? null;
  const items = (row.order_items ?? []) as Record<string, any>[];
  const deliveryDates = [...new Set(items.map((it) => String(it.day_date)).filter(Boolean))].sort();
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    status: row.status as OperationalOrderStatus,
    weekStart: String(row.week_start),
    notes: (row.notes as string | null) ?? null,
    dietarySnapshot: (row.dietary_snapshot as OrderDietarySnapshot | null) ?? null,
    total: Number(row.total ?? 0),
    createdAt: String(row.created_at),
    demandChannel: (row.demand_channel as "individual" | "company") ?? "individual",
    customerId: String(row.customer_id),
    customerName: customer?.display_name ?? null,
    customerEmail: customer?.email ?? null,
    companyId: row.company_id ? String(row.company_id) : null,
    companyName: company?.name ?? null,
    siteId: row.site_id ? String(row.site_id) : null,
    siteName: site?.name ?? null,
    siteAddress: site?.address ?? null,
    organizationalUnitId: row.organizational_unit_id ? String(row.organizational_unit_id) : null,
    organizationalUnitName: unit?.name ?? null,
    deliveryGroupId: row.delivery_group_id ? String(row.delivery_group_id) : null,
    deliveryGroupName: group?.name ?? null,
    deliveryAddressId: row.delivery_address_id ? String(row.delivery_address_id) : null,
    deliveryAddress: customerAddress
      ? {
          id: String(customerAddress.id),
          label: customerAddress.label ?? null,
          street: String(customerAddress.street),
          city: customerAddress.city ?? null,
          zip: customerAddress.zip ?? null,
        }
      : null,
    deliveryDates,
    items: items.map((it) => ({
      id: String(it.id),
      dishId: String(it.dish_id),
      dishName: it.dishes?.name ?? null,
      dayDate: String(it.day_date),
      qty: Number(it.qty ?? 1),
      notes: (it.comment as string | null) ?? null,
      unitPrice: it.unit_price != null ? Number(it.unit_price) : null,
    })),
  };
}

const ORDER_SELECT = `
  id, tenant_id, status, week_start, notes, dietary_snapshot, total, created_at, customer_id,
  demand_channel, company_id, site_id, organizational_unit_id, delivery_group_id, delivery_address_id,
  customers ( id, display_name, email ),
  companies ( id, name ),
  company_locations ( id, name, address ),
  company_departments ( id, name ),
  delivery_groups ( id, name ),
  customer_addresses ( id, label, street, city, zip ),
  order_items ( id, dish_id, day_date, qty, comment, unit_price, dishes ( id, name ) )
`;

function mapDeliveryServiceRow(row: Record<string, any>): DeliveryServiceModel {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    deliveryDate: String(row.delivery_date),
    status: row.status as DeliveryServiceStatus,
    deliveryAddressId: row.delivery_address_id ? String(row.delivery_address_id) : null,
    deliveryAddressSnapshot: (row.delivery_address_snapshot as DeliveryAddressSnapshot) ?? {},
    customerContactSnapshot: (row.customer_contact_snapshot as CustomerContactSnapshot) ?? {},
    dietarySnapshot: (row.dietary_snapshot as OrderDietarySnapshot | null) ?? null,
    deliveryInstructions: (row.delivery_instructions as string | null) ?? null,
    packedAt: row.packed_at ? String(row.packed_at) : null,
    packedBy: row.packed_by ? String(row.packed_by) : null,
    dispatchedAt: row.dispatched_at ? String(row.dispatched_at) : null,
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    deliveredBy: row.delivered_by ? String(row.delivered_by) : null,
    issueReason: (row.issue_reason as string | null) ?? null,
    issueNotes: (row.issue_notes as string | null) ?? null,
    driverNotes: (row.driver_notes as string | null) ?? null,
    legacyBackfill: Boolean(row.legacy_backfill),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

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

    async listOrders(filters: OperationalOrderFilters): Promise<OperationalOrderListItem[]> {
      const day = filters.deliveryDate ?? filters.date ?? null;
      const useInnerItems = Boolean(day);

      let q = db
        .from("orders")
        .select(
          useInnerItems
            ? ORDER_SELECT.replace("order_items (", "order_items!inner (")
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

    async listDeliveryServices(
      filters: {
        deliveryDate?: string | null;
        status?: DeliveryServiceStatus | DeliveryServiceStatus[];
        orderId?: string | null;
        customerId?: string | null;
      } = {},
    ): Promise<DeliveryServiceModel[]> {
      let q = db
        .from("delivery_services")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (filters.deliveryDate) q = q.eq("delivery_date", filters.deliveryDate);
      if (filters.orderId) q = q.eq("order_id", filters.orderId);
      if (filters.customerId) q = q.eq("customer_id", filters.customerId);
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          q = q.in("status", filters.status);
        } else {
          q = q.eq("status", filters.status);
        }
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapDeliveryServiceRow);
    },

    async getDeliveryService(serviceId: string): Promise<DeliveryServiceModel | null> {
      const { data, error } = await db
        .from("delivery_services")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", serviceId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDeliveryServiceRow(data);
    },

    async getDeliveryServiceByOrderDay(
      orderId: string,
      deliveryDate: string,
    ): Promise<DeliveryServiceModel | null> {
      const { data, error } = await db
        .from("delivery_services")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .eq("delivery_date", deliveryDate)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDeliveryServiceRow(data);
    },

    async transitionDeliveryService(
      serviceId: string,
      toStatus: DeliveryServiceStatus,
      actorId?: string,
      notes?: string,
    ): Promise<DeliveryServiceModel> {
      const { data, error } = await db.rpc("transition_delivery_service_status", {
        p_tenant_id: tenantId,
        p_service_id: serviceId,
        p_to_status: toStatus,
        p_actor_id: actorId ?? null,
        p_notes: notes ?? null,
      });
      if (error) throw error;
      return mapDeliveryServiceRow(data as Record<string, unknown>);
    },

    async createDeliveryServicesForOrder(orderId: string): Promise<DeliveryServiceModel[]> {
      const order = await this.getOrder(orderId);
      if (!order) return [];

      const distinctDays = [...new Set(order.items.map((i) => i.dayDate).filter(Boolean))].sort();
      if (distinctDays.length === 0) return [];

      let addrSnapshot: Record<string, unknown> = {
        unresolved: true,
        reason: "no_address_at_intake",
      };
      let resolvedAddressId: string | null = null;

      if (order.siteAddress) {
        addrSnapshot = { street: order.siteAddress, label: order.siteName ?? "Sitio" };
        resolvedAddressId = order.siteId ?? null;
      } else if (order.deliveryAddress) {
        addrSnapshot = {
          addressId: order.deliveryAddress.id,
          street: order.deliveryAddress.street,
          city: order.deliveryAddress.city,
          zip: order.deliveryAddress.zip,
          label: order.deliveryAddress.label,
        };
        resolvedAddressId = order.deliveryAddress.id;
      } else if (order.deliveryAddressId) {
        const { data: ca } = await db
          .from("customer_addresses")
          .select("id, street, city, zip, label")
          .eq("tenant_id", tenantId)
          .eq("id", order.deliveryAddressId)
          .maybeSingle();
        if (ca) {
          addrSnapshot = {
            addressId: ca.id,
            street: ca.street,
            city: ca.city,
            zip: ca.zip,
            label: ca.label,
          };
          resolvedAddressId = ca.id;
        }
      } else {
        // Fallback: lookup customer's default address
        const { data: defAddr } = await db
          .from("customer_addresses")
          .select("id, street, city, zip, label")
          .eq("tenant_id", tenantId)
          .eq("customer_id", order.customerId)
          .is("deleted_at", null)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (defAddr) {
          addrSnapshot = {
            addressId: defAddr.id,
            street: defAddr.street,
            city: defAddr.city,
            zip: defAddr.zip,
            label: defAddr.label,
          };
          resolvedAddressId = defAddr.id;
        }
      }

      const contactSnapshot = {
        customerId: order.customerId,
        displayName: order.customerName ?? "Cliente",
        email: order.customerEmail ?? null,
      };

      const dietarySnapshot = order.dietarySnapshot ?? {};

      const inserts = distinctDays.map((dayDate) => ({
        tenant_id: tenantId,
        order_id: orderId,
        customer_id: order.customerId,
        delivery_date: dayDate,
        status: "pending" as const,
        delivery_address_id: resolvedAddressId,
        delivery_address_snapshot: addrSnapshot,
        customer_contact_snapshot: contactSnapshot,
        dietary_snapshot: dietarySnapshot,
        delivery_instructions: order.notes,
        legacy_backfill: false,
      }));

      // In case of rescheduling: cancel pending delivery services for dates no longer in the order
      await db
        .from("delivery_services")
        .update({ status: "cancelled", issue_notes: "Order items rescheduled" })
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .eq("status", "pending")
        .not("delivery_date", "in", `(${distinctDays.map((d) => `"${d}"`).join(",")})`);

      const { data, error } = await db
        .from("delivery_services")
        .upsert(inserts, { onConflict: "tenant_id,order_id,delivery_date" })
        .select("*");
      if (error) throw error;
      return (data ?? []).map(mapDeliveryServiceRow);
    },

    async cancelDeliveryServicesForOrder(orderId: string, reason?: string): Promise<void> {
      await db
        .from("delivery_services")
        .update({
          status: "cancelled",
          issue_notes: reason ?? "Order cancelled",
        })
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .in("status", ["pending", "packed"]);
    },
  };
}
