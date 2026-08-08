/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  deriveCustomerStatus,
  RECURRING_MIN_ORDERS,
  type CommercialDashboardMetrics,
  type CompanyDirectoryRecord,
  type CustomerKind,
  type CustomerOrderSummary,
  type IndividualCustomerRecord,
  type SupportNoteRecord,
  type SupportStats,
} from "../domain/customer-directory";

type Client = SupabaseClient<Database>;

type RawCustomer = {
  id: string;
  display_name: string | null;
  email: string | null;
  kind: string;
  created_at: string;
  user_id: string | null;
};

type RawOrder = {
  id: string;
  customer_id: string;
  company_id: string | null;
  status: string;
  total: number | string;
  created_at: string;
  demand_channel: string | null;
};

type RawPhone = {
  customer_id: string;
  phone: string;
  is_primary: boolean;
};

type RawAddress = {
  customer_id: string;
  city: string | null;
  is_default: boolean;
};

type RawMembership = {
  customer_id: string;
  company_id: string;
  status: string;
  deleted_at: string | null;
  companies: { id: string; name: string; company_code: string } | null;
};

type RawCompany = {
  id: string;
  name: string;
  company_code: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

const BILLABLE = new Set([
  "confirmed",
  "in_production",
  "prepared",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
]);

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function weekdayName(iso: string): string {
  const names = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  return names[new Date(iso).getUTCDay()] ?? "—";
}

/**
 * Persistence for Customer Directory. Uses `any` where generated Database
 * types lag B2B / soft-delete columns.
 */
export function createCustomerDirectoryRepository(
  client: Client,
  tenantId: string,
) {
  const db = client as any;

  async function loadCustomers(): Promise<RawCustomer[]> {
    const { data, error } = await db
      .from("customers")
      .select("id, display_name, email, kind, created_at, user_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as RawCustomer[];
  }

  async function loadOrders(): Promise<RawOrder[]> {
    const { data, error } = await db
      .from("orders")
      .select(
        "id, customer_id, company_id, status, total, created_at, demand_channel",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as RawOrder[];
  }

  async function loadPhones(customerIds: string[]): Promise<RawPhone[]> {
    if (customerIds.length === 0) return [];
    const { data, error } = await db
      .from("customer_phones")
      .select("customer_id, phone, is_primary")
      .eq("tenant_id", tenantId)
      .in("customer_id", customerIds)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as RawPhone[];
  }

  async function loadAddresses(customerIds: string[]): Promise<RawAddress[]> {
    if (customerIds.length === 0) return [];
    const { data, error } = await db
      .from("customer_addresses")
      .select("customer_id, city, is_default")
      .eq("tenant_id", tenantId)
      .in("customer_id", customerIds)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as RawAddress[];
  }

  async function loadMemberships(): Promise<RawMembership[]> {
    const { data, error } = await db
      .from("company_employees")
      .select(
        "customer_id, company_id, status, deleted_at, companies(id, name, company_code)",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as RawMembership[];
  }

  async function loadCompanies(): Promise<RawCompany[]> {
    const { data, error } = await db
      .from("companies")
      .select(
        "id, name, company_code, contact_name, contact_email, contact_phone, created_at",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name");
    if (error) throw error;
    return (data ?? []) as RawCompany[];
  }

  function buildIndividualRecords(
    customers: RawCustomer[],
    orders: RawOrder[],
    phones: RawPhone[],
    addresses: RawAddress[],
    memberships: RawMembership[],
  ): IndividualCustomerRecord[] {
    const ordersByCustomer = new Map<string, RawOrder[]>();
    for (const o of orders) {
      const list = ordersByCustomer.get(o.customer_id) ?? [];
      list.push(o);
      ordersByCustomer.set(o.customer_id, list);
    }

    const phoneByCustomer = new Map<string, string>();
    for (const p of phones) {
      if (!phoneByCustomer.has(p.customer_id) || p.is_primary) {
        phoneByCustomer.set(p.customer_id, p.phone);
      }
    }

    const cityByCustomer = new Map<string, string>();
    for (const a of addresses) {
      if (!a.city) continue;
      if (!cityByCustomer.has(a.customer_id) || a.is_default) {
        cityByCustomer.set(a.customer_id, a.city);
      }
    }

    const membershipByCustomer = new Map<string, RawMembership>();
    for (const m of memberships) {
      if (m.status !== "active") continue;
      membershipByCustomer.set(m.customer_id, m);
    }

    return customers.map((c) => {
      const custOrders = ordersByCustomer.get(c.id) ?? [];
      const billable = custOrders.filter((o) => BILLABLE.has(o.status));
      const lifetimeTotal = billable.reduce((s, o) => s + num(o.total), 0);
      const orderCount = billable.length;
      const lastOrderAt =
        custOrders
          .map((o) => o.created_at)
          .sort()
          .at(-1) ?? null;
      const membership = membershipByCustomer.get(c.id) ?? null;
      const kind = (c.kind === "company_employee"
        ? "company_employee"
        : "individual") as CustomerKind;

      return {
        id: c.id,
        displayName: c.display_name,
        email: c.email,
        phone: phoneByCustomer.get(c.id) ?? null,
        kind,
        status: deriveCustomerStatus({
          createdAt: c.created_at,
          lastOrderAt,
          orderCount,
        }),
        createdAt: c.created_at,
        lastOrderAt,
        orderCount,
        averageTicket: orderCount > 0 ? lifetimeTotal / orderCount : 0,
        lifetimeTotal,
        companyId: membership?.company_id ?? null,
        companyName: membership?.companies?.name ?? null,
        companyCode: membership?.companies?.company_code ?? null,
        city: cityByCustomer.get(c.id) ?? null,
      };
    });
  }

  function buildCompanyRecords(
    companies: RawCompany[],
    memberships: RawMembership[],
    orders: RawOrder[],
  ): CompanyDirectoryRecord[] {
    const employeesByCompany = new Map<string, number>();
    for (const m of memberships) {
      if (m.status !== "active") continue;
      employeesByCompany.set(
        m.company_id,
        (employeesByCompany.get(m.company_id) ?? 0) + 1,
      );
    }

    const ordersByCompany = new Map<string, RawOrder[]>();
    for (const o of orders) {
      if (!o.company_id) continue;
      const list = ordersByCompany.get(o.company_id) ?? [];
      list.push(o);
      ordersByCompany.set(o.company_id, list);
    }

    const activeSince = startOfDaysAgo(30).toISOString();

    return companies.map((co) => {
      const coOrders = (ordersByCompany.get(co.id) ?? []).filter((o) =>
        BILLABLE.has(o.status),
      );
      const lifetimeTotal = coOrders.reduce((s, o) => s + num(o.total), 0);
      const recent = coOrders.some((o) => o.created_at >= activeSince);
      return {
        id: co.id,
        name: co.name,
        companyCode: co.company_code,
        contactName: co.contact_name,
        contactEmail: co.contact_email,
        contactPhone: co.contact_phone,
        employeeCount: employeesByCompany.get(co.id) ?? 0,
        orderCount: coOrders.length,
        lifetimeTotal,
        status: recent || (employeesByCompany.get(co.id) ?? 0) > 0
          ? "active"
          : "inactive",
        createdAt: co.created_at,
      };
    });
  }

  return {
    async listIndividuals(): Promise<IndividualCustomerRecord[]> {
      const customers = await loadCustomers();
      const ids = customers.map((c) => c.id);
      const [orders, phones, addresses, memberships] = await Promise.all([
        loadOrders(),
        loadPhones(ids),
        loadAddresses(ids),
        loadMemberships(),
      ]);
      return buildIndividualRecords(
        customers,
        orders,
        phones,
        addresses,
        memberships,
      );
    },

    async listCompanies(): Promise<CompanyDirectoryRecord[]> {
      const [companies, memberships, orders] = await Promise.all([
        loadCompanies(),
        loadMemberships(),
        loadOrders(),
      ]);
      return buildCompanyRecords(companies, memberships, orders);
    },

    async getCustomerOrders(
      customerId: string,
    ): Promise<CustomerOrderSummary[]> {
      const { data, error } = await db
        .from("orders")
        .select(
          "id, status, total, created_at, demand_channel, company_id",
        )
        .eq("tenant_id", tenantId)
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data ?? []) as RawOrder[]).map((o) => ({
        id: o.id,
        status: o.status,
        total: num(o.total),
        createdAt: o.created_at,
        demandChannel: o.demand_channel,
        companyId: o.company_id,
      }));
    },

    async listSupportNotes(customerId?: string): Promise<SupportNoteRecord[]> {
      let q = db
        .from("support_notes")
        .select(
          "id, customer_id, kind, status, body, author_id, created_at, resolved_at, closed_at, customers(display_name)",
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (customerId) q = q.eq("customer_id", customerId);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as Array<{
        id: string;
        customer_id: string;
        kind: SupportNoteRecord["kind"];
        status: SupportNoteRecord["status"];
        body: string;
        author_id: string | null;
        created_at: string;
        resolved_at: string | null;
        closed_at: string | null;
        customers: { display_name: string | null } | null;
      }>).map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customers?.display_name ?? null,
        kind: row.kind,
        status: row.status ?? "open",
        body: row.body,
        authorId: row.author_id,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
        closedAt: row.closed_at,
      }));
    },

    async insertSupportNote(input: {
      customerId: string;
      kind: SupportNoteRecord["kind"];
      body: string;
      authorId: string;
    }): Promise<SupportNoteRecord> {
      const { data, error } = await db
        .from("support_notes")
        .insert({
          tenant_id: tenantId,
          customer_id: input.customerId,
          kind: input.kind,
          body: input.body,
          author_id: input.authorId,
          status: "open",
        })
        .select(
          "id, customer_id, kind, status, body, author_id, created_at, resolved_at, closed_at",
        )
        .single();
      if (error) throw error;
      return {
        id: data.id,
        customerId: data.customer_id,
        customerName: null,
        kind: data.kind,
        status: data.status ?? "open",
        body: data.body,
        authorId: data.author_id,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at ?? null,
        closedAt: data.closed_at ?? null,
      };
    },

    async transitionSupportNote(
      noteId: string,
      toStatus: SupportNoteRecord["status"],
      opts?: { preserveResolvedAt?: string | null },
    ): Promise<SupportNoteRecord> {
      const now = new Date().toISOString();
      const patch: Record<string, string> = { status: toStatus };
      if (toStatus === "resolved") patch.resolved_at = now;
      if (toStatus === "closed") {
        patch.closed_at = now;
        // open → closed: stamp resolved_at; resolved → closed: keep original
        if (!opts?.preserveResolvedAt) patch.resolved_at = now;
      }

      const { data, error } = await db
        .from("support_notes")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", noteId)
        .is("deleted_at", null)
        .select(
          "id, customer_id, kind, status, body, author_id, created_at, resolved_at, closed_at",
        )
        .single();
      if (error) throw error;
      return {
        id: data.id,
        customerId: data.customer_id,
        customerName: null,
        kind: data.kind,
        status: data.status,
        body: data.body,
        authorId: data.author_id,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at ?? null,
        closedAt: data.closed_at ?? null,
      };
    },

    async getSupportNote(noteId: string): Promise<SupportNoteRecord | null> {
      const { data, error } = await db
        .from("support_notes")
        .select(
          "id, customer_id, kind, status, body, author_id, created_at, resolved_at, closed_at",
        )
        .eq("tenant_id", tenantId)
        .eq("id", noteId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        customerId: data.customer_id,
        customerName: null,
        kind: data.kind,
        status: data.status ?? "open",
        body: data.body,
        authorId: data.author_id,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at ?? null,
        closedAt: data.closed_at ?? null,
      };
    },

    async softDeleteCustomer(customerId: string): Promise<void> {
      const { error } = await db
        .from("customers")
        .update({ deleted_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", customerId)
        .is("deleted_at", null);
      if (error) throw error;
    },

    /**
     * Staff alta mínima (EXPERIENCE LAW 001) — name required;
     * phone / address optional (Progressive Completion).
     */
    async insertIndividualWithContact(input: {
      displayName: string;
      phone?: string | null;
      street?: string | null;
      city?: string | null;
    }): Promise<string> {
      const name = input.displayName.trim();
      if (!name) {
        throw new Error("displayName is required");
      }
      const { data, error } = await db
        .from("customers")
        .insert({
          tenant_id: tenantId,
          display_name: name,
          kind: "individual",
          user_id: null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const customerId = String(data.id);

      const phone = input.phone?.trim();
      if (phone) {
        const { error: phoneErr } = await db.from("customer_phones").insert({
          tenant_id: tenantId,
          customer_id: customerId,
          phone,
          is_primary: true,
        });
        if (phoneErr) throw phoneErr;
      }

      const street = input.street?.trim();
      if (street) {
        const { error: addrErr } = await db.from("customer_addresses").insert({
          tenant_id: tenantId,
          customer_id: customerId,
          street,
          city: input.city?.trim() || null,
          is_default: true,
          label: "Principal",
        });
        if (addrErr) throw addrErr;
      }

      return customerId;
    },

    async commercialMetrics(): Promise<CommercialDashboardMetrics> {
      const [customers, companies, memberships, orders] = await Promise.all([
        loadCustomers(),
        loadCompanies(),
        loadMemberships(),
        loadOrders(),
      ]);
      const individuals = buildIndividualRecords(
        customers,
        orders,
        [],
        [],
        memberships,
      );
      const companyRows = buildCompanyRecords(companies, memberships, orders);

      const weekStart = startOfDaysAgo(7).toISOString();
      const monthStart = startOfDaysAgo(30).toISOString();
      const billable = orders.filter((o) => BILLABLE.has(o.status));
      const weekly = billable.filter((o) => o.created_at >= weekStart);
      const monthly = billable.filter((o) => o.created_at >= monthStart);
      const monthlyTotal = monthly.reduce((s, o) => s + num(o.total), 0);

      const dayCounts = new Map<string, number>();
      const hourCounts = new Map<number, number>();
      for (const o of billable) {
        const day = weekdayName(o.created_at);
        dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
        const hour = new Date(o.created_at).getUTCHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
      const peakPurchaseDay =
        [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const troughPurchaseDay =
        [...dayCounts.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
      const peakPurchaseHour =
        [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const topCustomers = [...individuals]
        .sort((a, b) => b.lifetimeTotal - a.lifetimeTotal)
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          name: c.displayName || c.email || c.id.slice(0, 8),
          orderCount: c.orderCount,
          total: c.lifetimeTotal,
        }));

      const topCompanies = [...companyRows]
        .sort((a, b) => b.lifetimeTotal - a.lifetimeTotal)
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          name: c.name,
          orderCount: c.orderCount,
          total: c.lifetimeTotal,
        }));

      // Top menus ≈ top dish names via order_items → dishes
      let topMenus: Array<{ name: string; count: number }> = [];
      const orderIds = billable.map((o) => o.id);
      if (orderIds.length > 0) {
        const { data: items, error: itemsErr } = await db
          .from("order_items")
          .select("qty, dish_id, dishes(name)")
          .eq("tenant_id", tenantId)
          .in("order_id", orderIds.slice(0, 500))
          .is("deleted_at", null);
        if (!itemsErr && items) {
          const counts = new Map<string, number>();
          for (const it of items as Array<{
            qty: number;
            dishes: { name: string } | null;
          }>) {
            const name = it.dishes?.name?.trim() || "Sin nombre";
            counts.set(name, (counts.get(name) ?? 0) + Number(it.qty || 1));
          }
          topMenus = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        }
      }

      const withOrders = individuals.filter((c) => c.orderCount > 0);
      let frequencySum = 0;
      let frequencyN = 0;
      for (const c of withOrders) {
        if (c.orderCount < 2 || !c.lastOrderAt) continue;
        const span = Math.max(
          1,
          (new Date(c.lastOrderAt).getTime() -
            new Date(c.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        frequencySum += span / (c.orderCount - 1);
        frequencyN += 1;
      }

      return {
        totalCustomers: individuals.length,
        activeCustomers: individuals.filter((c) => c.status === "active")
          .length,
        newCustomers: individuals.filter((c) => c.status === "new").length,
        companies: companyRows.length,
        activeCompanies: companyRows.filter((c) => c.status === "active")
          .length,
        linkedEmployees: memberships.filter((m) => m.status === "active")
          .length,
        weeklyOrders: weekly.length,
        monthlyOrders: monthly.length,
        averageTicket: monthly.length > 0 ? monthlyTotal / monthly.length : 0,
        recurringCustomers: individuals.filter(
          (c) => c.orderCount >= RECURRING_MIN_ORDERS,
        ).length,
        inactiveCustomers: individuals.filter((c) => c.status === "inactive")
          .length,
        peakPurchaseDay,
        troughPurchaseDay,
        peakPurchaseHour,
        purchaseFrequencyDays:
          frequencyN > 0 ? Math.round(frequencySum / frequencyN) : null,
        companiesWithoutOrders: companyRows.filter((c) => c.orderCount === 0)
          .length,
        topCompanies,
        topCustomers,
        topMenus,
      };
    },

    async supportStats(): Promise<SupportStats> {
      const metrics = await this.commercialMetrics();
      const companies = await this.listCompanies();
      const { count: openIncidents, error } = await db
        .from("support_notes")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("kind", ["incident", "complaint"])
        .eq("status", "open")
        .is("deleted_at", null);
      if (error) throw error;

      const { count: pendingOrders, error: poErr } = await db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", [
          "confirmed",
          "in_production",
          "prepared",
          "ready_for_delivery",
          "out_for_delivery",
        ])
        .is("deleted_at", null);
      if (poErr) throw poErr;

      return {
        activeCustomers: metrics.activeCustomers,
        inactiveCustomers: metrics.inactiveCustomers,
        recurringCustomers: metrics.recurringCustomers,
        activeCompanies: metrics.activeCompanies,
        companiesWithoutOrders: companies.filter((c) => c.orderCount === 0)
          .length,
        openIncidents: openIncidents ?? 0,
        pendingOrders: pendingOrders ?? 0,
      };
    },
  };
}

export type CustomerDirectoryRepository = ReturnType<
  typeof createCustomerDirectoryRepository
>;
