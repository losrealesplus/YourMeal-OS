/**
 * PE005 — Zero Friction Production Alerts & Deadlines (Experience only).
 *
 * Surface risks early. Deadlines clear. Next step always visible.
 * Do not over-alert. Do not block without reason.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  acknowledgePlanReviewed,
  activeProductionRisks,
  resolveRisk,
  riskCodeLabel,
  type ProductionRisk,
  type RiskNextAction,
} from "@/production-experience/alerts-view";
import {
  downloadProductionPlanCsv,
  printProductionPlan,
} from "@/production-experience/export-production-plan";
import {
  getProductionPlan,
  listProductionPlans,
} from "@/production-experience/production-plan";
import { dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  weekStart?: string | null;
  onNavigate: (action: RiskNextAction, weekStart: string) => void;
};

function severityTone(
  s: ProductionRisk["severity"],
): "positive" | "warning" | "info" | "neutral" {
  if (s === "block" || s === "warn") return "warning";
  if (s === "info") return "info";
  return "neutral";
}

function urgencyLabel(u: ProductionRisk["urgency"]): string {
  if (u === "now") return "Ahora";
  if (u === "soon") return "Pronto";
  return "Vigilar";
}

export function ProductionAlertsPanel({
  canWrite,
  weekStart: focusWeek,
  onNavigate,
}: Props) {
  const [tick, setTick] = useState(0);
  const [weekStart, setWeekStart] = useState<string | null>(focusWeek ?? null);
  const [filter, setFilter] = useState<"all" | "now" | "soon">("all");

  const plans = useMemo(() => {
    void tick;
    return listProductionPlans();
  }, [tick]);

  const activeWeek = weekStart ?? plans[0]?.weekStart ?? null;

  const plan = useMemo(() => {
    void tick;
    return activeWeek ? getProductionPlan(activeWeek) : null;
  }, [activeWeek, tick]);

  const risks = useMemo(
    () => (plan ? activeProductionRisks(plan) : []),
    [plan, tick],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return risks;
    return risks.filter((r) => r.urgency === filter);
  }, [risks, filter]);

  function refresh() {
    setTick((n) => n + 1);
  }

  if (plans.length === 0 || !plan || !activeWeek) {
    return (
      <section className="space-y-4" aria-labelledby="pe-alerts-empty">
        <h2 id="pe-alerts-empty" className="text-sm font-semibold tracking-wide">
          Alertas y deadlines
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay plan de producción.</p>
          <p className="text-xs text-muted-foreground">
            Genera un plan primero. Las alertas anticipan riesgos antes de
            Kitchen — no inventan ruido.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("planning", focusWeek ?? "")}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Abrir Production Planning
          </button>
        </div>
      </section>
    );
  }

  const nowCount = risks.filter((r) => r.urgency === "now").length;
  const warnCount = risks.filter(
    (r) => r.severity === "warn" || r.severity === "block",
  ).length;

  return (
    <section className="space-y-5" aria-labelledby="pe-alerts">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pe-alerts" className="text-sm font-semibold tracking-wide">
            Alertas y deadlines
          </h2>
          <p className="text-xs text-muted-foreground">
            Riesgos visibles pronto — Production no falla en silencio
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Semana</span>
          <select
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={activeWeek}
            onChange={(e) => setWeekStart(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.weekStart} value={p.weekStart}>
                {formatWeekLabel(p.weekStart)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={formatWeekLabel(plan.weekStart)} />
        <StatusChip
          tone={nowCount ? "warning" : "positive"}
          label={nowCount ? `${nowCount} urgentes` : "Sin urgentes"}
        />
        <StatusChip
          tone={warnCount ? "warning" : "positive"}
          label={warnCount ? `${warnCount} avisos` : "Sin avisos activos"}
        />
        <StatusChip
          tone={plan.status === "ready_for_kitchen" ? "positive" : "info"}
          label={
            plan.status === "ready_for_kitchen"
              ? "Kitchen ready"
              : "Handoff pendiente"
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["now", "Ahora"],
            ["soon", "Pronto"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              filter === id
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printProductionPlan(plan)}
        >
          Imprimir
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadProductionPlanCsv(plan);
            toast.success("CSV descargado");
          }}
        >
          Exportar
        </button>
        <span className="text-xs text-muted-foreground">
          Notify Kitchen → Future
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="space-y-2 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay alertas activas.</p>
          <p className="text-xs text-muted-foreground">
            Sin ruido. El plan no muestra avisos prioritarios en este filtro.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("handoff", activeWeek)}
            className="text-xs underline-offset-2 hover:underline"
          >
            Abrir Kitchen handoff / Planning
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                r.urgency === "now" && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.dayDate
                      ? `${dayLabel(r.dayDate)} · ${r.dayDate}`
                      : formatWeekLabel(r.weekStart)}
                    {" · "}
                    {r.workSummary}
                    {r.deadline ? ` · deadline ${r.deadline}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Carga: {r.loadLabel}
                    {r.affectedPreps > 0
                      ? ` · ${r.affectedPreps} prep(s)`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Siguiente:</span> {r.nextStep}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kitchen: {r.kitchenImpact}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={severityTone(r.severity)}
                    label={r.severity}
                  />
                  <StatusChip
                    tone={r.urgency === "now" ? "warning" : "info"}
                    label={urgencyLabel(r.urgency)}
                  />
                  <StatusChip tone="info" label={riskCodeLabel(r.code)} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canWrite}
                  className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                  onClick={() => {
                    resolveRisk(activeWeek, r.id);
                    refresh();
                    toast.success("Riesgo marcado resuelto (sesión)");
                  }}
                >
                  Resolver
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => onNavigate("adapt", activeWeek)}
                >
                  Reprogramar / adaptar
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => {
                    if (r.nextAction === "handoff") {
                      acknowledgePlanReviewed(activeWeek);
                    }
                    onNavigate(r.nextAction, activeWeek);
                  }}
                >
                  {r.nextAction === "preps"
                    ? "Abrir preps"
                    : r.nextAction === "adapt"
                      ? "Abrir trabajo"
                      : r.nextAction === "handoff"
                        ? "Abrir handoff"
                        : "Abrir planning"}
                </button>
                {r.nextAction !== "preps" ? (
                  <button
                    type="button"
                    className="text-xs underline-offset-2 hover:underline"
                    onClick={() => onNavigate("preps", activeWeek)}
                  >
                    Abrir preps
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
