/**
 * KE005 — Zero Friction Kitchen Execution Progress (Experience only).
 *
 * Understand completed / remaining / warnings without inventing durable state.
 * Session marks labeled as session. Start / Pause / Resume / Block / Assign → Future.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  downloadKitchenWorkCsv,
  printKitchenWork,
} from "@/kitchen-experience/export-kitchen-work";
import {
  buildExecutionProgress,
  filterProgressLines,
  progressProvenanceLabel,
  quantityLabel,
  type ExecutionProgressLine,
} from "@/kitchen-experience/execution-progress";
import { kitchenWorkStatusLabel } from "@/kitchen-experience/today-work";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusWorkId?: string | null;
  onOpenWork: (dayDate: string, workId: string) => void;
  onBackToToday: () => void;
};

type Filter = "all" | "remaining" | "completed" | "blocked" | "unknown";

function statusTone(
  line: ExecutionProgressLine,
): "positive" | "warning" | "info" | "neutral" {
  if (line.bucket === "completed_session") return "positive";
  if (line.bucket === "blocked") return "warning";
  if (line.bucket === "in_progress_session") return "info";
  return "neutral";
}

export function KitchenProgressPanel({
  dayDate: focusDay,
  focusWorkId = null,
  onOpenWork,
  onBackToToday,
}: Props) {
  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<Filter>("remaining");
  const [openId, setOpenId] = useState<string | null>(focusWorkId);

  const summary = useMemo(() => {
    void tick;
    return buildExecutionProgress(dayDate);
  }, [dayDate, tick]);

  const filtered = useMemo(
    () => filterProgressLines(summary.lines, filter),
    [summary.lines, filter],
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

  if (summary.emptyReason) {
    return (
      <section className="space-y-4" aria-labelledby="ke-progress-empty">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="ke-progress-empty"
              className="text-sm font-semibold tracking-wide"
            >
              Progreso de ejecución
            </h2>
            <p className="text-xs text-muted-foreground">
              Sin trabajo — no inventamos progreso
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
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay trabajo de ejecución.</p>
          <p className="text-xs text-muted-foreground">{summary.emptyReason}</p>
          <p className="text-xs">
            <span className="font-medium">Siguiente:</span>{" "}
            {summary.nextActionHint}
          </p>
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
    <section className="space-y-5" aria-labelledby="ke-progress">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ke-progress" className="text-sm font-semibold tracking-wide">
            Progreso de ejecución
          </h2>
          <p className="text-xs text-muted-foreground">
            Qué está hecho · qué queda · qué pide atención — sin fingir Capability
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
        <StatusChip tone="warning" label="TTEP < 5 s" />
        <StatusChip tone="info" label="Remaining < 5 s" />
        <StatusChip tone="info" label="Sesión ≠ Capability" />
        <StatusChip
          tone="info"
          label={`${summary.dayLabel} · ${summary.dayDate}`}
        />
      </div>

      <div className="space-y-2 rounded-md border border-border/60 px-3 py-3">
        <h3 className="text-xs font-semibold tracking-wide">
          Resumen de progreso
        </h3>
        <p className="text-sm font-medium">{summary.completionIndicator}</p>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="info" label={`Total ${summary.total}`} />
          <StatusChip
            tone="positive"
            label={`Completados (sesión) ${summary.completedSession}`}
          />
          <StatusChip
            tone="info"
            label={`En curso (sesión) ${summary.inProgressSession}`}
          />
          <StatusChip
            tone="neutral"
            label={`Restantes ${summary.remaining}`}
          />
          <StatusChip
            tone="neutral"
            label={`Disponibles ${summary.available}`}
          />
          <StatusChip
            tone={summary.blocked ? "warning" : "positive"}
            label={
              summary.blocked
                ? `${summary.blocked} bloqueados`
                : "Sin bloqueos"
            }
          />
          <StatusChip
            tone={summary.warningCount ? "warning" : "positive"}
            label={
              summary.warningCount
                ? `${summary.warningCount} avisos`
                : "Sin avisos"
            }
          />
        </div>
        {summary.sessionCompletionRatio != null ? (
          <p className="text-xs text-muted-foreground">
            Ratio de sesión:{" "}
            {Math.round(summary.sessionCompletionRatio * 100)}% completado en
            esta sesión — no es progreso durable de Capability.
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Execution progress not yet available en Capability. Marcas de sesión
          (Today&apos;s Work) no abren Start / Complete durable.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["remaining", "Restantes"],
            ["all", "Todos"],
            ["completed", "Completados (sesión)"],
            ["blocked", "Bloqueados"],
            ["unknown", "Sin progreso durable"],
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
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => printKitchenWork(summary.view)}
        >
          Imprimir
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadKitchenWorkCsv(summary.view);
            toast.success("CSV de cocina descargado");
            refresh();
          }}
        >
          Exportar
        </button>
        <span className="text-xs text-muted-foreground">
          Start / Pause / Resume / Block / Assign → Future
        </span>
      </div>

      {summary.view.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide">Avisos</h3>
          <ul className="space-y-2">
            {summary.view.warnings.map((w) => (
              <li
                key={w.id}
                className="rounded-md border border-border/60 px-3 py-2"
              >
                <p className="text-sm font-medium">{w.message}</p>
                <p className="text-xs text-muted-foreground">{w.fixHint}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {filtered.map((line) => {
          const c = line.card;
          const open = openId === c.id;
          return (
            <li
              key={c.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                line.bucket === "blocked" && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {c.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {quantityLabel(c)} uds · {c.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline {c.cookingDeadline} · prep {c.prepStatusSummary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {line.progressLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={statusTone(line)}
                    label={line.statusLabel}
                  />
                  <StatusChip
                    tone={
                      line.provenance === "session" ? "info" : "neutral"
                    }
                    label={progressProvenanceLabel(line.provenance)}
                  />
                  {line.hasCriticalSpecial ? (
                    <StatusChip tone="warning" label="Info crítica" />
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => onOpenWork(c.productionDay, c.id)}
                >
                  Abrir trabajo
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => setOpenId(open ? null : c.id)}
                >
                  {open ? "Cerrar detalle" : "Ver detalle"}
                </button>
              </div>
              {open ? (
                <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                  <p>
                    <span className="font-medium">Estado mostrado:</span>{" "}
                    {kitchenWorkStatusLabel(c.status)} (
                    {progressProvenanceLabel(line.provenance)})
                  </p>
                  <p>
                    <span className="font-medium">Progreso durable:</span>{" "}
                    {line.durableProgressAvailable
                      ? "disponible"
                      : "Execution progress not yet available"}
                  </p>
                  <p>
                    <span className="font-medium">Notas:</span>{" "}
                    {c.operationalNotes}
                  </p>
                  <p className="text-muted-foreground">
                    Abrir o ver un ítem no lo marca completado.
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ningún ítem en este filtro. Cambia el filtro o vuelve a Today&apos;s
          Work.
        </p>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        {summary.durableProgressGap}
      </p>
    </section>
  );
}
