import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Download, FileText } from "lucide-react";
import {
  AdminHeader,
  DataTable,
  KpiCard,
  PanelCard,
  SectionTitle,
  StatusChip,
  Toolbar,
} from "@/components/admin";
import type { Column } from "@/components/admin/data-table";
import { MOCK_ACCOUNTING_KPIS, MOCK_INVOICES, type MockInvoice } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Facturación
 * Objetivo operacional: Asegurar el ciclo cobro/facturación y la salud financiera
 * Capability:            accounting.invoicing
 * Core Object:           Invoice + Payment
 */
export const Route = createFileRoute("/_authenticated/admin/accounting")({
  component: AdminAccountingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Facturación" },
      { name: "description", content: "Facturación, cobros y salud financiera del negocio." },
    ],
  }),
});

function AdminAccountingPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const toneByStatus = {
    paid:     "positive" as const,
    pending:  "warning"  as const,
    overdue:  "danger"   as const,
    refunded: "neutral"  as const,
  };

  const columns: Column<MockInvoice>[] = [
    {
      key: "number",
      header: t("invoice", { defaultValue: "Invoice" }),
      render: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-xs font-bold">{r.number}</span>
        </div>
      ),
    },
    {
      key: "customer",
      header: t("customer", { defaultValue: "Customer" }),
      render: (r) => <span className="text-sm font-medium">{r.customer}</span>,
    },
    {
      key: "issued",
      header: t("issued", { defaultValue: "Issued" }),
      render: (r) => <span className="text-xs text-muted-foreground">{fmt.date(r.issuedIso, "medium")}</span>,
    },
    {
      key: "amount",
      header: t("amount", { defaultValue: "Amount" }),
      className: "text-right",
      render: (r) => (
        <span className="font-mono tabular-nums font-bold">
          {fmt.currency(r.totalCents / 100, { currency: r.currency })}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      render: (r) => <StatusChip tone={toneByStatus[r.status]} label={t(`invoiceStatuses.${r.status}`, { defaultValue: r.status })} />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("accounting")}
        title={t("accountingTitle", { defaultValue: "Facturación" })}
        subtitle={t("accountingSubtitle", { defaultValue: "Ingresos, facturas emitidas y estado de los cobros." })}
        trailing={
          <button className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition">
            <Download className="size-3.5" /> {t("exportLedger", { defaultValue: "Export ledger" })}
          </button>
        }
      />
      <AdminHeader
        goal={t("accountingGoal", { defaultValue: "Mantener flujo de caja saludable y facturación al día" })}
        capability="accounting.invoicing"
        object="Invoice · Payment"
      />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        {MOCK_ACCOUNTING_KPIS.map((k) => (
          <KpiCard key={k.key} label={t(k.key, { defaultValue: k.key })} value={k.value} delta={k.delta} trend={k.trend} />
        ))}
      </div>

      <PanelCard>
        <Toolbar
          searchPlaceholder={t("searchInvoices", { defaultValue: "Search invoice or customer…" })}
        />
        <DataTable columns={columns} rows={MOCK_INVOICES} />
      </PanelCard>
    </div>
  );
}
