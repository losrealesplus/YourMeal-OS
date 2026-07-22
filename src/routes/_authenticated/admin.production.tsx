import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import {
  AdminHeader,
  KpiCard,
  PanelCard,
  ProgressBar,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import { MOCK_PRODUCTION_TASKS } from "@/lib/mock-admin";

/**
 * ADMIN · Producción
 * Objetivo operacional: Coordinar el flujo de cocina para cumplir los pedidos del día
 * Capability:            production.orchestrate
 * Core Object:           ProductionRun + Dish
 */
export const Route = createFileRoute("/_authenticated/admin/production")({
  component: AdminProductionPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Producción" },
      { name: "description", content: "Coordinación del flujo de cocina para el turno operativo." },
    ],
  }),
});

const stationLabels: Record<string, string> = {
  cold: "Cold",
  hot: "Hot",
  assembly: "Assembly",
  packing: "Packing",
};

function AdminProductionPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="animate-fade-in">
      <SectionTitle
        overline={t("production")}
        title={t("productionTitle", { defaultValue: "Producción del turno" })}
        subtitle={t("productionSubtitle", { defaultValue: "Estado de cada estación de cocina y estado de las tandas." })}
        trailing={
          <button className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition">
            <Printer className="size-3.5" /> {t("printLabels")}
          </button>
        }
      />
      <AdminHeader
        goal={t("productionGoal", { defaultValue: "Cumplir los pedidos del día con calidad y a tiempo" })}
        capability="production.orchestrate"
        object="ProductionRun · Dish"
      />

      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("totalMeals", { defaultValue: "Meals to produce" })} value="264" trend="up" delta="+18" />
        <KpiCard label={t("stationsActive", { defaultValue: "Stations active" })} value="4/4" trend="flat" />
        <KpiCard label={t("shiftProgress", { defaultValue: "Shift progress" })} value="42%" trend="up" delta="+12%" />
        <KpiCard label={t("delayed", { defaultValue: "Delayed" })} value="0" trend="flat" />
      </div>

      <PanelCard title={t("liveProduction")}>
        <ul className="space-y-4">
          {MOCK_PRODUCTION_TASKS.map((task) => {
            const tone =
              task.progress === 100 ? "positive" : task.progress > 0 ? "info" : "neutral";
            return (
              <li key={task.id} className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                      {stationLabels[task.station]}
                    </span>
                    <p className="font-semibold truncate">{task.dish}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold tabular-nums">{task.qty}</span>
                    <StatusChip
                      tone={tone}
                      label={
                        task.progress === 100
                          ? t("done", { defaultValue: "Done" })
                          : task.progress > 0
                          ? t("inProgress", { defaultValue: "In progress" })
                          : t("queued", { defaultValue: "Queued" })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar value={task.progress} />
                  <span className="font-mono text-[10px] text-muted-foreground w-14 text-right">
                    ETA {task.eta}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </PanelCard>
    </div>
  );
}
