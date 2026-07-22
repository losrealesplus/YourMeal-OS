import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, Download } from "lucide-react";
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
import { MOCK_ADMIN_CUSTOMERS, type MockAdminCustomer } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Gestión de clientes
 * Objetivo operacional: Conocer y gestionar la base de clientes activa
 * Capability:            customers.manage
 * Core Object:           Customer + Subscription
 */
export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomersPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Clientes" },
      { name: "description", content: "Gestión y seguimiento de la base de clientes." },
    ],
  }),
});

function AdminCustomersPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const toneByStatus = {
    active:  "positive" as const,
    paused:  "warning"  as const,
    churned: "danger"   as const,
  };

  const columns: Column<MockAdminCustomer>[] = [
    {
      key: "name",
      header: t("customer", { defaultValue: "Customer" }),
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">{r.name}</p>
          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: t("plan", { defaultValue: "Plan" }),
      render: (r) => <span className="text-xs font-bold uppercase tracking-widest">{t(`plans.${r.plan}`, { defaultValue: r.plan })}</span>,
    },
    {
      key: "meals",
      header: t("mealsWeek", { defaultValue: "Meals / week" }),
      className: "text-right",
      render: (r) => <span className="font-mono tabular-nums">{r.mealsThisWeek}</span>,
    },
    {
      key: "lifetime",
      header: t("lifetime", { defaultValue: "Lifetime" }),
      className: "text-right",
      render: (r) => <span className="font-mono tabular-nums">{fmt.currency(r.lifetimeCents / 100, { currency: r.currency })}</span>,
    },
    {
      key: "joined",
      header: t("joined", { defaultValue: "Joined" }),
      render: (r) => <span className="text-xs text-muted-foreground">{fmt.date(r.joinedIso, "medium")}</span>,
    },
    {
      key: "status",
      header: t("status", { defaultValue: "Status" }),
      render: (r) => <StatusChip tone={toneByStatus[r.status]} label={t(`statuses.${r.status}`, { defaultValue: r.status })} />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("customers")}
        title={t("customersTitle", { defaultValue: "Gestión de clientes" })}
        subtitle={t("customersSubtitle", { defaultValue: "Segmenta, contacta y monitoriza la actividad de tus clientes." })}
      />
      <AdminHeader
        goal={t("customersGoal", { defaultValue: "Mantener y hacer crecer la base activa" })}
        capability="customers.manage"
        object="Customer · Subscription"
      />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("totalCustomers", { defaultValue: "Total customers" })} value="248" delta="+12" trend="up" />
        <KpiCard label={t("activeSubs", { defaultValue: "Active subscriptions" })} value="196" delta="+7"  trend="up" />
        <KpiCard label={t("paused", { defaultValue: "Paused" })}               value="14"  delta="−2" trend="down" />
        <KpiCard label={t("churn30", { defaultValue: "Churn (30d)" })}         value="3.4%" delta="−0.4%" trend="down" />
      </div>

      <PanelCard>
        <Toolbar
          searchPlaceholder={t("searchCustomers", { defaultValue: "Search by name or email…" })}
          actions={
            <>
              <button className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition">
                <Download className="size-3.5" /> {t("export", { defaultValue: "Export" })}
              </button>
              <button className="h-10 rounded-xl bg-foreground text-background px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90 transition">
                <Plus className="size-3.5" /> {t("newCustomer", { defaultValue: "New customer" })}
              </button>
            </>
          }
        />
        <DataTable columns={columns} rows={MOCK_ADMIN_CUSTOMERS} />
      </PanelCard>
    </div>
  );
}
