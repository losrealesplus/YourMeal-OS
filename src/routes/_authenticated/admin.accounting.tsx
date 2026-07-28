/**
 * Accounting Workspace — Financial Records Complete (EP-OPS-003 Correction P0).
 * Lifecycle: Pending → Review → Processed → Closed (period).
 * Grounds invoices in delivered orders. No simulated amounts.
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AdminHeader,
  DataTable,
  KpiCard,
  PanelCard,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { useFmt } from "@/i18n/localization-provider";
import { useAuth } from "@/hooks/use-auth";
import { useCan } from "@/hooks/use-can";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  AccountingService,
  currentBillingPeriod,
  type BillableOrder,
  type InvoiceRecord,
  type PeriodSummary,
} from "@/modules/accounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/accounting")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "accounting.operate");
  },
  component: AdminAccountingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Contabilidad" },
      {
        name: "description",
        content:
          "Financial Lifecycle: Pending → Review → Processed → Closed.",
      },
    ],
  }),
});

function AdminAccountingPage() {
  const fmt = useFmt();
  const { user, tenantId, roles } = useAuth();
  const { can } = useCan();
  const [period, setPeriod] = useState(currentBillingPeriod());
  const [billable, setBillable] = useState<BillableOrder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const [orders, inv, sum] = await Promise.all([
        AccountingService.listBillableOrders(ctx),
        AccountingService.listInvoices(ctx, period),
        AccountingService.periodSummary(ctx, period),
      ]);
      setBillable(orders);
      setInvoices(inv);
      setSummary(sum);
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles, period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedTotal = useMemo(
    () =>
      billable
        .filter((o) => selected.has(o.id))
        .reduce((s, o) => s + o.total, 0),
    [billable, selected],
  );

  function toggleOrder(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function withCtx(
    fn: (ctx: Awaited<ReturnType<typeof createServiceContext>>) => Promise<void>,
  ) {
    if (!user || !tenantId || !can("accounting.operate")) return;
    setBusy(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      await fn(ctx);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const billableColumns: Column<BillableOrder>[] = [
    {
      key: "sel",
      header: "",
      render: (r) => (
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={() => toggleOrder(r.id)}
          disabled={!can("accounting.operate") || summary?.periodClosed}
          aria-label={`Seleccionar pedido ${r.id.slice(0, 8)}`}
        />
      ),
    },
    {
      key: "party",
      header: "Cliente",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {r.customerName || r.companyName || "—"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {r.id.slice(0, 8)} · {fmt.date(r.deliveredAt, "short")}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      render: (r) => (
        <span className="font-mono tabular-nums">
          {fmt.currency(r.total, { currency: "EUR" })}
        </span>
      ),
    },
  ];

  const invoiceColumns: Column<InvoiceRecord>[] = [
    {
      key: "inv",
      header: "Factura",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {r.customerName || r.companyName || r.id.slice(0, 8)}
          </p>
          <p className="text-xs text-muted-foreground">
            {r.orderIds.length} pedido(s) · {r.billingPeriod || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Importe",
      className: "text-right",
      render: (r) => (
        <span className="font-mono tabular-nums">
          {fmt.currency(r.amount, { currency: "EUR" })}
        </span>
      ),
    },
    {
      key: "lifecycle",
      header: "Lifecycle",
      render: (r) => (
        <StatusChip
          tone={
            r.lifecycleStage === "closed"
              ? "positive"
              : r.lifecycleStage === "processed"
                ? "positive"
                : r.lifecycleStage === "review"
                  ? "info"
                  : "warning"
          }
          label={r.lifecycleStage}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => {
        if (!can("accounting.operate") || summary?.periodClosed) return null;
        if (r.status === "pending" && !r.reviewedAt) {
          return (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void withCtx(async (ctx) => {
                  await AccountingService.reviewInvoice(ctx, r.id);
                  toast.success("Factura en Review");
                })
              }
            >
              Revisar
            </Button>
          );
        }
        if (
          (r.status === "pending" || r.status === "overdue") &&
          r.reviewedAt
        ) {
          return (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void withCtx(async (ctx) => {
                    await AccountingService.recordPayment(ctx, {
                      invoiceId: r.id,
                      method: "manual",
                    });
                    toast.success("Procesado (cobro registrado)");
                  })
                }
              >
                Procesar cobro
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void withCtx(async (ctx) => {
                    await AccountingService.voidInvoice(ctx, r.id);
                    toast.success("Factura anulada");
                  })
                }
              >
                Anular
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline="Contabilidad"
        title="Financial Workspace"
        subtitle="Pending → Review → Processed → Closed · anclado a Orders Delivered."
      />
      <AdminHeader
        goal="Financial Records Complete"
        capability="accounting.operate"
        object="Invoice · Payment · PeriodClosure"
      />

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <Label htmlFor="billing-period">Periodo (YYYY-MM)</Label>
          <Input
            id="billing-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-1 w-36"
            pattern="\d{4}-\d{2}"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Actualizar
        </Button>
        {can("accounting.operate") && summary?.readyToClose && !summary.periodClosed ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void withCtx(async (ctx) => {
                await AccountingService.closeFinancialPeriod(ctx, period);
                toast.success("Periodo cerrado · Financial Records Complete");
              })
            }
          >
            Cerrar periodo
          </Button>
        ) : null}
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <KpiCard label="Facturas" value={String(summary.invoiceCount)} />
          <KpiCard label="Pending" value={String(summary.pendingCount)} />
          <KpiCard
            label="Por revisar"
            value={String(summary.reviewPendingCount)}
          />
          <KpiCard
            label="Cobrado"
            value={fmt.currency(summary.paidAmount, { currency: "EUR" })}
          />
          <KpiCard
            label="Periodo"
            value={
              summary.periodClosed
                ? "Closed"
                : summary.readyToClose
                  ? "Ready"
                  : "Open"
            }
          />
        </div>
      ) : null}

      {summary?.periodClosed ? (
        <p
          className={cn(
            "mb-6 text-sm rounded-xl border border-border bg-card px-4 py-3",
          )}
        >
          Outcome <strong>Financial Records Complete</strong> para{" "}
          {summary.billingPeriod}
          {summary.closedAt
            ? ` · cerrado ${fmt.date(summary.closedAt, "medium")}`
            : ""}
          .
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <PanelCard>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
            Pending Financial Items
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pedidos `delivered` sin factura · Input Orders Delivered.
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Cargando…
            </p>
          ) : (
            <>
              <DataTable
                columns={billableColumns}
                rows={billable}
                empty="No hay pedidos delivered pendientes de facturar."
              />
              {can("accounting.operate") &&
              selected.size > 0 &&
              !summary?.periodClosed ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    {selected.size} seleccionado(s) ·{" "}
                    <span className="font-mono">
                      {fmt.currency(selectedTotal, { currency: "EUR" })}
                    </span>
                  </p>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void withCtx(async (ctx) => {
                        await AccountingService.createInvoiceFromOrders(ctx, {
                          orderIds: [...selected],
                          billingPeriod: period,
                        });
                        toast.success("Factura emitida (Pending)");
                      })
                    }
                  >
                    Emitir factura
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </PanelCard>

        <PanelCard>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-2">
            Invoice / Payment Status · {period}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review → Procesar cobro → Closed (periodo).
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Cargando…
            </p>
          ) : (
            <DataTable
              columns={invoiceColumns}
              rows={invoices}
              empty="Sin facturas en este periodo."
            />
          )}
        </PanelCard>
      </div>
    </div>
  );
}
