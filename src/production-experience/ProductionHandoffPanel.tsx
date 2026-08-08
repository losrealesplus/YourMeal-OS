/**
 * PE006 — Zero Friction Kitchen Handoff (Experience only).
 *
 * Transfer responsibility. Do not re-plan. Do not invent missing data.
 * Kitchen Execution → Future.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  buildKitchenHandoff,
  confirmKitchenHandoff,
  downloadKitchenHandoffCsv,
  printKitchenHandoff,
  readinessLabel,
  type HandoffNavAction,
  type HandoffReadiness,
} from "@/production-experience/handoff-view";
import {
  getProductionPlan,
  listProductionPlans,
} from "@/production-experience/production-plan";
import { formatWeekLabel } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  weekStart?: string | null;
  onNavigate: (action: HandoffNavAction, weekStart: string) => void;
};

function readinessTone(
  r: HandoffReadiness,
): "positive" | "warning" | "info" | "neutral" {
  if (r === "ready") return "positive";
  if (r === "ready_with_warnings") return "warning";
  return "warning";
}

export function ProductionHandoffPanel({
  canWrite,
  weekStart: focusWeek,
  onNavigate,
}: Props) {
  const [tick, setTick] = useState(0);
  const [weekStart, setWeekStart] = useState<string | null>(focusWeek ?? null);
  const [ackWarnings, setAckWarnings] = useState(false);

  const plans = useMemo(() => {
    void tick;
    return listProductionPlans();
  }, [tick]);

  const activeWeek = weekStart ?? plans[0]?.weekStart ?? null;

  const plan = useMemo(() => {
    void tick;
    return activeWeek ? getProductionPlan(activeWeek) : null;
  }, [activeWeek, tick]);

  const view = useMemo(
    () => (plan ? buildKitchenHandoff(plan) : null),
    [plan, tick],
  );

  function refresh() {
    setTick((n) => n + 1);
  }

  if (plans.length === 0 || !plan || !activeWeek || !view) {
    return (
      <section className="space-y-4" aria-labelledby="pe-handoff-empty">
        <h2 id="pe-handoff-empty" className="text-sm font-semibold tracking-wide">
          Kitchen Handoff
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay trabajo de producción revisado para handoff.
          </p>
          <p className="text-xs text-muted-foreground">
            Genera un plan desde una semana publicada. Nunca se inventa un
            handoff desde una fuente incompleta.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("planning", focusWeek ?? "")}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Volver a Production Planning
          </button>
        </div>
      </section>
    );
  }

  function onConfirm() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const result = confirmKitchenHandoff(activeWeek!, {
      acknowledgeWarnings: ackWarnings,
    });
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    setAckWarnings(false);
    refresh();
    toast.success(
      result.readiness === "ready_with_warnings"
        ? "Handoff confirmado con avisos · Ready for Kitchen"
        : "Handoff confirmado · Ready for Kitchen",
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="pe-handoff">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="pe-handoff" className="text-sm font-semibold tracking-wide">
            Kitchen Handoff
          </h2>
          <p className="text-xs text-muted-foreground">
            Production decide · Kitchen ejecuta · sin reinterpretar
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Semana</span>
          <select
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={activeWeek}
            onChange={(e) => {
              setWeekStart(e.target.value);
              setAckWarnings(false);
            }}
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
        <StatusChip tone="info" label={view.weekLabel} />
        <StatusChip
          tone={readinessTone(view.readiness)}
          label={readinessLabel(view.readiness)}
        />
        <StatusChip
          tone="info"
          label={`${view.workCount} trabajos · ${view.totalQuantity} uds`}
        />
        <StatusChip
          tone={view.warningCount ? "warning" : "positive"}
          label={
            view.warningCount
              ? `${view.warningCount} avisos`
              : "Sin avisos materiales"
          }
        />
        {view.alreadyHandedOff ? (
          <StatusChip tone="positive" label="Ya transferido" />
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">{view.readinessReason}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={
            !canWrite ||
            view.readiness === "blocked" ||
            (view.readiness === "ready_with_warnings" && !ackWarnings)
          }
          onClick={onConfirm}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          Confirmar Handoff
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => onNavigate("planning", activeWeek)}
        >
          Revisar Production
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => onNavigate("alerts", activeWeek)}
        >
          Revisar Alertas
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => onNavigate("preps", activeWeek)}
        >
          Revisar Preps
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printKitchenHandoff(view)}
        >
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadKitchenHandoffCsv(view);
            toast.success("CSV de handoff descargado");
          }}
        >
          Exportar CSV
        </button>
        <span className="text-xs text-muted-foreground">
          Open Kitchen Execution → Future
        </span>
      </div>

      {view.readiness === "ready_with_warnings" ? (
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={ackWarnings}
            onChange={(e) => setAckWarnings(e.target.checked)}
            disabled={!canWrite}
          />
          <span>
            Asumo los avisos abiertos y confirmo el handoff con riesgos
            explícitos (no se ocultan).
          </span>
        </label>
      ) : null}

      {view.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide">Avisos</h3>
          <ul className="space-y-2">
            {view.warnings.map((w) => (
              <li
                key={w.id}
                className={cn(
                  "rounded-md border border-border/60 px-3 py-2",
                  w.severity === "block" && "border-foreground/40",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{w.message}</p>
                    <p className="text-xs text-muted-foreground">{w.fixHint}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <StatusChip
                      tone={w.severity === "info" ? "info" : "warning"}
                      label={w.severity}
                    />
                    <button
                      type="button"
                      className="text-xs underline-offset-2 hover:underline"
                      onClick={() => onNavigate(w.nextAction, activeWeek)}
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sin avisos que ocultar — handoff limpio.
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide">
          Trabajo a ejecutar
        </h3>
        <ul className="space-y-3">
          {view.lines.map((l) => (
            <li
              key={l.workId}
              className="rounded-md border border-border/60 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {l.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {l.quantity}
                      {l.quantityEstimated ? "*" : ""} uds · {l.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.dayLabel} · {l.productionDay} · deadline{" "}
                    {l.cookingDeadline}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Preps: {l.requiredPreps} · estado {l.prepStatusSummary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Alérgenos: {l.allergenHint ?? "—"} · Dietario:{" "}
                    {l.dietaryHint ?? "—"}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className="font-medium">Notas:</span>{" "}
                    {l.operationalNotes}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cliente / pedido / instrucción especial: no disponible en
                    este substrate
                  </p>
                </div>
                <StatusChip
                  tone={l.priority === "high" ? "warning" : "info"}
                  label={l.priority}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
