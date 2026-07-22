import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DataTable, KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_DELIVERIES, type MockDelivery } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Delivery · Deliveries
 * Objetivo operacional: Ver el estado de cada pedido en su ventana de entrega
 * Capability:            delivery.track
 * Core Object:           Delivery
 */
export const Route = createFileRoute("/_authenticated/admin/routes/deliveries")({
  component: DeliveriesPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Entregas" },
      { name: "description", content: "Estado de las entregas del día." },
    ],
  }),
});

function tone(s: MockDelivery["status"]) {
  if (s === "delivered") return "positive" as const;
  if (s === "out_for_delivery") return "info" as const;
  if (s === "failed") return "negative" as const;
  return "neutral" as const;
}

function DeliveriesPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const delivered = MOCK_DELIVERIES.filter((d) => d.status === "delivered").length;
  const inRoute = MOCK_DELIVERIES.filter((d) => d.status === "out_for_delivery").length;
  const scheduled = MOCK_DELIVERIES.filter((d) => d.status === "scheduled").length;
  const failed = MOCK_DELIVERIES.filter((d) => d.status === "failed").length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("deliveriesDelivered", { defaultValue: "Delivered" })} value={String(delivered)} trend="up" />
        <KpiCard label={t("deliveriesInRoute", { defaultValue: "In route" })} value={String(inRoute)} />
        <KpiCard label={t("deliveriesScheduled", { defaultValue: "Scheduled" })} value={String(scheduled)} />
        <KpiCard label={t("deliveriesFailed", { defaultValue: "Failed" })} value={String(failed)} trend={failed > 0 ? "down" : "flat"} />
      </div>

      <PanelCard title={t("deliveriesToday", { defaultValue: "Today's deliveries" })}>
        <DataTable
          rows={MOCK_DELIVERIES}
          columns={[
            {
              key: "orderCode",
              header: t("deliveriesOrder", { defaultValue: "Order" }),
              render: (d) => <span className="font-mono text-xs font-bold">{d.orderCode}</span>,
            },
            {
              key: "customer",
              header: t("customer"),
              render: (d) => <span className="font-semibold">{d.customer}</span>,
            },
            {
              key: "routeCode",
              header: t("routeCode", { defaultValue: "Route" }),
              render: (d) => (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {d.routeCode}
                </span>
              ),
            },
            {
              key: "slot",
              header: t("deliveriesSlot", { defaultValue: "Slot" }),
              render: (d) => <span className="font-mono tabular-nums text-xs">{d.slot}</span>,
            },
            {
              key: "boxes",
              header: t("stopsBoxesShort", { defaultValue: "Boxes" }),
              render: (d) => <span className="font-mono tabular-nums">{d.boxes}</span>,
            },
            {
              key: "deliveredIso",
              header: t("deliveriesDeliveredAt", { defaultValue: "Delivered at" }),
              render: (d) =>
                d.deliveredIso ? (
                  <span className="font-mono tabular-nums text-xs">{fmt.time(new Date(d.deliveredIso))}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                ),
            },
            {
              key: "status",
              header: t("status"),
              render: (d) => (
                <StatusChip
                  tone={tone(d.status)}
                  label={t(`deliveryStatuses.${d.status}`, { defaultValue: d.status })}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
