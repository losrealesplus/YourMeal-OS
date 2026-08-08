/**
 * KE002 — Zero Friction Kitchen Execution Search (Experience only).
 *
 * Find execution work without leaving execution context.
 * Never search Orders / Menus / Production planning.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import {
  downloadKitchenWorkCsv,
  printKitchenWork,
} from "@/kitchen-experience/export-kitchen-work";
import {
  buildAdaptedTodaysKitchenWork,
  effectiveExecutionQuantity,
} from "@/kitchen-experience/adapt-execution";
import {
  rememberKitchenWorkAccess,
  searchExecutionWork,
  type KitchenSearchHit,
} from "@/kitchen-experience/execution-search-rank";
import {
  kitchenWorkStatusLabel,
  listHandedOffPlans,
} from "@/kitchen-experience/today-work";
import { utcDateOnly } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  dayDate?: string | null;
  onOpenWork: (dayDate: string, workId: string) => void;
  onBackToToday: () => void;
};

function statusTone(
  s: KitchenSearchHit["status"],
): "positive" | "warning" | "info" | "neutral" {
  if (s === "completed") return "positive";
  if (s === "blocked") return "warning";
  if (s === "in_progress") return "info";
  return "neutral";
}

export function KitchenSearchPanel({
  dayDate: focusDay,
  onOpenWork,
  onBackToToday,
}: Props) {
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = focusDay ?? utcDateOnly();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handedOff = useMemo(() => {
    void tick;
    return listHandedOffPlans();
  }, [tick]);

  const ranked = useMemo(() => {
    void tick;
    return searchExecutionWork(query, today).slice(0, 40);
  }, [query, today, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function openHit(hit: KitchenSearchHit) {
    rememberKitchenWorkAccess(hit.id);
    onOpenWork(hit.productionDay, hit.id);
    refresh();
  }

  if (handedOff.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="ke-search-empty">
        <h2 id="ke-search-empty" className="text-sm font-semibold tracking-wide">
          Buscar trabajo de ejecución
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay trabajo transferido a Kitchen.</p>
          <p className="text-xs text-muted-foreground">
            La búsqueda opera sobre handoffs Ready for Kitchen — no sobre Orders
            ni planificación.
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

  return (
    <section className="space-y-5" aria-labelledby="ke-search">
      <div>
        <h2 id="ke-search" className="text-sm font-semibold tracking-wide">
          Buscar trabajo de ejecución
        </h2>
        <p className="text-xs text-muted-foreground">
          Plato · batch · deadline · estado · prep · día — sin salir de ejecución
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Buscar trabajo</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe plato, batch, estado, prep…"
          className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          autoComplete="off"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <StatusChip tone="info" label={`Hoy ${today}`} />
        <StatusChip
          tone="positive"
          label={`${ranked.length} resultado(s)`}
        />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={onBackToToday}
        >
          Volver a Today's Work
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            const view = buildAdaptedTodaysKitchenWork(today);
            printKitchenWork(view);
          }}
        >
          Imprimir hoy
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => {
            const view = buildAdaptedTodaysKitchenWork(today);
            downloadKitchenWorkCsv(view);
            toast.success("CSV de hoy descargado");
          }}
        >
          Exportar hoy
        </button>
        <span className="text-xs text-muted-foreground">
          Start / Pause / Assign → Future
        </span>
      </div>

      {ranked.length === 0 ? (
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay trabajo de ejecución que coincida.
          </p>
          <p className="text-xs text-muted-foreground">
            Prueba otro término o vuelve a la cola de hoy. No buscamos pedidos ni
            menús aquí.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackToToday}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Volver a Today's Work
            </button>
            <Link
              to="/admin/production-planning"
              search={{ mode: "handoff", weekStart: undefined }}
              className="text-xs underline-offset-2 hover:underline"
            >
              Revisar Production Handoff
            </Link>
            <Link
              to="/admin/production-planning"
              search={{ mode: "planning", weekStart: undefined }}
              className="text-xs underline-offset-2 hover:underline"
            >
              Revisar Production
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {ranked.map((hit) => (
            <li
              key={hit.id}
              className={cn(
                "rounded-md border border-border/60 px-3 py-3",
                hit.productionDay === today && "border-foreground/30",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {hit.dishLabel}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {effectiveExecutionQuantity(hit)}
                      {hit.quantityEstimated ? "*" : ""} · {hit.batchKey}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hit.dayLabel} · {hit.productionDay} · deadline{" "}
                    {hit.cookingDeadline}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prep: {hit.requiredPreps} · {hit.prepStatusSummary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Alérgenos: {hit.allergenHint ?? "—"} · Dietario:{" "}
                    {hit.dietaryHint ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cliente / pedido:{" "}
                    {hit.customerLabel || hit.orderRef
                      ? [hit.customerLabel, hit.orderRef]
                          .filter(Boolean)
                          .join(" · ")
                      : "no disponible en este substrate"}
                  </p>
                  {hit.matchHints.length > 0 ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Coincide: {hit.matchHints.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip
                    tone={statusTone(hit.status)}
                    label={kitchenWorkStatusLabel(hit.status)}
                  />
                  {hit.urgent ? (
                    <StatusChip tone="warning" label="Urgente" />
                  ) : null}
                  {hit.productionDay === today ? (
                    <StatusChip tone="info" label="Hoy" />
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => openHit(hit)}
                >
                  Abrir trabajo
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={() => {
                    rememberKitchenWorkAccess(hit.id);
                    setOpenId(openId === hit.id ? null : hit.id);
                  }}
                >
                  Ver instrucciones
                </button>
                <button
                  type="button"
                  className="text-xs underline-offset-2 hover:underline"
                  onClick={onBackToToday}
                >
                  Volver a Today's Work
                </button>
              </div>
              {openId === hit.id ? (
                <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs">
                  <p>
                    <span className="font-medium">Notas:</span>{" "}
                    {hit.operationalNotes}
                  </p>
                  <p>
                    <span className="font-medium">Instrucción especial:</span>{" "}
                    {hit.specialInstruction ?? "no disponible"}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
