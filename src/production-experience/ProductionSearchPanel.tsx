/**
 * PE002 — Zero Friction Production Search (Experience only).
 *
 * Find day · block · batch · prep · alert inside the operational week.
 * Never browse long lists. Never remember IDs.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatusChip } from "@/components/admin";
import {
  downloadProductionPlanCsv,
  printProductionPlan,
} from "@/production-experience/export-production-plan";
import {
  alertLabel,
  alertTone,
  buildProductionHits,
  hitGlance,
  rankProductionHits,
  type ProductionSearchHit,
  type ProductionSearchScope,
} from "@/production-experience/production-search-rank";
import {
  getProductionPlan,
  listProductionPlans,
} from "@/production-experience/production-plan";
import { dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ScopeFilter = "all" | ProductionSearchScope;
type AlertFilter = "all" | "alerts" | "overload" | "kitchen";

type Props = {
  canWrite: boolean;
  onOpenWork: (weekStart: string, dayDate?: string | null) => void;
  onOpenPlanning: () => void;
};

export function ProductionSearchPanel({
  canWrite,
  onOpenWork,
  onOpenPlanning,
}: Props) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const plans = useMemo(() => {
    void tick;
    return listProductionPlans();
  }, [tick]);

  const hits = useMemo(() => buildProductionHits(plans), [plans]);

  const ranked = useMemo(() => {
    let list = rankProductionHits(hits, query);
    if (scope !== "all") list = list.filter((h) => h.scope === scope);
    if (alertFilter === "alerts") {
      list = list.filter((h) => h.alertStatus === "warn" || h.alertStatus === "block");
    } else if (alertFilter === "overload") {
      list = list.filter((h) => h.overload);
    } else if (alertFilter === "kitchen") {
      list = list.filter((h) => h.kitchenReady);
    }
    return list.slice(0, 40);
  }, [hits, query, scope, alertFilter]);

  const contextHit = ranked[0] ?? null;

  function refresh() {
    setTick((n) => n + 1);
  }

  function onPrint(hit: ProductionSearchHit) {
    const plan = getProductionPlan(hit.weekStart);
    if (!plan) {
      toast.error("Plan no encontrado");
      return;
    }
    printProductionPlan(plan);
  }

  function onExport(hit: ProductionSearchHit) {
    const plan = getProductionPlan(hit.weekStart);
    if (!plan) {
      toast.error("Plan no encontrado");
      return;
    }
    downloadProductionPlanCsv(plan);
    toast.success("CSV descargado");
  }

  if (plans.length === 0) {
    return (
      <section className="space-y-4" aria-labelledby="pe-search-empty">
        <h2 id="pe-search-empty" className="text-sm font-semibold tracking-wide">
          Buscar trabajo de producción
        </h2>
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay planes de producción todavía.
          </p>
          <p className="text-xs text-muted-foreground">
            Genera un plan desde una semana publicada. La búsqueda opera sobre
            trabajo ejecutable, no sobre Orders.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onOpenPlanning}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Abrir Production Planning
            </button>
            <Link
              to="/admin/menu-planning"
              search={{ mode: "publish", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Abrir Menu Planning
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="pe-search">
      <div>
        <h2 id="pe-search" className="text-sm font-semibold tracking-wide">
          Buscar trabajo de producción
        </h2>
        <p className="text-xs text-muted-foreground">
          Día · carga · lote · alerta · prep — sin IDs
        </p>
      </div>

      {contextHit ? (
        <div className="flex flex-wrap gap-2">
          <StatusChip
            tone="info"
            label={`Semana ${contextHit.weekStart}`}
          />
          {contextHit.dayDate ? (
            <StatusChip
              tone="info"
              label={`${dayLabel(contextHit.dayDate)} · ${contextHit.dayDate}`}
            />
          ) : null}
          <StatusChip
            tone={contextHit.overload ? "warning" : "info"}
            label={contextHit.loadLabel}
          />
          {contextHit.deadline ? (
            <StatusChip tone="info" label={`Deadline ${contextHit.deadline}`} />
          ) : null}
          <StatusChip
            tone={alertTone(contextHit.alertStatus)}
            label={alertLabel(contextHit.alertStatus)}
          />
          <StatusChip
            tone={contextHit.kitchenReady ? "positive" : "warning"}
            label={
              contextHit.kitchenReady
                ? "Kitchen ready"
                : "Kitchen pendiente"
            }
          />
        </div>
      ) : null}

      <label className="block">
        <span className="sr-only">Buscar producción</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="lun · poke · sobrecarga · descongelar · alerta…"
          className="min-h-12 w-full rounded-md border border-border bg-background px-3 text-sm"
          autoComplete="off"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todo"],
            ["day", "Día"],
            ["work", "Trabajo"],
            ["batch", "Lote"],
            ["prep", "Prep"],
            ["alert", "Alerta"],
            ["week", "Semana"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setScope(id)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              scope === id
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Cualquiera"],
            ["alerts", "Con avisos"],
            ["overload", "Carga alta"],
            ["kitchen", "Listo Kitchen"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAlertFilter(id)}
            className={cn(
              "rounded-md border px-2 py-1 text-xs",
              alertFilter === id
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
          onClick={refresh}
        >
          Actualizar
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">
            No hay trabajo de producción que coincida.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onOpenPlanning}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Abrir Production Planning
            </button>
            <Link
              to="/admin/menu-planning"
              search={{ mode: "publish", weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Abrir Menu Planning
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {ranked.map((hit) => (
            <li
              key={hit.id}
              className="rounded-md border border-border/60 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{hit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {hitGlance(hit)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hit.workSummary}
                    {hit.quantity > 0 ? ` · ${hit.quantity} uds` : ""}
                    {hit.prepCount > 0 ? ` · ${hit.prepCount} prep` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip tone="info" label={hit.scope} />
                  <StatusChip
                    tone={hit.overload ? "warning" : "info"}
                    label={hit.loadLabel}
                  />
                  <StatusChip
                    tone={alertTone(hit.alertStatus)}
                    label={alertLabel(hit.alertStatus)}
                  />
                  {hit.kitchenReady ? (
                    <StatusChip tone="positive" label="Kitchen" />
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenWork(hit.weekStart, hit.dayDate)}
                  className="text-xs underline-offset-2 hover:underline"
                >
                  Abrir trabajo
                </button>
                {(hit.alertStatus === "warn" || hit.alertStatus === "block") && (
                  <button
                    type="button"
                    onClick={() => {
                      setScope("alert");
                      setQuery(hit.dayDate ? dayLabel(hit.dayDate) : hit.weekStart);
                      setAlertFilter("alerts");
                    }}
                    className="text-xs underline-offset-2 hover:underline"
                  >
                    Revisar alertas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenWork(hit.weekStart, hit.dayDate)}
                  className="text-xs underline-offset-2 hover:underline"
                >
                  Handoff Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => onPrint(hit)}
                  className="text-xs underline-offset-2 hover:underline"
                >
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => onExport(hit)}
                  className="text-xs underline-offset-2 hover:underline"
                >
                  Exportar
                </button>
                <span className="text-xs text-muted-foreground">
                  Regenerar → Future
                </span>
                {!canWrite ? (
                  <span className="text-xs text-muted-foreground">Solo lectura</span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatWeekLabel(hit.weekStart)}
                {hit.deadline ? ` · deadline ${hit.deadline}` : ""}
                {` · ${hit.planStatus}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
