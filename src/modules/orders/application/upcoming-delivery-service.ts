/**
 * EP-002A.1 — UpcomingDeliveryService
 * Encapsulates "which order is the next delivery?" for Customer Home.
 */
import { supabase } from "@/integrations/supabase/client";
import { createOrderRepository } from "../infrastructure/order-repository";
import {
  selectUpcomingDelivery,
  type UpcomingCandidate,
  type UpcomingDeliveryAddress,
  type UpcomingDeliveryResult,
} from "../domain/upcoming-delivery";

type OrderListRow = {
  id: string;
  week_start: string;
  status: string;
  total: number | string;
  delivery_address_id?: string | null;
  order_items?: Array<{ id: string; day_date: string; qty: number }> | null;
};

function formatAddressLine(row: {
  label: string | null;
  street: string;
  city: string | null;
}): UpcomingDeliveryAddress {
  const cityPart = row.city?.trim() || null;
  return {
    label: row.label?.trim() || null,
    line: row.street.trim(),
    city: cityPart,
  };
}

export const UpcomingDeliveryService = {
  /**
   * Resolve the customer's single upcoming delivery (or none).
   * Never invents windows or addresses.
   */
  async getForUser(
    tenantId: string,
    userId: string,
  ): Promise<UpcomingDeliveryResult> {
    const repo = createOrderRepository(supabase, tenantId);
    const customerId = await repo.findCustomerIdForUser(userId);
    if (!customerId) return { kind: "none" };

    const db = supabase as any;
    const { data: orders, error } = await db
      .from("orders")
      .select(
        "id, week_start, status, total, delivery_address_id, order_items(id, day_date, qty)",
      )
      .eq("tenant_id", tenantId)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("week_start", { ascending: true });
    if (error) throw error;

    const rows = (orders ?? []) as OrderListRow[];
    if (rows.length === 0) return { kind: "none" };

    const addressIds = [
      ...new Set(
        rows
          .map((r) => r.delivery_address_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const addressById = new Map<string, UpcomingDeliveryAddress>();
    if (addressIds.length > 0) {
      const { data: addrs, error: aErr } = await db
        .from("customer_addresses")
        .select("id, label, street, city, is_default")
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .in("id", addressIds)
        .is("deleted_at", null);
      if (aErr) throw aErr;
      for (const a of (addrs ?? []) as Array<{
        id: string;
        label: string | null;
        street: string;
        city: string | null;
      }>) {
        addressById.set(a.id, formatAddressLine(a));
      }
    }

    let defaultAddress: UpcomingDeliveryAddress | null = null;
    const { data: defaults, error: dErr } = await db
      .from("customer_addresses")
      .select("id, label, street, city, is_default")
      .eq("tenant_id", tenantId)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .limit(1);
    if (dErr) throw dErr;
    const def = (defaults ?? [])[0] as
      | {
          label: string | null;
          street: string;
          city: string | null;
        }
      | undefined;
    if (def) defaultAddress = formatAddressLine(def);

    const candidates: UpcomingCandidate[] = rows.map((row) => {
      const items = row.order_items ?? [];
      const days = items
        .map((i) => i.day_date)
        .filter(Boolean)
        .sort();
      const deliveryDate = days[0] ?? row.week_start;
      const itemCount = items.reduce((s, i) => s + Number(i.qty || 1), 0);
      const address =
        (row.delivery_address_id
          ? addressById.get(row.delivery_address_id)
          : null) ?? defaultAddress;

      return {
        id: row.id,
        status: row.status,
        weekStart: row.week_start,
        total: Number(row.total ?? 0),
        deliveryDate,
        itemCount,
        address,
        // No persisted delivery window in schema yet — never invent.
        timeWindowLabel: null,
      };
    });

    return selectUpcomingDelivery(candidates);
  },
};
