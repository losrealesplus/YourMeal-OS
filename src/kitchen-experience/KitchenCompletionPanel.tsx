/**
 * KE006 — Zero Friction Kitchen Completion & Handoff (Experience only).
 *
 * Understand complete / remaining / next responsibility.
 * Session completion ≠ durable Complete. Delivery → Future (not accepted).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  buildKitchenCompletion,
  filterCompletionCards,
  progressProvenanceLabel,
  quantityLabel,
  type CompletionNextAction,
  type DayCompletionReadiness,
} from "@/kitchen-experience/completion-view";
import {
  downloadCompletionCsv,
  printCompletion,
} from "@/kitchen-experience/export-completion";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusWorkId?: string | null;
  onOpenWork: (dayDate: string, workId: string) => void;
  onBackToToday: () => void;
  onOpenProgress: () => void;
};

type Filter = "all" | "completed" | "remaining" | "blocked" | "unavailable";

function readinessTone(
  r: DayCompletionReadiness,
): "positive" | "warning" | "info" | "neutral" {
  if (r === "session_complete") return "positive";
  if (r === "blocked_attention") return "warning";
  if (r === "partial_session") return "info";
  if (r === "empty") return "neutral";
  return "warning";
}

export function KitchenCompletionPanel({
  dayDate: focusDay,
  focusWorkId = null,
  onOpenWork,
  onBackToToday,
  onOpenProgress,
}: Props) {
  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(focusWorkId);

  const view = useMemo(() => {
    void tick;
    return buildKitchenCompletion(dayDate);
  }, [dayDate, tick]);

  const filtered = useMemo(
    () => filterCompletionCards(view.cards, filter),
    [view.cards, filter],
  );

  useEffect(() => {
    if (focusWorkId) setOpenId(focusWorkId);
  }, [focusWorkId]);

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function runNext(action: CompletionNextAction) {
    switch (action) {
      case "continue_remaining":
        setFilter("remaining");
        break;
      case "review_blocked":
        setFilter("blocked");
        break;
      case "review_warnings":
        break;
      case "return_today":
        onBackToToday();
        break;
      case "future_delivery":
        toast.message(
          "Delivery → Future · Kitchen no transfiere responsabilidad todavía",
        );
        break;
      case "review_production_handoff":
        break;
    }
  }

  if (view.readiness === "empty") {
    return (
      <section className="space-y-4" aria-labelledby="ke-complete-empty">
        <h2
          id="ke-complete-empty"
          className="text-sm font-semibold tracking-wide"
        >
          Cierre y siguiente paso
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">{view.readinessLabel}</p>
          <p className="text-xs text-muted-foreground">{view.readinessDetail}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Revisar Production Handoff
            </Link>
            <Link
              to="/admin/production-planning"
              search={{ mode: "planning", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar Production
            </Link>
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a Today's Work
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="ke-complete">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ke-complete" className="text-sm font-semibold tracking-wide">
            Cierre y siguiente paso
          </h2>
          <p className="text-xs text-muted-foreground">
            Qué está completo · qué queda · qué sigue — sin fingir Delivery
          </p>
        </div>
        <label className="text-xs">
          <span className="sr-only">Día</span>
          <input
            type="date"
            className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={dayDate}
            onChange={(e) => setDayDate(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="warning" label="TTUC < 5 s" />
        <StatusChip tone="info" label="Next step < 10 s" />
        <StatusChip
          tone={readinessTone(view.readiness)}
          label={view.readinessLabel}
        />
        <StatusChip tone="info" label="Sesión ≠ Complete durable" />
      </div>

      <div className="space-y-2 rounded-md border border-border/60 px-3 py-3">
        <h3 className="text-xs font-semibold tracking-wide">
          Resumen de cierre
        </h3>
        <p className="text-sm font-medium">{view.completionSummary}</p>
        <p className="text-xs text-muted-foreground">{view.readinessDetail}</p>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="info" label={`Total ${view.total}`} />
          <StatusChip
            tone="positive"
            label={`Completados (sesión) ${view.completedSession}`}
          />
          <StatusChip tone="neutral" label={`Restantes ${view.remaining}`} />
          <StatusChip
            tone={view.blocked ? "warning" : "positive"}
            label={
              view.blocked ? `${view.blocked} bloqueados` : "Sin bloqueos"
            }
          />
          <StatusChip
            tone={view.warningCount ? "warning" : "positive"}
            label={
              view.warningCount
                ? `${view.warningCount} avisos`
                : "Sin avisos"
            }
          />
        </div>
        <p className="text-xs">
          <span className="font-medium">Siguiente responsabilidad:</span>{" "}
          {view.nextResponsibility}
        </p>
        <p className="text-xs text-muted-foreground">
          Durable completion: unavailable · Delivery no ha aceptado
          responsabilidad
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {view.nextActions.map((a) =>
          a.id === "review_production_handoff" ? (
            <Link
              key={a.id}
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm",
                a.primary
                  ? "bg-foreground font-medium text-background"
                  : "border border-border",
              )}
            >
              {a.label}
            </Link>
          ) : (
            <button
              key={a.id}
              type="button"
              onClick={() => runNext(a.id)}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm",
                a.primary
                  ? "bg-foreground font-medium text-background"
                  : "border border-border",
              )}
            >
              {a.label}
            </button>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["remaining", "Restantes"],
            ["completed", "Completados (sesión)"],
            ["blocked", "Bloqueados"],
            ["unavailable", "Cierre no disponible"],
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
          onClick={onBackToToday}
          className="text-xs underline-offset-2 hover:underline"
        >
          Volver a Today's Work
        </button>
        <button
          type="button"
          onClick={onOpenProgress}
          className="text-xs underline-offset-2 hover:underline"
        >
          Ver progreso
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printCompletion(view)}
        >
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadCompletionCsv(view);
            toast.success("CSV de cierre descargado");
            refresh();
          }}
        >
          Exportar CSV
        </button>
        <span className="text-xs text-muted-foreground">
          Complete durable / Delivery → Future
        </span>
      </div>

      {view.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide">
            Avisos de cierre
          </h3>
          <ul className="space-y-2">
            {view.warnings.map((w) => (
              <li
                key={w.id}
                className={cn(
                  "rounded-md border px-3 py-2",
                  w.severity === "critical"
                    ? "border-foreground/40"
                    : "border-border/60",
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusChip
                    tone={
                      w.severity === "critical"
                        ? "warning"
                        : w.severity === "important"
                          ? "info"
                          : "neutral"
                    }
                    label={w.severity}
                  />
                  <p className="text-sm font-medium">{w.message}</p>
                </div>
                <button
                  type="button"
                  className="mt-1 text-xs underline-offset-2 hover:underline"
                  onClick={() => runNext(w.nextAction)}
                >
                  Siguiente acción
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {filtered.map((c) => {
          const card = c.line.card;
          const open = openId === card.id;
          return (
            <li
              key={card.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                c.line.bucket === "blocked" && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {card.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {quantityLabel(card)} uds · {card.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline {card.cookingDeadline}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.completionStatus} · {c.nextActionLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={
                      c.line.bucket === "completed_session"
                        ? "positive"
                        : c.line.bucket === "blocked"
                          ? "warning"
                          : "neutral"
                    }
                    label={c.completionStatus}
                  />
                  <StatusChip
                    tone={
                      c.line.provenance === "session" ? "info" : "neutral"
                    }
                    label={progressProvenanceLabel(c.line.provenance)}
                  />
                  {c.line.hasCriticalSpecial ? (
                    <StatusChip tone="warning" label="Info crítica" />
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => onOpenWork(card.productionDay, card.id)}
                >
                  Abrir trabajo
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => setOpenId(open ? null : card.id)}
                >
                  {open ? "Cerrar detalle" : "Ver detalle"}
                </button>
              </div>
              {open ? (
                <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                  <p>
                    <span className="font-medium">Estado de cierre:</span>{" "}
                    {c.completionStatus}
                  </p>
                  <p>
                    <span className="font-medium">Siguiente:</span>{" "}
                    {c.nextActionLabel}
                  </p>
                  <p>
                    <span className="font-medium">Notas:</span>{" "}
                    {card.operationalNotes}
                  </p>
                  <p className="text-muted-foreground">
                    Session completion no es CompleteExecutionUnit. Delivery no
                    acepta responsabilidad aquí.
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ningún ítem en este filtro.
        </p>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        {view.durableCompletionGap}
      </p>
    </section>
  );
}
