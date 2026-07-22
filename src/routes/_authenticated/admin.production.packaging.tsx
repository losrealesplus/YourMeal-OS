import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { KpiCard, PanelCard, ProgressBar, StatusChip } from "@/components/admin";
import { MOCK_PACKAGING_LINES } from "@/lib/mock-admin";

/**
 * ADMIN · Producción · Packaging
 * Objetivo operacional: Empaquetar las comidas del turno por canal de entrega
 * Capability:            production.package
 * Core Object:           PackagingLine
 */
export const Route = createFileRoute("/_authenticated/admin/production/packaging")({
  component: PackagingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Packaging" },
      { name: "description", content: "Líneas de empaquetado del turno operativo." },
    ],
  }),
});

const channelLabel: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
  corporate: "Corporate",
};

function PackagingPage() {
  const { t } = useTranslation("admin");

  const totalBoxes = MOCK_PACKAGING_LINES.reduce((a, l) => a + l.boxesTotal, 0);
  const doneBoxes = MOCK_PACKAGING_LINES.reduce((a, l) => a + l.boxesDone, 0);
  const running = MOCK_PACKAGING_LINES.filter((l) => l.status === "running").length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("packagingLines", { defaultValue: "Lines" })} value={String(MOCK_PACKAGING_LINES.length)} />
        <KpiCard label={t("packagingRunning", { defaultValue: "Running" })} value={String(running)} trend="up" />
        <KpiCard label={t("packagingBoxes", { defaultValue: "Boxes done" })} value={`${doneBoxes}/${totalBoxes}`} />
        <KpiCard label={t("packagingProgress", { defaultValue: "Progress" })} value={`${Math.round((doneBoxes / totalBoxes) * 100)}%`} trend="up" />
      </div>

      <PanelCard title={t("packagingLinesTitle", { defaultValue: "Packaging lines" })}>
        <ul className="space-y-5">
          {MOCK_PACKAGING_LINES.map((l) => {
            const pct = Math.round((l.boxesDone / l.boxesTotal) * 100);
            const tone = l.status === "done" ? "positive" : l.status === "running" ? "info" : "neutral";
            return (
              <li key={l.id} className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                      {channelLabel[l.channel]}
                    </span>
                    <p className="font-semibold">{t(`packagingStatuses.${l.status}`, { defaultValue: l.status })}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold tabular-nums">{l.boxesDone}/{l.boxesTotal}</span>
                    <StatusChip tone={tone} label={`ETA ${l.eta}`} />
                  </div>
                </div>
                <ProgressBar value={pct} />
              </li>
            );
          })}
        </ul>
      </PanelCard>
    </div>
  );
}
