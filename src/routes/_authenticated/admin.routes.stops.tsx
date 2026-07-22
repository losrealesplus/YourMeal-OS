import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DataTable, KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_ROUTE_STOPS, type MockRouteStop } from "@/lib/mock-admin";

/**
 * ADMIN · Delivery · Stops
 * Objetivo operacional: Ver y ajustar la secuencia de paradas por ruta
 * Capability:            delivery.stops.sequence
 * Core Object:           Stop
 */
export const Route = createFileRoute("/_authenticated/admin/routes/stops")({
  component: StopsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Paradas" },
      { name: "description", content: "Secuencia de paradas por ruta." },
    ],
  }),
});

function stopTone(s: MockRouteStop["status"]) {
  if (s === "delivered") return "positive" as const;
  if (s === "arrived") return "info" as const;
  if (s === "failed") return "negative" as const;
  return "neutral" as const;
}

function StopsPage() {
  const { t } = useTranslation("admin");

  const pending = MOCK_ROUTE_STOPS.filter((s) => s.status === "pending").length;
  const delivered = MOCK_ROUTE_STOPS.filter((s) => s.status === "delivered").length;
  const failed = MOCK_ROUTE_STOPS.filter((s) => s.status === "failed").length;
  const totalBoxes = MOCK_ROUTE_STOPS.reduce((a, s) => a + s.boxes, 0);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("stopsTotal", { defaultValue: "Stops" })} value={String(MOCK_ROUTE_STOPS.length)} />
        <KpiCard label={t("stopsDelivered", { defaultValue: "Delivered" })} value={String(delivered)} trend="up" />
        <KpiCard label={t("stopsPending", { defaultValue: "Pending" })} value={String(pending)} />
        <KpiCard label={t("stopsBoxes", { defaultValue: "Boxes" })} value={String(totalBoxes)} />
      </div>

      <PanelCard title={t("stopsQueue", { defaultValue: "Stop queue" })}>
        <DataTable
          rows={MOCK_ROUTE_STOPS}
          columns={[
            {
              key: "routeCode",
              header: t("routeCode", { defaultValue: "Route" }),
              render: (s) => (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {s.routeCode}
                </span>
              ),
            },
            {
              key: "sequence",
              header: "#",
              render: (s) => <span className="font-mono tabular-nums font-bold">{s.sequence}</span>,
            },
            {
              key: "customer",
              header: t("customer"),
              render: (s) => (
                <div>
                  <p className="font-semibold">{s.customer}</p>
                  <p className="text-xs text-muted-foreground">{s.addressShort}</p>
                </div>
              ),
            },
            {
              key: "windowStart",
              header: t("stopsWindow", { defaultValue: "Window" }),
              render: (s) => (
                <span className="font-mono tabular-nums text-xs">{s.windowStart} – {s.windowEnd}</span>
              ),
            },
            {
              key: "boxes",
              header: t("stopsBoxesShort", { defaultValue: "Boxes" }),
              render: (s) => <span className="font-mono tabular-nums">{s.boxes}</span>,
            },
            {
              key: "status",
              header: t("status"),
              render: (s) => (
                <StatusChip
                  tone={stopTone(s.status)}
                  label={t(`stopStatuses.${s.status}`, { defaultValue: s.status })}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
