import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { KpiCard, PanelCard, ProgressBar, StatusChip } from "@/components/admin";
import { MOCK_KITCHEN_STATIONS, MOCK_PRODUCTION_TASKS } from "@/lib/mock-admin";

/**
 * ADMIN · Producción · Kitchen
 * Objetivo operacional: Ver la carga de cada estación de cocina y su próxima tanda
 * Capability:            kitchen.observe
 * Core Object:           Station
 */
export const Route = createFileRoute("/_authenticated/admin/production/kitchen")({
  component: KitchenPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Kitchen" },
      { name: "description", content: "Estado de las estaciones de cocina." },
    ],
  }),
});

const stationLabel: Record<string, string> = {
  cold: "Cold",
  hot: "Hot",
  assembly: "Assembly",
  packing: "Packing",
};

function KitchenPage() {
  const { t } = useTranslation("admin");

  const avgLoad = Math.round(
    MOCK_KITCHEN_STATIONS.reduce((a, s) => a + s.load, 0) / MOCK_KITCHEN_STATIONS.length,
  );
  const activeBatches = MOCK_KITCHEN_STATIONS.reduce((a, s) => a + s.activeBatches, 0);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("kitchenStations", { defaultValue: "Stations" })} value={`${MOCK_KITCHEN_STATIONS.length}/4`} />
        <KpiCard label={t("kitchenAvgLoad", { defaultValue: "Avg load" })} value={`${avgLoad}%`} trend="up" delta="+8%" />
        <KpiCard label={t("kitchenActiveBatches", { defaultValue: "Active batches" })} value={String(activeBatches)} />
        <KpiCard label={t("kitchenAlerts", { defaultValue: "Alerts" })} value="0" trend="flat" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {MOCK_KITCHEN_STATIONS.map((s) => {
          const tone = s.load >= 80 ? "warning" : s.load > 0 ? "info" : "neutral";
          return (
            <PanelCard key={s.id} title={stationLabel[s.id]}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("kitchenHead", { defaultValue: "Head" })}</p>
                  <p className="font-semibold">{s.head}</p>
                </div>
                <StatusChip tone={tone} label={`${s.load}%`} />
              </div>
              <ProgressBar value={s.load} tone={s.load >= 80 ? "warn" : "primary"} />
              <div className="mt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <span>{s.activeBatches} {t("kitchenBatches", { defaultValue: "batches" })}</span>
                <span>{t("kitchenNextAt", { defaultValue: "Next" })} · {s.nextBatchAt}</span>
              </div>
            </PanelCard>
          );
        })}
      </div>

      <PanelCard title={t("liveProduction")}>
        <ul className="space-y-3">
          {MOCK_PRODUCTION_TASKS.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {stationLabel[task.station]}
                </span>
                <p className="font-medium truncate">{task.dish}</p>
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
                {task.qty} · ETA {task.eta}
              </span>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
