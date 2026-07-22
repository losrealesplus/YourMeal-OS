import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DataTable, KpiCard, PanelCard, ProgressBar, StatusChip } from "@/components/admin";
import { MOCK_DELIVERY_ROUTES, type MockDeliveryRoute } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Delivery · Route
 * Objetivo operacional: Planificar y monitorizar cada ruta del turno
 * Capability:            delivery.route.plan
 * Core Object:           Route
 */
export const Route = createFileRoute("/_authenticated/admin/routes/")({
  component: RoutePage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Rutas" },
      { name: "description", content: "Planificación y monitorización de rutas." },
    ],
  }),
});

function statusTone(s: MockDeliveryRoute["status"]) {
  if (s === "completed") return "positive" as const;
  if (s === "in_progress") return "info" as const;
  return "neutral" as const;
}

function RoutePage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const active = MOCK_DELIVERY_ROUTES.filter((r) => r.status === "in_progress").length;
  const planned = MOCK_DELIVERY_ROUTES.filter((r) => r.status === "planned").length;
  const completed = MOCK_DELIVERY_ROUTES.filter((r) => r.status === "completed").length;
  const totalStops = MOCK_DELIVERY_ROUTES.reduce((a, r) => a + r.stops, 0);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("routesActive", { defaultValue: "Active routes" })} value={String(active)} trend="up" />
        <KpiCard label={t("routesPlanned", { defaultValue: "Planned" })} value={String(planned)} />
        <KpiCard label={t("routesCompleted", { defaultValue: "Completed" })} value={String(completed)} />
        <KpiCard label={t("routesTotalStops", { defaultValue: "Stops today" })} value={String(totalStops)} />
      </div>

      <PanelCard title={t("routesListTitle", { defaultValue: "Today's routes" })}>
        <DataTable
          rows={MOCK_DELIVERY_ROUTES}
          columns={[
            {
              key: "code",
              header: t("routeCode", { defaultValue: "Code" }),
              render: (r) => (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.code}</p>
                  <p className="font-semibold">{r.name}</p>
                </div>
              ),
            },
            {
              key: "driver",
              header: t("routeDriver", { defaultValue: "Driver" }),
              render: (r) => (
                <div>
                  <p className="font-medium">{r.driver}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{r.vehicle}</p>
                </div>
              ),
            },
            {
              key: "stops",
              header: t("routeStopsShort", { defaultValue: "Stops" }),
              render: (r) => <span className="font-mono tabular-nums">{r.stops}</span>,
            },
            {
              key: "distanceKm",
              header: t("routeDistance", { defaultValue: "Distance" }),
              render: (r) => (
                <span className="font-mono tabular-nums text-xs">{fmt.distance(r.distanceKm)}</span>
              ),
            },
            {
              key: "etaIso",
              header: t("routeEta", { defaultValue: "ETA" }),
              render: (r) => (
                <span className="font-mono tabular-nums text-xs">{fmt.time(new Date(r.etaIso))}</span>
              ),
            },
            {
              key: "progress",
              header: t("routeProgress", { defaultValue: "Progress" }),
              render: (r) => (
                <div className="w-32">
                  <ProgressBar value={r.progress} />
                </div>
              ),
            },
            {
              key: "status",
              header: t("status"),
              render: (r) => (
                <StatusChip
                  tone={statusTone(r.status)}
                  label={t(`routeStatuses.${r.status}`, { defaultValue: r.status })}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
