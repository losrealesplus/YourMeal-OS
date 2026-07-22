import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { DataTable, KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_PLANNING_RUNS, type MockPlanningRun } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Producción · Planning
 * Objetivo operacional: Decidir cuánto producir de cada plato y cuándo liberarlo a cocina
 * Capability:            production.plan
 * Core Object:           ProductionRun
 */
export const Route = createFileRoute("/_authenticated/admin/production/")({
  component: PlanningPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Planning" },
      { name: "description", content: "Planificación de la producción del turno." },
    ],
  }),
});

const stationLabels: Record<MockPlanningRun["station"], string> = {
  cold: "Cold",
  hot: "Hot",
  assembly: "Assembly",
  packing: "Packing",
};

function PlanningPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const totalOrdered = MOCK_PLANNING_RUNS.reduce((a, r) => a + r.ordered, 0);
  const totalPlanned = MOCK_PLANNING_RUNS.reduce((a, r) => a + r.planned, 0);
  const overage = totalPlanned - totalOrdered;
  const released = MOCK_PLANNING_RUNS.filter((r) => r.status === "released").length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("planningOrdered", { defaultValue: "Ordered" })} value={String(totalOrdered)} />
        <KpiCard label={t("planningPlanned", { defaultValue: "Planned" })} value={String(totalPlanned)} trend="up" delta={`+${overage}`} />
        <KpiCard label={t("planningReleased", { defaultValue: "Released runs" })} value={`${released}/${MOCK_PLANNING_RUNS.length}`} />
        <KpiCard label={t("planningOverage", { defaultValue: "Safety overage" })} value={`${Math.round((overage / totalOrdered) * 100)}%`} />
      </div>

      <PanelCard
        title={t("planningRuns", { defaultValue: "Production runs" })}
        action={
          <button className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-secondary/60 transition">
            <CalendarClock className="size-3.5" /> {t("planningRelease", { defaultValue: "Release day" })}
          </button>
        }
      >
        <DataTable
          rows={MOCK_PLANNING_RUNS}
          columns={[
            {
              key: "serviceDateIso",
              header: t("planningService", { defaultValue: "Service" }),
              render: (r) => (
                <span className="font-mono text-xs tabular-nums">
                  {fmt.date(new Date(r.serviceDateIso), "medium")}
                </span>
              ),
            },
            { key: "dish", header: t("planningDish", { defaultValue: "Dish" }), render: (r) => <span className="font-semibold">{r.dish}</span> },
            {
              key: "station",
              header: t("planningStation", { defaultValue: "Station" }),
              render: (r) => (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {stationLabels[r.station]}
                </span>
              ),
            },
            { key: "ordered", header: t("planningOrderedShort", { defaultValue: "Ordered" }), render: (r) => <span className="font-mono tabular-nums">{r.ordered}</span> },
            { key: "planned", header: t("planningPlannedShort", { defaultValue: "Planned" }), render: (r) => <span className="font-mono tabular-nums font-bold">{r.planned}</span> },
            {
              key: "status",
              header: t("status"),
              render: (r) => (
                <StatusChip
                  tone={r.status === "released" ? "positive" : r.status === "scheduled" ? "info" : "neutral"}
                  label={t(`planningStatuses.${r.status}`, { defaultValue: r.status })}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
