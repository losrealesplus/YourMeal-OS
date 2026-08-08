/**
 * PE001 — Zero Friction Production Planning panel (Experience only).
 *
 * Published week → production work → load · alerts · preps → Kitchen handoff.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  dayLabel,
  formatWeekLabel,
  listWeekPlans,
  type WeekPlan,
} from "@/menu-experience/week-plan";
import {
  downloadProductionPlanCsv,
  printProductionPlan,
} from "@/production-experience/export-production-plan";
import { generateProductionPlanFromWeek } from "@/production-experience/generate-from-week";
import {
  confirmProductionPlan,
  getProductionPlan,
  totalQuantity,
  workByDay,
  type ProductionPlan,
} from "@/production-experience/production-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  /** Extra published weeks (e.g. durable seeds marked published). */
  publishedWeeks?: WeekPlan[];
  focusWeekStart?: string | null;
};

function isPublished(w: WeekPlan): boolean {
  return (
    w.status === "published_session" || w.status === "published_durable"
  );
}

export function ProductionPlanningPanel({
  canWrite,
  publishedWeeks = [],
  focusWeekStart = null,
}: Props) {
  const [tick, setTick] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(
    focusWeekStart,
  );
  const [groupBy, setGroupBy] = useState<"day" | "dish" | "batch" | "prep">(
    "day",
  );

  const sources = useMemo(() => {
    void tick;
    const map = new Map<string, WeekPlan>();
    for (const w of [...listWeekPlans(), ...publishedWeeks]) {
      if (!isPublished(w)) continue;
      const prev = map.get(w.weekStart);
      if (!prev || w.updatedAt > prev.updatedAt) map.set(w.weekStart, w);
    }
    return [...map.values()].sort(
      (a, b) => Date.parse(b.weekStart) - Date.parse(a.weekStart),
    );
  }, [publishedWeeks, tick]);

  const weekStart = selectedWeek ?? sources[0]?.weekStart ?? null;
  const source = sources.find((s) => s.weekStart === weekStart) ?? null;

  const plan = useMemo(() => {
    void tick;
    return weekStart ? getProductionPlan(weekStart) : null;
  }, [weekStart, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function onGenerate(regenerate: boolean) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    if (!source) {
      toast.error("No hay semana publicada");
      return;
    }
    if (plan && !regenerate) {
      toast.message("Ya hay un plan — usa Regenerar si quieres reemplazarlo");
      return;
    }
    const result = generateProductionPlanFromWeek(source);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    setSelectedWeek(source.weekStart);
    refresh();
    toast.success(
      regenerate
        ? "Plan regenerado desde la semana publicada"
        : "Plan de producción generado",
    );
  }

  function onConfirm() {
    if (!canWrite || !weekStart) return;
    const next = confirmProductionPlan(weekStart);
    if (!next) {
      toast.error("Genera el plan antes de confirmar");
      return;
    }
    refresh();
    toast.success("Plan confirmado · listo para Kitchen");
  }

  if (sources.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="pe-empty">
        <h2 id="pe-empty" className="text-sm font-semibold tracking-wide">
          Planificación de producción
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay semana publicada.</p>
          <p className="text-xs text-muted-foreground">
            Production no inventa trabajo desde Orders sueltos. Necesita una
            semana operativa publicada en Menu Experience.
          </p>
          <Link
            to="/admin/menu-planning"
            search={{ mode: "publish", weekStart: undefined }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Abrir Menu Planning
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="pe-plan">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pe-plan" className="text-sm font-semibold tracking-wide">
            Planificación de producción
          </h2>
          <p className="text-xs text-muted-foreground">
            Semana publicada → trabajo ejecutable → Kitchen
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Semana publicada</span>
          <select
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={weekStart ?? ""}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.weekStart} value={s.weekStart}>
                {formatWeekLabel(s.weekStart)} · {s.status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {source ? (
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="info" label={`Fuente · ${source.status}`} />
          <StatusChip
            tone="info"
            label={`${source.slots.filter((s) => !s.disabled).length} platos menú`}
          />
          {plan ? (
            <>
              <StatusChip
                tone={
                  plan.status === "ready_for_kitchen" ? "positive" : "warning"
                }
                label={plan.status}
              />
              <StatusChip
                tone="info"
                label={`${plan.work.length} trabajos · ${totalQuantity(plan)} uds`}
              />
            </>
          ) : (
            <StatusChip tone="warning" label="Sin plan generado" />
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!canWrite || !source}
          onClick={() => onGenerate(false)}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          Generar plan
        </button>
        <button
          type="button"
          disabled={!canWrite || !source || !plan}
          onClick={() => onGenerate(true)}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
        >
          Regenerar plan
        </button>
        <button
          type="button"
          disabled={!canWrite || !plan}
          onClick={onConfirm}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
        >
          Confirmar · Ready for Kitchen
        </button>
        {plan ? (
          <>
            <button
              type="button"
              onClick={() => printProductionPlan(plan)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={() => {
                downloadProductionPlanCsv(plan);
                toast.success("CSV descargado");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Exportar Excel (CSV)
            </button>
          </>
        ) : null}
        <Link
          to="/admin/kitchen"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Abrir Kitchen
        </Link>
        <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
          OCC / Bulk / Import → Reserved
        </span>
      </div>

      {!plan ? (
        <p className="text-sm text-muted-foreground">
          Genera el plan desde la semana publicada. No reconstruyas a mano desde
          Orders.
        </p>
      ) : (
        <PlanBody plan={plan} groupBy={groupBy} setGroupBy={setGroupBy} />
      )}
    </section>
  );
}

function PlanBody({
  plan,
  groupBy,
  setGroupBy,
}: {
  plan: ProductionPlan;
  groupBy: "day" | "dish" | "batch" | "prep";
  setGroupBy: (g: "day" | "dish" | "batch" | "prep") => void;
}) {
  const byDay = workByDay(plan);
  const warnAlerts = plan.alerts.filter((a) => a.severity !== "info");

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Carga de producción
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {plan.dayLoads.map((d) => (
            <li
              key={d.dayDate}
              className={cn(
                "rounded-md border border-border/60 px-3 py-2 text-sm",
                d.overload && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {dayLabel(d.dayDate)} · {d.dayDate}
                </span>
                {d.overload ? (
                  <StatusChip tone="warning" label="Sobrecarga?" />
                ) : d.workCount === 0 ? (
                  <StatusChip tone="warning" label="Vacío" />
                ) : (
                  <StatusChip tone="positive" label="Ok" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {d.workCount} trabajos · {d.totalQuantity} uds · {d.batchCount}{" "}
                lotes · {d.alertCount} avisos
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Alertas operativas
          </p>
          <StatusChip
            tone={warnAlerts.length ? "warning" : "positive"}
            label={`${warnAlerts.length} avisos`}
          />
        </div>
        {warnAlerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin alertas bloqueantes.</p>
        ) : (
          <ul className="space-y-2">
            {warnAlerts.slice(0, 14).map((a, i) => (
              <li key={`${a.code}-${a.workId ?? a.dayDate ?? i}`} className="text-sm">
                <StatusChip
                  tone={a.severity === "block" ? "warning" : "warning"}
                  label={a.severity}
                />{" "}
                {a.message}
                {a.fixHint ? (
                  <span className="block text-xs text-muted-foreground">
                    {a.fixHint}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Trabajo · agrupar por
          </p>
          {(["day", "dish", "batch", "prep"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                groupBy === g
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              {g === "day"
                ? "Día"
                : g === "dish"
                  ? "Plato"
                  : g === "batch"
                    ? "Lote"
                    : "Prep"}
            </button>
          ))}
          <span className="text-xs text-muted-foreground">
            Estación → Future
          </span>
        </div>

        {groupBy === "prep" ? (
          <ul className="space-y-2">
            {plan.preparations.map((p) => (
              <li key={p.id} className="border-t border-border/40 pt-2 text-sm">
                <span className="font-medium">{p.label}</span>
                <span className="block text-xs text-muted-foreground">
                  Prep {p.preparationDate} → uso {p.requiredUseDate} ·{" "}
                  {p.status} · {p.kind}
                </span>
              </li>
            ))}
          </ul>
        ) : groupBy === "dish" ? (
          <ul className="space-y-2">
            {[...new Map(plan.work.map((w) => [w.dishId, w])).values()].map(
              (sample) => {
                const items = plan.work.filter((w) => w.dishId === sample.dishId);
                const qty = items.reduce((n, w) => n + w.quantity, 0);
                return (
                  <li
                    key={sample.dishId}
                    className="border-t border-border/40 pt-2 text-sm"
                  >
                    <span className="font-medium">{sample.dishLabel}</span>
                    <span className="block text-xs text-muted-foreground">
                      {items.length} días · {qty} uds
                    </span>
                  </li>
                );
              },
            )}
          </ul>
        ) : groupBy === "batch" ? (
          <ul className="space-y-2">
            {plan.work.map((w) => (
              <li key={w.id} className="border-t border-border/40 pt-2 text-sm">
                <span className="font-medium">{w.batchKey}</span>
                <span className="block text-xs text-muted-foreground">
                  {w.dishLabel} · {w.quantity}
                  {w.quantityEstimated ? "*" : ""} uds · {w.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-3">
            {Object.keys(byDay)
              .sort()
              .map((day) => (
                <li key={day}>
                  <p className="text-sm font-semibold">
                    {dayLabel(day)}{" "}
                    <span className="font-normal text-muted-foreground">
                      {day}
                    </span>
                  </p>
                  <ul className="mt-1 space-y-1">
                    {(byDay[day] ?? []).map((w) => (
                      <li key={w.id} className="text-sm">
                        <span className="font-medium">{w.dishLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · {w.quantity}
                          {w.quantityEstimated ? "*" : ""} · deadline{" "}
                          {w.cookingDeadline.slice(0, 16)}
                          {w.allergenHint ? ` · ${w.allergenHint}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-md border border-border px-3 py-3">
        <p className="text-sm font-medium">Handoff Kitchen</p>
        <p className="text-xs text-muted-foreground">
          Qué ejecutar · cuándo · cuánto · para qué día de producción. Sin
          reabrir Orders.
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusChip
            tone={
              plan.status === "ready_for_kitchen" ? "positive" : "info"
            }
            label={
              plan.status === "ready_for_kitchen"
                ? "Listo para Kitchen"
                : "Pendiente de confirmar"
            }
          />
          <StatusChip
            tone="info"
            label={`${plan.preparations.length} pre-preparaciones`}
          />
        </div>
      </div>
    </div>
  );
}
