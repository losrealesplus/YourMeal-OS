import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { DataTable, KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_LABEL_JOBS, type MockLabelJob } from "@/lib/mock-admin";

/**
 * ADMIN · Producción · Labels
 * Objetivo operacional: Imprimir etiquetas trazables por comida, tanda y ruta
 * Capability:            production.label.print
 * Core Object:           Label
 */
export const Route = createFileRoute("/_authenticated/admin/production/labels")({
  component: LabelsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Labels" },
      { name: "description", content: "Cola de impresión de etiquetas del turno." },
    ],
  }),
});

const formatLabel: Record<MockLabelJob["format"], string> = {
  meal: "Meal",
  batch: "Batch",
  logistic: "Logistic",
};

function LabelsPage() {
  const { t } = useTranslation("admin");

  const ready = MOCK_LABEL_JOBS.filter((j) => j.status === "ready").length;
  const printing = MOCK_LABEL_JOBS.filter((j) => j.status === "printing").length;
  const done = MOCK_LABEL_JOBS.filter((j) => j.status === "done").length;
  const totalQty = MOCK_LABEL_JOBS.reduce((a, j) => a + j.qty, 0);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("labelsReady", { defaultValue: "Ready" })} value={String(ready)} />
        <KpiCard label={t("labelsPrinting", { defaultValue: "Printing" })} value={String(printing)} trend="up" />
        <KpiCard label={t("labelsDone", { defaultValue: "Printed" })} value={String(done)} />
        <KpiCard label={t("labelsQty", { defaultValue: "Labels queued" })} value={String(totalQty)} />
      </div>

      <PanelCard
        title={t("labelsQueue", { defaultValue: "Print queue" })}
        action={
          <button className="h-9 rounded-lg bg-foreground text-background px-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90 transition">
            <Printer className="size-3.5" /> {t("printLabels")}
          </button>
        }
      >
        <DataTable
          rows={MOCK_LABEL_JOBS}
          columns={[
            { key: "dish", label: t("planningDish", { defaultValue: "Dish" }), render: (j) => <span className="font-semibold">{j.dish}</span> },
            {
              key: "format",
              label: t("labelsFormat", { defaultValue: "Format" }),
              render: (j) => (
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary rounded px-2 py-0.5">
                  {formatLabel[j.format]}
                </span>
              ),
            },
            { key: "printer", label: t("labelsPrinter", { defaultValue: "Printer" }), render: (j) => <span className="text-xs text-muted-foreground">{j.printer}</span> },
            { key: "qty", label: t("labelsQtyShort", { defaultValue: "Qty" }), render: (j) => <span className="font-mono tabular-nums font-bold">{j.qty}</span> },
            {
              key: "status",
              label: t("status"),
              render: (j) => (
                <StatusChip
                  tone={j.status === "done" ? "positive" : j.status === "printing" ? "info" : "neutral"}
                  label={t(`labelStatuses.${j.status}`, { defaultValue: j.status })}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
