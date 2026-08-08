/**
 * KE001 — Zero Friction Kitchen Execution · Today's Work (Experience only).
 *
 * Receive handoff. Understand work. Do not plan. Do not invent substrate.
 * Start / Pause / Resume / Block / Assign → Future (Capability).
 */

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  downloadKitchenWorkCsv,
  printKitchenWork,
} from "@/kitchen-experience/export-kitchen-work";
import {
  buildTodaysKitchenWork,
  filterKitchenCards,
  kitchenWorkStatusLabel,
  setKitchenWorkStatus,
  type KitchenExecutionCard,
  type KitchenWorkFilter,
  type KitchenWorkStatus,
} from "@/kitchen-experience/today-work";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  dayDate?: string | null;
};

function statusTone(
  s: KitchenWorkStatus,
): "positive" | "warning" | "info" | "neutral" {
  if (s === "completed") return "positive";
  if (s === "blocked") return "warning";
  if (s === "in_progress") return "info";
  return "neutral";
}

export function KitchenTodayPanel({ canWrite, dayDate: focusDay }: Props) {
  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [filter, setFilter] = useState<KitchenWorkFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const view = useMemo(() => {
    void tick;
    return buildTodaysKitchenWork(dayDate);
  }, [dayDate, tick]);

  const filtered = useMemo(
    () => filterKitchenCards(view.cards, filter),
    [view.cards, filter],
  );

  function refresh() {
    setTick((n) => n + 1);
  }

  function mark(card: KitchenExecutionCard, status: KitchenWorkStatus) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    setKitchenWorkStatus(card.id, status);
    refresh();
    toast.success(`Estado · ${kitchenWorkStatusLabel(status)} (sesión)`);
  }

  if (view.emptyReason) {
    return (
      <section className="space-y-4" aria-labelledby="ke-today-empty">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ke-today-empty" className="text-sm font-semibold tracking-wide">
              Trabajo de hoy
            </h2>
            <p className="text-xs text-muted-foreground">
              Kitchen recibe — no planifica
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
          <p className="text-sm font-medium">No hay trabajo listo para ejecutar.</p>
          <p className="text-xs text-muted-foreground">{view.emptyReason}</p>
          <p className="text-xs">
            <span className="font-medium">Siguiente:</span> {view.nextActionHint}
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
          </div>
        </div>
      </section>
    );
  }

  const open = filtered.find((c) => c.id === openId) ?? null;

  return (
    <section className="space-y-5" aria-labelledby="ke-today">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ke-today" className="text-sm font-semibold tracking-wide">
            Trabajo de hoy
          </h2>
          <p className="text-xs text-muted-foreground">
            Qué · cuánto · cuándo · contexto — sin reinterpretar Production
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
        <StatusChip tone="info" label={`${view.dayLabel} · ${view.dayDate}`} />
        <StatusChip
          tone="positive"
          label={`${view.cards.length} trabajos`}
        />
        <StatusChip
          tone={view.warnings.length ? "warning" : "positive"}
          label={
            view.warnings.length
              ? `${view.warnings.length} avisos`
              : "Sin avisos"
          }
        />
        <StatusChip
          tone="info"
          label={`${view.handedOffPlanCount} handoff(s)`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["urgent", "Urgente"],
            ["pending", "Pendiente"],
            ["blocked", "Bloqueado"],
            ["completed", "Completado"],
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
          onClick={() => printKitchenWork(view)}
        >
          Imprimir / PDF
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadKitchenWorkCsv(view);
            toast.success("CSV de cocina descargado");
          }}
        >
          Exportar CSV
        </button>
        <span className="text-xs text-muted-foreground">
          Start / Pause / Assign → Future
        </span>
      </div>

      {view.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide">Avisos</h3>
          <ul className="space-y-2">
            {view.warnings.map((w) => (
              <li
                key={w.id}
                className="rounded-md border border-border/60 px-3 py-2"
              >
                <p className="text-sm font-medium">{w.message}</p>
                <p className="text-xs text-muted-foreground">{w.fixHint}</p>
                {w.code === "incomplete_handoff" ? (
                  <Link
                    to="/admin/production-planning"
                    search={{ mode: "handoff", weekStart: undefined }}
                    className="text-xs underline-offset-2 hover:underline"
                  >
                    Abrir Handoff
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className={cn(
              "rounded-md border border-border/60 px-3 py-3",
              c.urgent && c.status !== "completed" && "border-foreground/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {c.dishLabel}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {c.quantity}
                    {c.quantityEstimated ? "*" : ""} uds · {c.batchKey}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Deadline {c.cookingDeadline} · prep {c.prepStatusSummary}
                </p>
                <p className="text-xs text-muted-foreground">
                  Alérgenos: {c.allergenHint ?? "—"} · Dietario:{" "}
                  {c.dietaryHint ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cliente / pedido / instrucción:{" "}
                  {c.customerLabel ||
                  c.orderRef ||
                  c.specialInstruction
                    ? [
                        c.customerLabel,
                        c.orderRef,
                        c.specialInstruction,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "no disponible en este substrate"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusChip tone={statusTone(c.status)} label={kitchenWorkStatusLabel(c.status)} />
                {c.urgent ? (
                  <StatusChip tone="warning" label="Urgente" />
                ) : null}
                <StatusChip
                  tone={c.priority === "high" ? "warning" : "info"}
                  label={c.priority}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
              >
                {openId === c.id ? "Cerrar detalle" : "Abrir trabajo"}
              </button>
              <button
                type="button"
                className="text-xs underline-offset-2 hover:underline"
                onClick={() => setOpenId(c.id)}
              >
                Ver instrucciones
              </button>
              <button
                type="button"
                disabled={!canWrite}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                onClick={() => mark(c, "in_progress")}
              >
                Marcar en curso
              </button>
              <button
                type="button"
                disabled={!canWrite}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                onClick={() => mark(c, "completed")}
              >
                Marcar completado
              </button>
              <button
                type="button"
                disabled={!canWrite}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                onClick={() => mark(c, "blocked")}
              >
                Marcar bloqueado
              </button>
              <button
                type="button"
                disabled={!canWrite}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                onClick={() => mark(c, "ready")}
              >
                Volver a listo
              </button>
            </div>
            {open?.id === c.id ? (
              <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                <p>
                  <span className="font-medium">Qué:</span> {c.dishLabel}
                </p>
                <p>
                  <span className="font-medium">Cuánto:</span> {c.quantity}
                  {c.quantityEstimated ? "*" : ""} · batch {c.batchKey}
                </p>
                <p>
                  <span className="font-medium">Cuándo:</span>{" "}
                  {c.cookingDeadline}
                </p>
                <p>
                  <span className="font-medium">Preps:</span> {c.requiredPreps}
                </p>
                <p>
                  <span className="font-medium">Notas:</span>{" "}
                  {c.operationalNotes}
                </p>
                <p className="text-muted-foreground">
                  Semana {c.weekStart} · estados de sesión (no Capability Start)
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ningún ítem en este filtro. Cambia el filtro o el día.
        </p>
      ) : null}
    </section>
  );
}
