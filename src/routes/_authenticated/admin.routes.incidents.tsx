import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { DataTable, KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_DELIVERY_INCIDENTS, type MockDeliveryIncident } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Delivery · Incidencias
 * Objetivo operacional: Gestionar incidencias de entrega hasta su resolución
 * Capability:            delivery.incident.manage
 * Core Object:           DeliveryIncident
 */
export const Route = createFileRoute("/_authenticated/admin/routes/incidents")({
  component: IncidentsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Incidencias" },
      { name: "description", content: "Gestión de incidencias de entrega." },
    ],
  }),
});

function statusTone(s: MockDeliveryIncident["status"]) {
  if (s === "resolved") return "positive" as const;
  if (s === "in_review") return "info" as const;
  return "warning" as const;
}

function severityTone(s: MockDeliveryIncident["severity"]) {
  if (s === "high") return "danger" as const;
  if (s === "medium") return "warning" as const;
  return "neutral" as const;
}

function IncidentsPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const open = MOCK_DELIVERY_INCIDENTS.filter((i) => i.status === "open").length;
  const review = MOCK_DELIVERY_INCIDENTS.filter((i) => i.status === "in_review").length;
  const resolved = MOCK_DELIVERY_INCIDENTS.filter((i) => i.status === "resolved").length;
  const high = MOCK_DELIVERY_INCIDENTS.filter((i) => i.severity === "high").length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("incidentsOpen", { defaultValue: "Open" })} value={String(open)} trend={open > 0 ? "down" : "flat"} />
        <KpiCard label={t("incidentsReview", { defaultValue: "In review" })} value={String(review)} />
        <KpiCard label={t("incidentsResolved", { defaultValue: "Resolved" })} value={String(resolved)} trend="up" />
        <KpiCard label={t("incidentsHigh", { defaultValue: "High severity" })} value={String(high)} />
      </div>

      <PanelCard
        title={t("incidentsQueue", { defaultValue: "Incident queue" })}
        action={
          <button className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition">
            <AlertTriangle className="size-3.5" /> {t("incidentsNew", { defaultValue: "New incident" })}
          </button>
        }
      >
        <DataTable
          rows={MOCK_DELIVERY_INCIDENTS}
          columns={[
            {
              key: "code",
              header: t("incidentsCode", { defaultValue: "Code" }),
              render: (i) => <span className="font-mono text-xs font-bold">{i.code}</span>,
            },
            {
              key: "routeCode",
              header: t("routeCode", { defaultValue: "Route" }),
              render: (i) => (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {i.routeCode}
                </span>
              ),
            },
            {
              key: "customer",
              header: t("customer"),
              render: (i) => <span className="font-medium">{i.customer}</span>,
            },
            {
              key: "category",
              header: t("incidentsCategory", { defaultValue: "Category" }),
              render: (i) => (
                <span className="text-xs">{t(`incidentCategories.${i.category}`, { defaultValue: i.category })}</span>
              ),
            },
            {
              key: "severity",
              header: t("incidentsSeverity", { defaultValue: "Severity" }),
              render: (i) => (
                <StatusChip
                  tone={severityTone(i.severity)}
                  label={t(`incidentSeverities.${i.severity}`, { defaultValue: i.severity })}
                />
              ),
            },
            {
              key: "openedIso",
              header: t("incidentsOpened", { defaultValue: "Opened" })
              ,
              render: (i) => (
                <span className="font-mono tabular-nums text-xs">{fmt.dateTime(new Date(i.openedIso))}</span>
              ),
            },
            {
              key: "status",
              header: t("status"),
              render: (i) => (
                <StatusChip
                  tone={statusTone(i.status)}
                  label={t(`incidentStatuses.${i.status}`, { defaultValue: i.status })}
                />
              ),
            },
            {
              key: "summary",
              header: t("incidentsSummary", { defaultValue: "Summary" }),
              render: (i) => <span className="text-xs text-muted-foreground">{i.summary}</span>,
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
