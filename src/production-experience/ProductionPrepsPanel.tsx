/**
 * PE004 — Zero Friction Production Pre-Preparations (Experience only).
 *
 * What must be prepared before cooking day — visible, actionable, deadline-aware.
 * Not Kitchen.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  buildPrepViews,
  downloadPrepListCsv,
  markPrepPending,
  markPrepReady,
  prepKindLabel,
  prepStatusLabel,
  printPrepList,
  reschedulePrepDate,
  type PrepView,
} from "@/production-experience/prep-view";
import {
  getProductionPlan,
  listProductionPlans,
} from "@/production-experience/production-plan";
import { dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Filter = "all" | "pending" | "ready" | "overdue" | "blocked";

type Props = {
  canWrite: boolean;
  weekStart?: string | null;
  onOpenRelatedWork: (weekStart: string) => void;
  onBackToPlanning: () => void;
};

function statusTone(
  s: PrepView["effectiveStatus"],
): "positive" | "warning" | "info" | "neutral" {
  if (s === "ready" || s === "done") return "positive";
  if (s === "overdue" || s === "blocked") return "warning";
  if (s === "scheduled") return "info";
  return "neutral";
}

export function ProductionPrepsPanel({
  canWrite,
  weekStart: focusWeek,
  onOpenRelatedWork,
  onBackToPlanning,
}: Props) {
  const [tick, setTick] = useState(0);
  const [weekStart, setWeekStart] = useState<string | null>(focusWeek ?? null);
  const [filter, setFilter] = useState<Filter>("all");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const plans = useMemo(() => {
    void tick;
    return listProductionPlans();
  }, [tick]);

  const activeWeek = weekStart ?? plans[0]?.weekStart ?? null;

  const plan = useMemo(() => {
    void tick;
    return activeWeek ? getProductionPlan(activeWeek) : null;
  }, [activeWeek, tick]);

  const views = useMemo(
    () => (plan ? buildPrepViews(plan) : []),
    [plan, tick],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return views;
    if (filter === "pending") {
      return views.filter(
        (v) =>
          v.effectiveStatus === "pending" ||
          v.effectiveStatus === "scheduled",
      );
    }
    if (filter === "ready") {
      return views.filter(
        (v) => v.effectiveStatus === "ready" || v.effectiveStatus === "done",
      );
    }
    return views.filter((v) => v.effectiveStatus === filter);
  }, [views, filter]);

  function refresh() {
    setTick((n) => n + 1);
  }

  if (plans.length === 0 || !plan || !activeWeek) {
    return (
      <section className="space-y-4" aria-labelledby="pe-preps-empty">
        <h2 id="pe-preps-empty" className="text-sm font-semibold tracking-wide">
          Pre-preparaciones
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay plan de producción.</p>
          <p className="text-xs text-muted-foreground">
            Genera un plan desde una semana publicada. Las preps se exponen
            desde el trabajo planificado — no desde Kitchen.
          </p>
          <button
            type="button"
            onClick={onBackToPlanning}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Volver a Production Planning
          </button>
        </div>
      </section>
    );
  }

  if (plan.preparations.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="pe-preps-none">
        <h2 id="pe-preps-none" className="text-sm font-semibold tracking-wide">
          Pre-preparaciones
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay pre-preparaciones requeridas.
          </p>
          <p className="text-xs text-muted-foreground">
            Este plan no generó bases, salsas, descongelados u otras preps
            inferidas. Puedes seguir planificando o adaptar el trabajo.
          </p>
          <button
            type="button"
            onClick={onBackToPlanning}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Volver a Production Planning
          </button>
        </div>
      </section>
    );
  }

  const overdueCount = views.filter((v) => v.overdue).length;
  const readyCount = views.filter(
    (v) => v.effectiveStatus === "ready" || v.effectiveStatus === "done",
  ).length;

  return (
    <section className="space-y-5" aria-labelledby="pe-preps">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pe-preps" className="text-sm font-semibold tracking-wide">
            Pre-preparaciones
          </h2>
          <p className="text-xs text-muted-foreground">
            Puente planificación → ejecución — sin sorpresas el día de cocina
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
                {formatWeekLabel(p.weekStart)} · {p.preparations.length} preps
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={formatWeekLabel(plan.weekStart)} />
        <StatusChip tone="info" label={`${views.length} preps`} />
        <StatusChip
          tone={overdueCount ? "warning" : "positive"}
          label={overdueCount ? `${overdueCount} vencidas` : "Sin vencidas"}
        />
        <StatusChip tone="positive" label={`${readyCount} listas`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["pending", "Pendientes"],
            ["ready", "Listas"],
            ["overdue", "Vencidas"],
            ["blocked", "Bloqueadas"],
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => printPrepList(plan)}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Imprimir lista prep
        </button>
        <button
          type="button"
          onClick={() => {
            downloadPrepListCsv(plan);
            toast.success("CSV preps descargado");
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Exportar
        </button>
        <button
          type="button"
          onClick={onBackToPlanning}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Seguir planificación
        </button>
        <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
          Bulk mark ready → Future · Templates → Reserved
        </span>
      </div>

      <ul className="space-y-3">
        {filtered.map((v) => (
          <li
            key={v.prep.id}
            className={cn(
              "rounded-md border border-border/60 px-3 py-3",
              v.overdue && "border-foreground/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{v.prep.label}</p>
                <p className="text-xs text-muted-foreground">
                  {prepKindLabel(v.prep.kind)} · {v.relatedDish}
                  {" · "}
                  {v.prep.requiredQuantity ?? v.work?.quantity ?? "?"} uds
                </p>
                <p className="text-xs text-muted-foreground">
                  Prep {dayLabel(v.prep.preparationDate)} ·{" "}
                  {v.prep.preparationDate} → uso {v.prep.requiredUseDate}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusChip
                  tone={statusTone(v.effectiveStatus)}
                  label={prepStatusLabel(v.effectiveStatus)}
                />
                <StatusChip
                  tone={v.priority === "high" ? "warning" : "info"}
                  label={`Prioridad ${v.priority}`}
                />
                {v.overdue ? (
                  <StatusChip tone="warning" label="Alerta overdue" />
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {v.effectiveStatus !== "ready" &&
              v.effectiveStatus !== "done" ? (
                <button
                  type="button"
                  disabled={!canWrite}
                  className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                  onClick={() => {
                    if (!markPrepReady(activeWeek, v.prep.id)) {
                      toast.error("No se pudo marcar");
                      return;
                    }
                    refresh();
                    toast.success("Prep lista");
                  }}
                >
                  Marcar lista
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canWrite}
                  className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                  onClick={() => {
                    markPrepPending(activeWeek, v.prep.id);
                    refresh();
                    toast.message("Prep vuelve a programada");
                  }}
                >
                  Marcar pendiente
                </button>
              )}
              <button
                type="button"
                disabled={!canWrite}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                onClick={() => {
                  setRescheduleId(v.prep.id);
                  setRescheduleDate(v.prep.preparationDate);
                }}
              >
                Reprogramar
              </button>
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => onOpenRelatedWork(activeWeek)}
              >
                Abrir trabajo relacionado
              </button>
            </div>

            {rescheduleId === v.prep.id ? (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="text-xs">
                  Nueva fecha prep
                  <input
                    type="date"
                    className="mt-1 block min-h-10 rounded-md border border-border bg-background px-2"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={!canWrite}
                  className="inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                  onClick={() => {
                    const next = reschedulePrepDate(
                      activeWeek,
                      v.prep.id,
                      rescheduleDate,
                    );
                    if (!next) {
                      toast.error("No se pudo reprogramar");
                      return;
                    }
                    setRescheduleId(null);
                    refresh();
                    toast.success("Prep reprogramada");
                  }}
                >
                  Confirmar fecha
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => setRescheduleId(null)}
                >
                  Cancelar
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguna prep en este filtro.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Pre-preparaciones ≠ Kitchen. Kitchen ejecuta; aquí se anticipa.
      </p>
      <Link
        to="/admin/kitchen"
        className="text-xs underline-offset-2 hover:underline"
      >
        Abrir Kitchen (ejecución)
      </Link>
    </section>
  );
}
