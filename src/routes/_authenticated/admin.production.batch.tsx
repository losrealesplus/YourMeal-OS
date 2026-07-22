import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { KpiCard, PanelCard, ProgressBar, StatusChip } from "@/components/admin";
import { MOCK_BATCHES } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Producción · Batch
 * Objetivo operacional: Ejecutar y monitorizar cada tanda de cocinado en tiempo real
 * Capability:            production.batch.execute
 * Core Object:           Batch
 */
export const Route = createFileRoute("/_authenticated/admin/production/batch")({
  component: BatchPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Batch" },
      { name: "description", content: "Ejecución de tandas de cocinado en curso." },
    ],
  }),
});

function BatchPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const active = MOCK_BATCHES.filter((b) => b.progress > 0 && b.progress < 100).length;
  const done = MOCK_BATCHES.filter((b) => b.progress === 100).length;
  const totalMeals = MOCK_BATCHES.reduce((a, b) => a + b.qty, 0);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("batchActive", { defaultValue: "Active batches" })} value={String(active)} trend="up" />
        <KpiCard label={t("batchDone", { defaultValue: "Batches done" })} value={String(done)} />
        <KpiCard label={t("batchMeals", { defaultValue: "Meals in batch" })} value={String(totalMeals)} />
        <KpiCard label={t("batchDelayed", { defaultValue: "Delayed" })} value="0" trend="flat" />
      </div>

      <PanelCard title={t("batchRunning", { defaultValue: "Running batches" })}>
        <ul className="space-y-5">
          {MOCK_BATCHES.map((b) => {
            const tone = b.progress === 100 ? "positive" : b.progress > 0 ? "info" : "neutral";
            const label = b.progress === 100 ? t("done") : b.progress > 0 ? t("inProgress") : t("queued");
            return (
              <li key={b.id} className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{b.code}</p>
                    <p className="font-semibold truncate">{b.dish}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold tabular-nums">{b.qty}</span>
                    <StatusChip tone={tone} label={label} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar value={b.progress} />
                  <span className="font-mono text-[10px] text-muted-foreground w-20 text-right">
                    {fmt.time(new Date(b.targetIso))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span>{t("batchOperator", { defaultValue: "Operator" })} · {b.operator}</span>
                  <span>{t("batchStarted", { defaultValue: "Started" })} · {fmt.time(new Date(b.startedIso))}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </PanelCard>
    </div>
  );
}
