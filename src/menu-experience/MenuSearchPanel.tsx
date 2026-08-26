/**
 * ME002 — Zero Friction Menu Search panel (Experience only).
 *
 * Find any planning element: week · day · dish · status.
 * Temporal hierarchy — not a dish catalog browser.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { StatusChip } from "@/components/admin";
import type { DurableMenuSeed } from "@/menu-experience/MenuPlanningPanel";
import {
  allergenLabel,
  hitGlance,
  macroLabel,
  publicationLabel,
  publicationTone,
  rankMenuHits,
  type MenuSearchHit,
} from "@/menu-experience/menu-search-rank";
import {
  dayLabel,
  formatWeekLabel,
  listWeekPlans,
  mondayIso,
  type WeekPlan,
} from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type DayFilter = "all" | "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
type PubFilter = "all" | "published" | "draft" | "session";

type Props = {
  durableMenus: DurableMenuSeed[];
  canWrite: boolean;
  onOpenWeek: (weekStart: string) => void;
  onAdaptWeek: (weekStart: string) => void;
  onDuplicateWeek: (weekStart: string) => void;
  onPreviewWeek: (weekStart: string) => void;
  onCreateWeek: () => void;
};

function completeness(
  slots: Array<{ allergenHint?: string | null; macrosHint?: string | null }>,
): { allergen: MenuSearchHit["allergenStatus"]; macro: MenuSearchHit["macroStatus"] } {
  if (slots.length === 0) return { allergen: "unknown", macro: "unknown" };
  const a = slots.filter((s) => s.allergenHint?.trim()).length;
  const m = slots.filter((s) => s.macrosHint?.trim()).length;
  return {
    allergen: a === 0 ? "unknown" : a === slots.length ? "known" : "partial",
    macro: m === 0 ? "unknown" : m === slots.length ? "known" : "partial",
  };
}

function planPublication(
  status: WeekPlan["status"] | string,
): MenuSearchHit["publication"] {
  if (status === "published" || status === "published_durable") return "published";
  if (status === "published_session") return "session";
  if (status === "preview") return "preview";
  return "draft";
}

function dayFilterMatch(dayDate: string | null, filter: DayFilter): boolean {
  if (filter === "all" || !dayDate) return filter === "all";
  const label = dayLabel(dayDate).toLowerCase();
  const map: Record<DayFilter, string> = {
    all: "",
    lun: "lun",
    mar: "mar",
    mie: "mié",
    jue: "jue",
    vie: "vie",
    sab: "sáb",
    dom: "dom",
  };
  return label.startsWith(map[filter]);
}

function buildHits(
  durableMenus: DurableMenuSeed[],
  sessionPlans: WeekPlan[],
): MenuSearchHit[] {
  const hits: MenuSearchHit[] = [];

  for (const plan of sessionPlans) {
    const active = plan.slots.filter((s) => !s.disabled);
    const { allergen, macro } = completeness(active);
    const publication = planPublication(plan.status);
    hits.push({
      id: `week:session:${plan.weekStart}`,
      scope: "week",
      weekStart: plan.weekStart,
      dayDate: null,
      menuName: `Semana ${plan.weekStart}`,
      dishLabel: null,
      dishCount: active.length,
      status: plan.status,
      publication,
      allergenStatus: allergen,
      macroStatus: macro,
      source: "session",
      updatedAt: plan.updatedAt,
    });

    const byDay = new Map<string, typeof active>();
    for (const s of active) {
      const list = byDay.get(s.dayDate) ?? [];
      list.push(s);
      byDay.set(s.dayDate, list);
    }
    for (const [day, slots] of byDay) {
      const c = completeness(slots);
      hits.push({
        id: `day:session:${plan.weekStart}:${day}`,
        scope: "day",
        weekStart: plan.weekStart,
        dayDate: day,
        menuName: `Semana ${plan.weekStart}`,
        dishLabel: slots.map((s) => s.dishLabel).slice(0, 3).join(" · "),
        dishCount: slots.length,
        status: plan.status,
        publication,
        allergenStatus: c.allergen,
        macroStatus: c.macro,
        source: "session",
        updatedAt: plan.updatedAt,
      });
      for (const slot of slots) {
        hits.push({
          id: `dish:session:${slot.id}`,
          scope: "dish",
          weekStart: plan.weekStart,
          dayDate: slot.dayDate,
          menuName: `Semana ${plan.weekStart}`,
          dishLabel: slot.dishLabel,
          dishCount: 1,
          status: plan.status,
          publication,
          allergenStatus: slot.allergenHint ? "known" : "unknown",
          macroStatus: slot.macrosHint ? "known" : "unknown",
          source: "session",
          updatedAt: plan.updatedAt,
        });
      }
    }
  }

  for (const menu of durableMenus) {
    const { allergen, macro } = completeness(menu.slots);
    const publication = planPublication(menu.status);
    const status =
      menu.status === "published" ? "durable_published" : "durable_draft";
    const weekStartStr = menu.weekStart ?? "template";
    const menuName = menu.weekStart ? `Menú ${menu.weekStart}` : `Menú Plantilla`;
    hits.push({
      id: `week:durable:${menu.id}`,
      scope: "week",
      weekStart: weekStartStr,
      dayDate: null,
      menuName,
      dishLabel: null,
      dishCount: menu.slots.length,
      status,
      publication,
      allergenStatus: allergen,
      macroStatus: macro,
      source: "durable",
      updatedAt: null,
      recentBoost: menu.status === "published" ? 10 : 0,
    });

    const byDay = new Map<string, DurableMenuSeed["slots"]>();
    for (const s of menu.slots) {
      const dayKey = s.dayDate ?? "Day";
      const list = byDay.get(dayKey) ?? [];
      list.push(s);
      byDay.set(dayKey, list);
    }
    for (const [day, slots] of byDay) {
      const c = completeness(slots);
      hits.push({
        id: `day:durable:${menu.id}:${day}`,
        scope: "day",
        weekStart: weekStartStr,
        dayDate: day,
        menuName,
        dishLabel: slots.map((s) => s.dishLabel).slice(0, 3).join(" · "),
        dishCount: slots.length,
        status,
        publication,
        allergenStatus: c.allergen,
        macroStatus: c.macro,
        source: "durable",
        updatedAt: null,
      });
      for (const slot of slots) {
        hits.push({
          id: `dish:durable:${menu.id}:${slot.dayDate ?? day}:${slot.dishId}`,
          scope: "dish",
          weekStart: weekStartStr,
          dayDate: slot.dayDate ?? day,
          menuName,
          dishLabel: slot.dishLabel,
          dishCount: 1,
          status,
          publication,
          allergenStatus: slot.allergenHint ? "known" : "unknown",
          macroStatus: slot.macrosHint ? "known" : "unknown",
          source: "durable",
          updatedAt: null,
        });
      }
    }
  }

  return hits;
}

export function MenuSearchPanel({
  durableMenus,
  canWrite,
  onOpenWeek,
  onAdaptWeek,
  onDuplicateWeek,
  onPreviewWeek,
  onCreateWeek,
}: Props) {
  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [pubFilter, setPubFilter] = useState<PubFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const sessionPlans = useMemo(() => {
    void tick;
    return listWeekPlans();
  }, [tick]);

  const hits = useMemo(() => {
    const all = buildHits(durableMenus, sessionPlans);
    const filtered = all.filter((h) => {
      if (dayFilter !== "all" && !dayFilterMatch(h.dayDate, dayFilter)) {
        // week-level hits still pass when filtering by day? Prefer day/dish
        if (h.scope === "week") return false;
      }
      if (pubFilter !== "all" && h.publication !== pubFilter) {
        if (pubFilter === "draft" && h.publication === "preview") return true;
        return false;
      }
      return true;
    });
    return rankMenuHits(filtered, query).slice(0, 40);
  }, [durableMenus, sessionPlans, query, dayFilter, pubFilter]);

  const selected = hits.find((h) => h.id === selectedId) ?? hits[0] ?? null;
  const currentWeek = mondayIso();

  return (
    <section className="space-y-4" aria-labelledby="me-search">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="me-search" className="text-sm font-semibold tracking-wide">
            Buscar en la planificación
          </h2>
          <p className="text-xs text-muted-foreground">
            Semana → Día → Menú → Platos — nunca IDs
          </p>
        </div>
        <StatusChip tone="info" label={`Semana actual ${currentWeek}`} />
      </div>

      <label className="sr-only" htmlFor="me-search-input">
        Buscar semana, día o plato
      </label>
      <input
        id="me-search-input"
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Plato, día, semana, estado…"
        autoComplete="off"
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["lun", "Lun"],
            ["mar", "Mar"],
            ["mie", "Mié"],
            ["jue", "Jue"],
            ["vie", "Vie"],
            ["sab", "Sáb"],
            ["dom", "Dom"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDayFilter(key)}
            className={cn(
              "min-h-9 rounded-md border px-2.5 text-xs",
              dayFilter === key
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
            ["all", "Cualquier estado"],
            ["published", "Publicado"],
            ["draft", "Borrador"],
            ["session", "Sesión"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPubFilter(key)}
            className={cn(
              "min-h-9 rounded-md border px-2.5 text-xs",
              pubFilter === key
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="min-h-9 text-xs underline-offset-2 hover:underline"
          onClick={() => setTick((n) => n + 1)}
        >
          Actualizar
        </button>
      </div>

      {hits.length === 0 ? (
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay coincidencias en la planificación.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!canWrite}
              onClick={onCreateWeek}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              Crear menú / semana
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => onDuplicateWeek(currentWeek)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Duplicar semana anterior
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Bulk Edit → Reserved</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60" role="listbox">
          {hits.map((hit) => {
            const active = (selected?.id ?? null) === hit.id;
            return (
              <li key={hit.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelectedId(hit.id)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start gap-1 py-2.5 text-left hover:bg-muted/40",
                    active && "bg-muted/50",
                  )}
                >
                  <span className="font-medium">
                    {hit.scope === "dish"
                      ? hit.dishLabel
                      : hit.scope === "day"
                        ? `${dayLabel(hit.dayDate!)} · ${hit.weekStart}`
                        : formatWeekLabel(hit.weekStart)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {hitGlance(hit)} · {hit.dishCount} plato
                    {hit.dishCount === 1 ? "" : "s"} · {hit.menuName}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <StatusChip
                      tone={publicationTone(hit.publication)}
                      label={publicationLabel(hit.publication)}
                    />
                    <StatusChip tone="neutral" label={allergenLabel(hit.allergenStatus)} />
                    <StatusChip tone="neutral" label={macroLabel(hit.macroStatus)} />
                    <StatusChip
                      tone="info"
                      label={hit.source === "session" ? "Sesión" : "Durable"}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Contexto · {formatWeekLabel(selected.weekStart)}
            {selected.dayDate ? ` · ${dayLabel(selected.dayDate)}` : ""} ·{" "}
            {publicationLabel(selected.publication)}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => onOpenWeek(selected.weekStart)}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Abrir semana
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => onAdaptWeek(selected.weekStart)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Adaptar
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => onDuplicateWeek(selected.weekStart)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Duplicar
            </button>
            <button
              type="button"
              onClick={() => onPreviewWeek(selected.weekStart)}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Vista previa
            </button>
            <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
              Bulk → Reserved
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
