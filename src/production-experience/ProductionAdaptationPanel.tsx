/**
 * PE003 — Zero Friction Production Adaptation (Experience only).
 *
 * Living plan: move · resize · rebatch · deadlines · prep reschedule.
 * Never regenerate the whole plan for a small change.
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  adjustWorkDeadline,
  changeWorkBatch,
  moveWorkToDay,
  previewAdjustDeadline,
  previewChangeBatch,
  previewMoveWork,
  previewReschedulePrep,
  previewResizeQuantity,
  reschedulePrep,
  resizeWorkQuantity,
  type AdaptationImpact,
} from "@/production-experience/adapt-production-plan";
import {
  getProductionPlan,
  listProductionPlans,
  totalQuantity,
  type ProductionPlan,
  type ProductionWorkItem,
} from "@/production-experience/production-plan";
import {
  dayLabel,
  formatWeekLabel,
  weekDates,
} from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Action = "move" | "resize" | "batch" | "deadline" | "prep" | null;

type Props = {
  canWrite: boolean;
  weekStart?: string | null;
  onOpenKitchen: (weekStart: string) => void;
  onBackToSearch: () => void;
};

export function ProductionAdaptationPanel({
  canWrite,
  weekStart: focusWeek,
  onOpenKitchen,
  onBackToSearch,
}: Props) {
  const [tick, setTick] = useState(0);
  const [weekStart, setWeekStart] = useState<string | null>(focusWeek ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [pendingImpact, setPendingImpact] = useState<AdaptationImpact | null>(
    null,
  );
  const [moveDay, setMoveDay] = useState("");
  const [qty, setQty] = useState("1");
  const [batchSuffix, setBatchSuffix] = useState("");
  const [deadline, setDeadline] = useState("");
  const [prepId, setPrepId] = useState<string | null>(null);
  const [prepDate, setPrepDate] = useState("");

  const plans = useMemo(() => {
    void tick;
    return listProductionPlans();
  }, [tick]);

  const activeWeek = weekStart ?? plans[0]?.weekStart ?? null;

  const plan = useMemo(() => {
    void tick;
    return activeWeek ? getProductionPlan(activeWeek) : null;
  }, [activeWeek, tick]);

  const selected: ProductionWorkItem | null =
    plan?.work.find((w) => w.id === selectedId) ?? null;

  const days = activeWeek ? weekDates(activeWeek) : [];

  function refresh() {
    setTick((n) => n + 1);
  }

  function clearAction() {
    setAction(null);
    setPendingImpact(null);
  }

  function showImpact(impact: AdaptationImpact | null) {
    if (!impact) {
      toast.message("Sin cambio");
      return;
    }
    setPendingImpact(impact);
  }

  function applyConfirmed(
    runner: () => { plan: ProductionPlan; impact: AdaptationImpact } | null,
  ) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const result = runner();
    if (!result) {
      toast.error("No se pudo adaptar");
      return;
    }
    refresh();
    clearAction();
    toast.success(result.impact.summary);
  }

  if (plans.length === 0 || !plan || !activeWeek) {
    return (
      <section className="space-y-4" aria-labelledby="pe-adapt-empty">
        <h2 id="pe-adapt-empty" className="text-sm font-semibold tracking-wide">
          Adaptación de producción
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay plan que adaptar.</p>
          <p className="text-xs text-muted-foreground">
            Genera un plan desde una semana publicada. Adaptation no regenera
            desde cero.
          </p>
          <Link
            to="/admin/production-planning"
            search={{ mode: "planning", weekStart: undefined }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Abrir Production Planning
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="pe-adapt">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pe-adapt" className="text-sm font-semibold tracking-wide">
            Adaptación de producción
          </h2>
          <p className="text-xs text-muted-foreground">
            Plan vivo — ajusta sin reconstruir
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Semana</span>
          <select
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={activeWeek}
            onChange={(e) => {
              setWeekStart(e.target.value);
              clearAction();
              setSelectedId(null);
            }}
          >
            {plans.map((p) => (
              <option key={p.weekStart} value={p.weekStart}>
                {formatWeekLabel(p.weekStart)} · {p.status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={formatWeekLabel(plan.weekStart)} />
        <StatusChip
          tone="info"
          label={`${plan.work.length} trabajos · ${totalQuantity(plan)} uds`}
        />
        <StatusChip
          tone={plan.status === "ready_for_kitchen" ? "warning" : "info"}
          label={
            plan.status === "ready_for_kitchen"
              ? "Adaptar revierte Kitchen ready"
              : plan.status
          }
        />
        <StatusChip
          tone={
            plan.alerts.some((a) => a.severity === "warn") ? "warning" : "positive"
          }
          label={`${plan.alerts.filter((a) => a.severity !== "info").length} avisos`}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {plan.dayLoads.map((d) => (
          <div
            key={d.dayDate}
            className={cn(
              "rounded-md border border-border/60 px-3 py-2 text-xs",
              d.overload && "border-foreground/40",
            )}
          >
            <span className="font-medium">
              {dayLabel(d.dayDate)} · {d.totalQuantity} uds
            </span>
            {d.overload ? " · sobrecarga" : ""}
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {plan.work.map((w) => {
          const open = selectedId === w.id;
          return (
            <li
              key={w.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                open && "border-foreground/50",
              )}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setSelectedId(open ? null : w.id);
                  clearAction();
                  setQty(String(w.quantity));
                  setBatchSuffix(w.batchKey.split("__")[1] ?? w.dishId);
                  setDeadline(w.cookingDeadline.slice(0, 16));
                  setMoveDay(w.productionDay);
                }}
              >
                <p className="text-sm font-semibold">{w.dishLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {dayLabel(w.productionDay)} · {w.productionDay} · {w.quantity}
                  {w.quantityEstimated ? "*" : ""} uds · lote {w.batchKey}
                </p>
                <p className="text-xs text-muted-foreground">
                  Deadline {w.cookingDeadline.slice(0, 16)}
                </p>
              </button>

              {open ? (
                <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["move", "Mover"],
                        ["resize", "Cantidad"],
                        ["batch", "Lote"],
                        ["deadline", "Deadline"],
                        ["prep", "Prep"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        disabled={!canWrite}
                        onClick={() => {
                          setAction(id);
                          setPendingImpact(null);
                          if (id === "prep") {
                            const first = plan.preparations.find(
                              (p) => p.workId === w.id,
                            );
                            setPrepId(first?.id ?? null);
                            setPrepDate(first?.preparationDate ?? "");
                          }
                        }}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs disabled:opacity-40",
                          action === id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {action === "move" ? (
                    <div className="space-y-2">
                      <label className="block text-xs">
                        Día destino
                        <select
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={moveDay}
                          onChange={(e) => setMoveDay(e.target.value)}
                        >
                          {days.map((d) => (
                            <option key={d} value={d}>
                              {dayLabel(d)} · {d}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() =>
                          showImpact(previewMoveWork(plan, w.id, moveDay))
                        }
                      >
                        Preview impact
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        className="ml-3 inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                        onClick={() =>
                          applyConfirmed(() =>
                            moveWorkToDay(activeWeek, w.id, moveDay),
                          )
                        }
                      >
                        Confirmar mover
                      </button>
                    </div>
                  ) : null}

                  {action === "resize" ? (
                    <div className="space-y-2">
                      <label className="block text-xs">
                        Cantidad
                        <input
                          type="number"
                          min={1}
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() =>
                          showImpact(
                            previewResizeQuantity(
                              plan,
                              w.id,
                              Number(qty) || 0,
                            ),
                          )
                        }
                      >
                        Preview impact
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        className="ml-3 inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                        onClick={() =>
                          applyConfirmed(() =>
                            resizeWorkQuantity(
                              activeWeek,
                              w.id,
                              Number(qty) || 0,
                            ),
                          )
                        }
                      >
                        Confirmar cantidad
                      </button>
                    </div>
                  ) : null}

                  {action === "batch" ? (
                    <div className="space-y-2">
                      <label className="block text-xs">
                        Sufijo de lote
                        <input
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={batchSuffix}
                          onChange={(e) => setBatchSuffix(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() =>
                          showImpact(
                            previewChangeBatch(plan, w.id, batchSuffix),
                          )
                        }
                      >
                        Preview impact
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        className="ml-3 inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                        onClick={() =>
                          applyConfirmed(() =>
                            changeWorkBatch(activeWeek, w.id, batchSuffix),
                          )
                        }
                      >
                        Confirmar lote
                      </button>
                    </div>
                  ) : null}

                  {action === "deadline" ? (
                    <div className="space-y-2">
                      <label className="block text-xs">
                        Deadline cocción (UTC)
                        <input
                          type="datetime-local"
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() => {
                          const iso = deadline.length === 16
                            ? `${deadline}:00.000Z`
                            : deadline;
                          showImpact(
                            previewAdjustDeadline(plan, w.id, iso),
                          );
                        }}
                      >
                        Preview impact
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        className="ml-3 inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                        onClick={() => {
                          const iso =
                            deadline.length === 16
                              ? `${deadline}:00.000Z`
                              : deadline;
                          applyConfirmed(() =>
                            adjustWorkDeadline(activeWeek, w.id, iso),
                          );
                        }}
                      >
                        Confirmar deadline
                      </button>
                    </div>
                  ) : null}

                  {action === "prep" ? (
                    <div className="space-y-2">
                      <label className="block text-xs">
                        Pre-preparación
                        <select
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={prepId ?? ""}
                          onChange={(e) => {
                            setPrepId(e.target.value);
                            const p = plan.preparations.find(
                              (x) => x.id === e.target.value,
                            );
                            setPrepDate(p?.preparationDate ?? "");
                          }}
                        >
                          {plan.preparations
                            .filter((p) => p.workId === w.id)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="block text-xs">
                        Nueva fecha prep
                        <input
                          type="date"
                          className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-2"
                          value={prepDate}
                          onChange={(e) => setPrepDate(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() => {
                          if (!prepId) return;
                          showImpact(
                            previewReschedulePrep(plan, prepId, prepDate),
                          );
                        }}
                      >
                        Preview impact
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite || !prepId}
                        className="ml-3 inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background disabled:opacity-40"
                        onClick={() => {
                          if (!prepId) return;
                          applyConfirmed(() =>
                            reschedulePrep(activeWeek, prepId, prepDate),
                          );
                        }}
                      >
                        Confirmar prep
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {pendingImpact ? (
        <div className="space-y-2 rounded-md border border-border px-3 py-3">
          <p className="text-sm font-medium">Impacto previsto</p>
          <p className="text-xs">{pendingImpact.summary}</p>
          <p className="text-xs text-muted-foreground">
            {pendingImpact.before} → {pendingImpact.after}
          </p>
          <p className="text-xs text-muted-foreground">
            Kitchen: {pendingImpact.kitchenImpact}
          </p>
          {pendingImpact.alertsTriggered.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Alertas: {pendingImpact.alertsTriggered.join(" · ")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin alertas nuevas previstas
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Días afectados: {pendingImpact.daysAffected.join(", ")}
            {pendingImpact.loadChanged ? " · carga cambia" : ""}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onOpenKitchen(activeWeek)}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Abrir Kitchen handoff
        </button>
        <button
          type="button"
          onClick={onBackToSearch}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Volver a búsqueda
        </button>
        <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
          Bulk adaptation → Future · Templates → Reserved
        </span>
      </div>

      {selected ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Seleccionado: {selected.dishLabel} · confianza restaurada al
          confirmar
        </p>
      ) : null}
    </section>
  );
}
