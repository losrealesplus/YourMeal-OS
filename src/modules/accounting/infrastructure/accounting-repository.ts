/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  deriveInvoiceLifecycleStage,
  derivePeriodReadyToClose,
  type BillableOrder,
  type InvoiceRecord,
  type InvoiceStatus,
  type PaymentRecord,
  type PeriodSummary,
} from "../domain/accounting";

type Client = SupabaseClient<Database>;

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0);
}

export function createAccountingRepository(
  supabase: Client,
  tenantId: string,
) {
  const db = supabase as any;

  async function isPeriodClosed(billingPeriod: string): Promise<{
    closed: boolean;
    closedAt: string | null;
  }> {
    const { data, error } = await db
      .from("financial_period_closures")
      .select("closed_at")
      .eq("tenant_id", tenantId)
      .eq("billing_period", billingPeriod)
      .maybeSingle();
    if (error) throw error;
    return {
      closed: Boolean(data),
      closedAt: data?.closed_at ?? null,
    };
  }

  function mapInvoice(
    inv: {
      id: string;
      customer_id: string | null;
      company_id: string | null;
      amount: number | string;
      status: InvoiceStatus;
      billing_period: string | null;
      created_at: string;
      reviewed_at: string | null;
      customers: { display_name: string | null } | null;
      companies: { name: string | null } | null;
    },
    orderIds: string[],
    paidTotal: number,
    periodClosed: boolean,
  ): InvoiceRecord {
    const reviewedAt = inv.reviewed_at ?? null;
    return {
      id: inv.id,
      customerId: inv.customer_id,
      customerName: inv.customers?.display_name ?? null,
      companyId: inv.company_id,
      companyName: inv.companies?.name ?? null,
      amount: num(inv.amount),
      status: inv.status,
      billingPeriod: inv.billing_period,
      createdAt: inv.created_at,
      reviewedAt,
      orderIds,
      paidTotal,
      lifecycleStage: deriveInvoiceLifecycleStage({
        status: inv.status,
        reviewedAt,
        periodClosed,
      }),
    };
  }

  return {
    async listBillableOrders(): Promise<BillableOrder[]> {
      const { data: linked, error: linkErr } = await db
        .from("invoice_orders")
        .select("order_id")
        .eq("tenant_id", tenantId);
      if (linkErr) throw linkErr;
      const linkedIds = new Set(
        ((linked ?? []) as { order_id: string }[]).map((r) => r.order_id),
      );

      const { data, error } = await db
        .from("orders")
        .select(
          "id, customer_id, company_id, total, status, created_at, customers(display_name), companies(name)",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "delivered")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      return ((data ?? []) as Array<{
        id: string;
        customer_id: string | null;
        company_id: string | null;
        total: number | string;
        status: string;
        created_at: string;
        customers: { display_name: string | null } | null;
        companies: { name: string | null } | null;
      }>)
        .filter((o) => !linkedIds.has(o.id))
        .map((o) => ({
          id: o.id,
          customerId: o.customer_id,
          customerName: o.customers?.display_name ?? null,
          companyId: o.company_id,
          companyName: o.companies?.name ?? null,
          total: num(o.total),
          deliveredAt: o.created_at,
          status: o.status,
        }));
    },

    async listInvoices(billingPeriod?: string | null): Promise<InvoiceRecord[]> {
      let q = db
        .from("invoices")
        .select(
          "id, customer_id, company_id, amount, status, billing_period, created_at, reviewed_at, customers(display_name), companies(name)",
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (billingPeriod) q = q.eq("billing_period", billingPeriod);
      const { data, error } = await q;
      if (error) throw error;

      const invoices = (data ?? []) as Array<{
        id: string;
        customer_id: string | null;
        company_id: string | null;
        amount: number | string;
        status: InvoiceStatus;
        billing_period: string | null;
        created_at: string;
        reviewed_at: string | null;
        customers: { display_name: string | null } | null;
        companies: { name: string | null } | null;
      }>;

      if (invoices.length === 0) return [];

      const periodFlags = new Map<string, boolean>();
      const periods = [
        ...new Set(
          invoices.map((i) => i.billing_period).filter(Boolean) as string[],
        ),
      ];
      await Promise.all(
        periods.map(async (p) => {
          const { closed } = await isPeriodClosed(p);
          periodFlags.set(p, closed);
        }),
      );

      const ids = invoices.map((i) => i.id);
      const [{ data: links }, { data: pays }] = await Promise.all([
        db
          .from("invoice_orders")
          .select("invoice_id, order_id")
          .eq("tenant_id", tenantId)
          .in("invoice_id", ids),
        db
          .from("payments")
          .select("invoice_id, amount, status")
          .eq("tenant_id", tenantId)
          .in("invoice_id", ids)
          .is("deleted_at", null),
      ]);

      const ordersByInvoice = new Map<string, string[]>();
      for (const row of (links ?? []) as {
        invoice_id: string;
        order_id: string;
      }[]) {
        const list = ordersByInvoice.get(row.invoice_id) ?? [];
        list.push(row.order_id);
        ordersByInvoice.set(row.invoice_id, list);
      }

      const paidByInvoice = new Map<string, number>();
      for (const row of (pays ?? []) as {
        invoice_id: string;
        amount: number | string;
        status: string;
      }[]) {
        if (row.status === "void") continue;
        paidByInvoice.set(
          row.invoice_id,
          (paidByInvoice.get(row.invoice_id) ?? 0) + num(row.amount),
        );
      }

      return invoices.map((inv) =>
        mapInvoice(
          inv,
          ordersByInvoice.get(inv.id) ?? [],
          paidByInvoice.get(inv.id) ?? 0,
          inv.billing_period
            ? (periodFlags.get(inv.billing_period) ?? false)
            : false,
        ),
      );
    },

    async getOrdersByIds(orderIds: string[]): Promise<
      Array<{
        id: string;
        customer_id: string | null;
        company_id: string | null;
        total: number;
        status: string;
      }>
    > {
      const { data, error } = await db
        .from("orders")
        .select("id, customer_id, company_id, total, status")
        .eq("tenant_id", tenantId)
        .in("id", orderIds)
        .is("deleted_at", null);
      if (error) throw error;
      return ((data ?? []) as Array<{
        id: string;
        customer_id: string | null;
        company_id: string | null;
        total: number | string;
        status: string;
      }>).map((o) => ({
        id: o.id,
        customer_id: o.customer_id,
        company_id: o.company_id,
        total: num(o.total),
        status: o.status,
      }));
    },

    async createInvoice(input: {
      customerId: string | null;
      companyId: string | null;
      amount: number;
      billingPeriod: string;
      orderIds: string[];
    }): Promise<InvoiceRecord> {
      const { closed } = await isPeriodClosed(input.billingPeriod);
      if (closed) {
        throw new Error(`Period ${input.billingPeriod} is already closed`);
      }

      const { data, error } = await db
        .from("invoices")
        .insert({
          tenant_id: tenantId,
          customer_id: input.customerId,
          company_id: input.companyId,
          amount: input.amount,
          status: "pending",
          billing_period: input.billingPeriod,
        })
        .select(
          "id, customer_id, company_id, amount, status, billing_period, created_at, reviewed_at",
        )
        .single();
      if (error) throw error;

      const links = input.orderIds.map((orderId) => ({
        tenant_id: tenantId,
        invoice_id: data.id,
        order_id: orderId,
      }));
      const { error: linkErr } = await db.from("invoice_orders").insert(links);
      if (linkErr) throw linkErr;

      return mapInvoice(
        {
          ...data,
          customers: null,
          companies: null,
        },
        input.orderIds,
        0,
        false,
      );
    },

    async getInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
      const { data, error } = await db
        .from("invoices")
        .select(
          "id, customer_id, company_id, amount, status, billing_period, created_at, reviewed_at, customers(display_name), companies(name)",
        )
        .eq("tenant_id", tenantId)
        .eq("id", invoiceId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const periodClosed = data.billing_period
        ? (await isPeriodClosed(data.billing_period)).closed
        : false;

      const [{ data: links }, { data: pays }] = await Promise.all([
        db
          .from("invoice_orders")
          .select("order_id")
          .eq("tenant_id", tenantId)
          .eq("invoice_id", invoiceId),
        db
          .from("payments")
          .select("amount, status")
          .eq("tenant_id", tenantId)
          .eq("invoice_id", invoiceId)
          .is("deleted_at", null),
      ]);

      const orderIds = ((links ?? []) as { order_id: string }[]).map(
        (r) => r.order_id,
      );
      const paidTotal = ((pays ?? []) as { amount: number | string; status: string }[])
        .filter((p) => p.status !== "void")
        .reduce((s, p) => s + num(p.amount), 0);

      return mapInvoice(data, orderIds, paidTotal, periodClosed);
    },

    async markInvoiceReviewed(invoiceId: string): Promise<void> {
      const { error } = await db
        .from("invoices")
        .update({ reviewed_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", invoiceId)
        .is("deleted_at", null)
        .is("reviewed_at", null);
      if (error) throw error;
    },

    async updateInvoiceStatus(
      invoiceId: string,
      status: InvoiceStatus,
    ): Promise<void> {
      const { error } = await db
        .from("invoices")
        .update({ status })
        .eq("tenant_id", tenantId)
        .eq("id", invoiceId)
        .is("deleted_at", null);
      if (error) throw error;
    },

    async insertPayment(input: {
      invoiceId: string;
      amount: number;
      method: string | null;
    }): Promise<PaymentRecord> {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from("payments")
        .insert({
          tenant_id: tenantId,
          invoice_id: input.invoiceId,
          amount: input.amount,
          method: input.method,
          paid_at: now,
          status: "completed",
        })
        .select("id, invoice_id, amount, method, paid_at, status")
        .single();
      if (error) throw error;
      return {
        id: data.id,
        invoiceId: data.invoice_id,
        amount: num(data.amount),
        method: data.method,
        paidAt: data.paid_at,
        status: data.status,
      };
    },

    async periodSummary(billingPeriod: string): Promise<PeriodSummary> {
      const invoices = await this.listInvoices(billingPeriod);
      const { closed, closedAt } = await isPeriodClosed(billingPeriod);
      const pendingCount = invoices.filter((i) => i.status === "pending").length;
      const paidCount = invoices.filter((i) => i.status === "paid").length;
      const voidCount = invoices.filter((i) => i.status === "void").length;
      const overdueCount = invoices.filter((i) => i.status === "overdue").length;
      const reviewPendingCount = invoices.filter(
        (i) => i.status === "pending" && !i.reviewedAt,
      ).length;
      const invoicedAmount = invoices
        .filter((i) => i.status !== "void")
        .reduce((s, i) => s + i.amount, 0);
      const paidAmount = invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0);
      const base = {
        invoiceCount: invoices.length,
        pendingCount,
        overdueCount,
      };
      const readyToClose = derivePeriodReadyToClose(base);
      return {
        billingPeriod,
        ...base,
        paidCount,
        voidCount,
        reviewPendingCount,
        invoicedAmount,
        paidAmount,
        readyToClose,
        periodClosed: closed,
        closedAt,
        recordsComplete: closed,
      };
    },

    async closePeriod(
      billingPeriod: string,
      closedBy: string,
      snapshot: { invoiceCount: number; paidAmount: number },
    ): Promise<void> {
      const { error } = await db.from("financial_period_closures").insert({
        tenant_id: tenantId,
        billing_period: billingPeriod,
        closed_by: closedBy,
        invoice_count: snapshot.invoiceCount,
        paid_amount: snapshot.paidAmount,
      });
      if (error) throw error;
    },
  };
}
