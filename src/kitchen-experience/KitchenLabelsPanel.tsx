/**
 * KE004 — Zero Friction Kitchen Labels & Special Information (Experience only).
 *
 * Identify work + consume special info for correct prep / labeling.
 * Never create Customer / Order data. Never invent substrate.
 * Physical label generation → Future.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  downloadLabelContextsCsv,
  printLabelContexts,
} from "@/kitchen-experience/export-label-context";
import {
  printKitchenWork,
  downloadKitchenWorkCsv,
} from "@/kitchen-experience/export-kitchen-work";
import { buildAdaptedTodaysKitchenWork } from "@/kitchen-experience/adapt-execution";
import {
  LABEL_ABSENT_COPY,
  LABEL_NO_SPECIAL_COPY,
  buildLabelContext,
  labelFieldDisplay,
  listLabelContexts,
  sortedSpecial,
  type KitchenLabelContext,
  type LabelFieldSeverity,
} from "@/kitchen-experience/label-context";
import { listHandedOffPlans } from "@/kitchen-experience/today-work";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  focusWorkId?: string | null;
  onBackToToday: () => void;
};

function severityTone(
  s: LabelFieldSeverity,
): "positive" | "warning" | "info" | "neutral" {
  if (s === "critical") return "warning";
  if (s === "important") return "info";
  return "neutral";
}

function LabelContextDetail({ ctx }: { ctx: KitchenLabelContext }) {
  const special = sortedSpecial(ctx.special);

  return (
    <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
      <div>
        <h3 className="text-xs font-semibold tracking-wide">
          Contexto de etiqueta
        </h3>
        <dl className="mt-2 space-y-1.5">
          {ctx.identity.map((f) => (
            <div
              key={f.id}
              className={cn(
                "grid grid-cols-[7rem_1fr] gap-2 text-xs",
                f.severity === "critical" && "font-semibold",
                f.severity === "important" &&
                  f.availability !== "absent" &&
                  "font-medium",
                f.availability === "absent" && "text-muted-foreground",
              )}
            >
              <dt>{f.label}</dt>
              <dd>
                {labelFieldDisplay(f)}
                {f.availability === "absent" ? (
                  <span className="sr-only"> · hueco de substrate</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wide">
          Información especial
        </h3>
        {special.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {LABEL_NO_SPECIAL_COPY}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {special.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-xs",
                  s.severity === "critical" &&
                    "border-foreground/50 font-semibold",
                  s.severity === "important" && "border-foreground/30 font-medium",
                  s.severity === "normal" && "border-border/60",
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{s.title}</span>
                  <StatusChip
                    tone={severityTone(s.severity)}
                    label={
                      s.severity === "critical"
                        ? "Crítico"
                        : s.severity === "important"
                          ? "Importante"
                          : "Normal"
                    }
                  />
                  {s.source === "session" ? (
                    <StatusChip tone="info" label="Sesión" />
                  ) : null}
                </div>
                <p className="mt-1">{s.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Kitchen consume información · no crea Customer/Order · generación física
        de etiquetas → Future
      </p>
    </div>
  );
}

export function KitchenLabelsPanel({
  dayDate: focusDay,
  focusWorkId = null,
  onBackToToday,
}: Props) {
  const [tick, setTick] = useState(0);
  const [dayDate, setDayDate] = useState(focusDay ?? utcDateOnly());
  const [openId, setOpenId] = useState<string | null>(focusWorkId);
  const [filter, setFilter] = useState<"all" | "special" | "critical">("all");

  const handedOff = useMemo(() => {
    void tick;
    return listHandedOffPlans();
  }, [tick]);

  const view = useMemo(() => {
    void tick;
    return buildAdaptedTodaysKitchenWork(dayDate);
  }, [dayDate, tick]);

  const contexts = useMemo(() => {
    void tick;
    return listLabelContexts(dayDate, dayDate);
  }, [dayDate, tick]);

  const filtered = useMemo(() => {
    if (filter === "critical") return contexts.filter((c) => c.hasCritical);
    if (filter === "special") return contexts.filter((c) => c.hasAnySpecial);
    return contexts;
  }, [contexts, filter]);

  useEffect(() => {
    if (focusWorkId) setOpenId(focusWorkId);
  }, [focusWorkId]);

  useEffect(() => {
    if (focusDay) setDayDate(focusDay);
  }, [focusDay]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function printOne(ctx: KitchenLabelContext) {
    printLabelContexts([ctx], dayDate, view.dayLabel);
  }

  function printAll() {
    const list = filtered.length ? filtered : contexts;
    printLabelContexts(list, dayDate, view.dayLabel);
  }

  if (handedOff.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="ke-labels-empty">
        <h2 id="ke-labels-empty" className="text-sm font-semibold tracking-wide">
          Etiquetas e información especial
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay trabajo transferido para identificar.
          </p>
          <p className="text-xs text-muted-foreground">
            El contexto de etiqueta se lee del handoff — Kitchen no crea
            Customer ni Order.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a Today's Work
            </button>
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Revisar Production Handoff
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (view.emptyReason) {
    return (
      <section className="space-y-4" aria-labelledby="ke-labels-day-empty">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="ke-labels-day-empty"
              className="text-sm font-semibold tracking-wide"
            >
              Etiquetas e información especial
            </h2>
            <p className="text-xs text-muted-foreground">
              Sin trabajo este día
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
          <p className="text-sm font-medium">{view.emptyReason}</p>
          <button
            type="button"
            onClick={onBackToToday}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Volver a Today's Work
          </button>
        </div>
      </section>
    );
  }

  const criticalCount = contexts.filter((c) => c.hasCritical).length;
  const specialCount = contexts.filter((c) => c.hasAnySpecial).length;

  return (
    <section className="space-y-5" aria-labelledby="ke-labels">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ke-labels" className="text-sm font-semibold tracking-wide">
            Etiquetas e información especial
          </h2>
          <p className="text-xs text-muted-foreground">
            Qué · cuánto · para quién · qué importa — sin inventar substrate
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
        <StatusChip tone="warning" label="TILC < 10 s" />
        <StatusChip tone="info" label="Special info < 5 s" />
        <StatusChip
          tone={criticalCount ? "warning" : "positive"}
          label={
            criticalCount
              ? `${criticalCount} crítico(s)`
              : "Sin críticos"
          }
        />
        <StatusChip
          tone="info"
          label={`${specialCount}/${contexts.length} con info especial`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["special", "Con especial"],
            ["critical", "Críticos"],
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
          onClick={printAll}
        >
          Imprimir contexto
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            printKitchenWork(view);
          }}
        >
          Imprimir cola
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadLabelContextsCsv(contexts, dayDate);
            toast.success("CSV de etiquetas descargado");
            refresh();
          }}
        >
          Exportar
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            downloadKitchenWorkCsv(view);
            toast.success("CSV de cola descargado");
          }}
        >
          Exportar cola
        </button>
        <span className="text-xs text-muted-foreground">
          Etiquetas físicas → Future
        </span>
      </div>

      <ul className="space-y-3">
        {filtered.map((ctx) => {
          const open = openId === ctx.workId;
          return (
            <li
              key={ctx.workId}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                ctx.hasCritical && "border-foreground/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {ctx.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {ctx.executionQuantity}
                      {ctx.quantityEstimated ? "*" : ""} uds · {ctx.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline {ctx.cookingDeadline} · Cliente:{" "}
                    {labelFieldDisplay(
                      ctx.identity.find((f) => f.id === "customer")!,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ctx.hasAnySpecial
                      ? `${ctx.special.length} especial(es)`
                      : LABEL_NO_SPECIAL_COPY}
                    {ctx.hasCritical ? " · incluye crítico" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ctx.hasCritical ? (
                    <StatusChip tone="warning" label="Crítico" />
                  ) : ctx.hasImportant ? (
                    <StatusChip tone="info" label="Importante" />
                  ) : (
                    <StatusChip tone="neutral" label="Normal" />
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => setOpenId(open ? null : ctx.workId)}
                >
                  {open ? "Cerrar contexto" : "Ver contexto de etiqueta"}
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => printOne(ctx)}
                >
                  Imprimir etiqueta (info)
                </button>
              </div>
              {open ? <LabelContextDetail ctx={ctx} /> : null}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <div className="space-y-2 rounded-md border border-dashed border-border px-4 py-4">
          <p className="text-sm font-medium">
            Ningún ítem en este filtro.
          </p>
          <p className="text-xs text-muted-foreground">
            {filter === "critical"
              ? "No hay información crítica registrada — no inventamos avisos."
              : filter === "special"
                ? LABEL_NO_SPECIAL_COPY
                : LABEL_ABSENT_COPY}
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-xs underline-offset-2 hover:underline"
          >
            Ver todos
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** Re-export for tests / deep links */
export { buildLabelContext };
