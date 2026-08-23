/**
 * ME001 — Zero Friction Weekly Menu Planning panel (Experience only).
 *
 * Reuse before creation. Duplicate → adapt → preview → publish.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import { DishLibraryPicker } from "@/menu-experience/DishLibraryPicker";
import type { DishLibraryItem } from "@/menu-experience/dish-library";
import { MenuPublishPreviewPanel } from "@/menu-experience/MenuPublishPreviewPanel";
import type { ReadinessIssue } from "@/menu-experience/week-readiness";
import { CONVERSATION_DISHES } from "@/order-experience/conversation-catalog";
import {
  activeSlots,
  createEmptyWeek,
  dayLabel,
  duplicateSlot,
  duplicateWeekPlan,
  formatWeekLabel,
  getWeekPlan,
  listWeekPlans,
  markPreview,
  markPublished,
  mondayIso,
  nextWeekStart,
  prevWeekStart,
  removeSlot,
  saveWeekPlan,
  setSlotDisabled,
  slotsByDay,
  upsertSlot,
  weekDates,
  type WeekPlan,
  type WeekDishSlot,
} from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

export type DurableMenuSeed = {
  id: string;
  weekStart: string;
  status: string;
  slots: Array<{
    dayDate: string;
    dishId: string;
    dishLabel: string;
    macrosHint?: string | null;
    allergenHint?: string | null;
  }>;
};

export type DishPick = {
  id: string;
  label: string;
  macrosHint?: string | null;
  allergenHint?: string | null;
  durable: boolean;
};

type Step = "plan" | "preview" | "done";

type Props = {
  canWrite: boolean;
  durableMenus: DurableMenuSeed[];
  dishPicks: DishPick[];
  libraryItems?: DishLibraryItem[];
  /** Open a specific week (from ME002 search). */
  focusWeekStart?: string | null;
  /** Jump to preview when opening from search. */
  startInPreview?: boolean;
  onPublishDurable?: (plan: WeekPlan) => Promise<{
    ok: boolean;
    menuId?: string | null;
    message?: string;
  }>;
};

function seedToPlan(seed: DurableMenuSeed): WeekPlan {
  const now = new Date().toISOString();
  return {
    id: `seed_${seed.id}`,
    weekStart: seed.weekStart,
    status: seed.status === "published" ? "published_durable" : "draft",
    sourceMenuId: seed.id,
    durableMenuId: seed.id,
    slots: seed.slots.map((s, i) => ({
      id: `seed_slot_${seed.id}_${i}`,
      dayDate: s.dayDate,
      dishId: s.dishId,
      dishLabel: s.dishLabel,
      disabled: false,
      macrosHint: s.macrosHint ?? null,
      allergenHint: s.allergenHint ?? null,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function MenuPlanningPanel({
  canWrite,
  durableMenus,
  dishPicks,
  libraryItems = [],
  focusWeekStart = null,
  startInPreview = false,
  onPublishDurable,
}: Props) {
  const [weekStart, setWeekStart] = useState(() => focusWeekStart ?? mondayIso());
  const [step, setStep] = useState<Step>(startInPreview ? "preview" : "plan");
  const [tick, setTick] = useState(0);
  const [pickDay, setPickDay] = useState<string | null>(null);
  const [replaceSlotId, setReplaceSlotId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!focusWeekStart) return;
    setWeekStart(focusWeekStart);
    setStep(startInPreview ? "preview" : "plan");
  }, [focusWeekStart, startInPreview]);

  const picks = useMemo(() => {
    if (dishPicks.length > 0) return dishPicks;
    return CONVERSATION_DISHES.map((d) => ({
      id: d.id,
      label: d.label,
      durable: false,
      macrosHint: null,
      allergenHint: null,
    }));
  }, [dishPicks]);

  const library = useMemo(() => {
    if (libraryItems.length > 0) return libraryItems;
    return picks.map((p) => ({
      id: p.id,
      label: p.label,
      durable: p.durable,
      macrosHint: p.macrosHint ?? null,
      allergenHint: p.allergenHint ?? null,
      categoryHint: null,
      description: null,
      tags: [] as string[],
      availability: "available" as const,
      macrosComplete: "unknown" as const,
      allergenComplete: "unknown" as const,
      useCount: 0,
      lastUsedAt: null,
    }));
  }, [libraryItems, picks]);

  const plan = useMemo(() => {
    void tick;
    return getWeekPlan(weekStart);
  }, [weekStart, tick]);

  const byDay = plan ? slotsByDay(plan) : null;
  const days = weekDates(weekStart);

  const previousCandidates = useMemo(() => {
    void tick;
    const session = listWeekPlans().filter((p) => p.weekStart < weekStart);
    const durable = durableMenus.filter((m) => m.weekStart < weekStart).map(seedToPlan);
    const map = new Map<string, WeekPlan>();
    for (const p of [...durable, ...session]) map.set(p.weekStart, p);
    return [...map.values()].sort((a, b) => Date.parse(b.weekStart) - Date.parse(a.weekStart));
  }, [weekStart, durableMenus, tick]);

  function refresh() {
    setTick((n) => n + 1);
  }

  function ensurePlan(): WeekPlan {
    const existing = getWeekPlan(weekStart);
    if (existing) return existing;
    const created = createEmptyWeek(weekStart);
    refresh();
    return created;
  }

  function onCreateFirst() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    ensurePlan();
    toast.success("Semana creada — añade platos o duplica otra semana");
    setStep("plan");
  }

  function onDuplicate(source: WeekPlan) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    duplicateWeekPlan({
      source,
      targetWeekStart: weekStart,
      sourceMenuId: source.durableMenuId ?? source.sourceMenuId,
    });
    refresh();
    setStep("plan");
    toast.success("Semana duplicada — edita solo los cambios");
  }

  function onAddDish(dayDate: string, dish: DishPick) {
    if (!canWrite) return;
    ensurePlan();
    upsertSlot(weekStart, {
      dayDate,
      dishId: dish.id,
      dishLabel: dish.label,
      disabled: false,
      macrosHint: dish.macrosHint,
      allergenHint: dish.allergenHint,
    });
    refresh();
    setPickDay(null);
    toast.success(`${dish.label} · ${dayLabel(dayDate)}`);
  }

  function onReplace(slot: WeekDishSlot, dish: DishPick) {
    if (!canWrite) return;
    upsertSlot(weekStart, {
      id: slot.id,
      dayDate: slot.dayDate,
      dishId: dish.id,
      dishLabel: dish.label,
      disabled: false,
      macrosHint: dish.macrosHint,
      allergenHint: dish.allergenHint,
    });
    refresh();
    toast.success("Plato reemplazado");
  }

  function onDisable(slot: WeekDishSlot) {
    if (!canWrite) return;
    setSlotDisabled(weekStart, slot.id, !slot.disabled);
    refresh();
  }

  function onRemove(slot: WeekDishSlot) {
    if (!canWrite) return;
    removeSlot(weekStart, slot.id);
    refresh();
  }

  function onPreview() {
    const p = getWeekPlan(weekStart);
    if (!p || activeSlots(p).length === 0) {
      toast.error("Añade al menos un plato activo");
      return;
    }
    markPreview(weekStart);
    refresh();
    setStep("preview");
  }

  async function onPublish() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const p = getWeekPlan(weekStart);
    if (!p || activeSlots(p).length === 0) {
      toast.error("Nada que publicar");
      return;
    }

    setPublishing(true);
    try {
      const durableIds = activeSlots(p).every((s) => !s.dishId.startsWith("exp:"));
      if (durableIds && onPublishDurable) {
        const result = await onPublishDurable(p);
        if (result.ok) {
          markPublished(weekStart, "published_durable", result.menuId);
          refresh();
          setStep("done");
          toast.success("Semana publicada · lista para Orders y Production");
          return;
        }
        toast.message(result.message ?? "Publicación durable no disponible");
      }

      markPublished(weekStart, "published_session");
      refresh();
      setStep("done");
      toast.success("Semana lista (sesión · Orders/Production con honestidad)");
    } finally {
      setPublishing(false);
    }
  }

  function onFixFromPreview(issue: ReadinessIssue) {
    setStep("plan");
    if (issue.dayDate) {
      setPickDay(issue.dayDate);
      if (issue.slotId) setReplaceSlotId(issue.slotId);
    }
  }

  function onDuplicateDay(dayDate: string) {
    if (!canWrite || !plan) return;
    const first = (byDay?.[dayDate] ?? []).find((s) => !s.disabled);
    if (!first) {
      toast.error("Nada que duplicar en este día");
      return;
    }
    duplicateSlot(weekStart, first.id, dayDate);
    refresh();
    toast.success(`Día duplicado · ${dayLabel(dayDate)}`);
  }

  function onReplaceFromPreview(dayDate: string, slotId: string) {
    setStep("plan");
    setPickDay(dayDate);
    setReplaceSlotId(slotId);
  }

  function importDurableSeed() {
    const seed = durableMenus.find((m) => m.weekStart === weekStart);
    if (!seed) {
      toast.error("No hay menú durable para esta semana");
      return;
    }
    if (!canWrite) return;
    saveWeekPlan({ ...seedToPlan(seed), status: "draft" });
    refresh();
    toast.success("Semana abierta desde menú durable");
  }

  if (step === "done" && plan) {
    return (
      <section className="space-y-4" aria-labelledby="me-done" aria-live="polite">
        <h2 id="me-done" className="text-sm font-semibold tracking-wide">
          Semana lista
        </h2>
        <p className="text-lg font-medium">{formatWeekLabel(plan.weekStart)}</p>
        <p className="text-sm text-muted-foreground">
          {activeSlots(plan).length} platos activos ·{" "}
          {plan.status === "published_durable" ? "Publicado (durable)" : "Publicado en sesión"}
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusChip
            tone={plan.status === "published_durable" ? "positive" : "warning"}
            label={
              plan.status === "published_durable"
                ? "Listo para Orders"
                : "Sesión · Facade pendiente"
            }
          />
          <StatusChip tone="positive" label="Listo para Production" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">¿Qué quieres hacer ahora?</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => {
                setWeekStart(nextWeekStart(weekStart));
                setStep("plan");
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Preparar siguiente semana
            </button>
            <Link
              to="/admin/production-planning"
              search={{ mode: "planning", weekStart: plan.weekStart }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Ir a Production
            </Link>
            <Link
              to="/admin/order-capture"
              search={{
                mode: "search",
                customerId: undefined,
                kind: undefined,
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Ir a Orders
            </Link>
            <Link
              to="/admin/menus"
              search={{ weekStart: undefined }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Menús (bootstrap)
            </Link>
            <button
              type="button"
              onClick={() => setStep("preview")}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Revisar de nuevo
            </button>
            <button
              type="button"
              onClick={() => setStep("plan")}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Seguir editando
            </button>
            <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
              Import / Bulk → Reserved
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (step === "preview" && plan) {
    return (
      <MenuPublishPreviewPanel
        plan={plan}
        canWrite={canWrite}
        publishing={publishing}
        onBack={() => setStep("plan")}
        onPublish={onPublish}
        onFixIssue={onFixFromPreview}
        onDuplicateDay={onDuplicateDay}
        onReplaceDish={onReplaceFromPreview}
      />
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="me-plan">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="me-plan" className="text-sm font-semibold tracking-wide">
            Planificación semanal
          </h2>
          <p className="text-xs text-muted-foreground">
            Empieza desde una semana conocida — nunca desde cero
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-10 rounded-md border border-border px-3 text-xs"
            onClick={() => {
              setWeekStart(prevWeekStart(weekStart));
              setStep("plan");
            }}
          >
            ← Semana
          </button>
          <span className="text-sm font-medium">{formatWeekLabel(weekStart)}</span>
          <button
            type="button"
            className="min-h-10 rounded-md border border-border px-3 text-xs"
            onClick={() => {
              setWeekStart(nextWeekStart(weekStart));
              setStep("plan");
            }}
          >
            Semana →
          </button>
        </div>
      </div>

      {!plan ? (
        <div className="space-y-3 rounded-md border border-dashed border-border px-4 py-5">
          <p className="text-sm font-medium">No hay menú semanal todavía.</p>
          <p className="text-xs text-muted-foreground">
            Crea la primera semana o duplica una anterior.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canWrite}
              onClick={onCreateFirst}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              Crear primera semana
            </button>
            {durableMenus.some((m) => m.weekStart === weekStart) ? (
              <button
                type="button"
                disabled={!canWrite}
                onClick={importDurableSeed}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
              >
                Abrir menú durable
              </button>
            ) : null}
            {previousCandidates[0] ? (
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => onDuplicate(previousCandidates[0]!)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm disabled:opacity-40"
              >
                Duplicar semana anterior
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {plan ? (
        <>
          <div className="flex flex-wrap gap-2">
            <StatusChip
              tone={
                plan.status.startsWith("published")
                  ? "positive"
                  : plan.status === "preview"
                    ? "info"
                    : "warning"
              }
              label={
                plan.status === "published_durable"
                  ? "Publicado"
                  : plan.status === "published_session"
                    ? "Sesión"
                    : plan.status === "preview"
                      ? "Vista previa"
                      : "Borrador"
              }
            />
            {plan.sourceWeekStart ? (
              <StatusChip tone="info" label={`Desde ${plan.sourceWeekStart}`} />
            ) : null}
            <StatusChip tone="info" label={`${activeSlots(plan).length} activos`} />
          </div>

          {previousCandidates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Duplicar desde</p>
              <div className="flex flex-wrap gap-2">
                {previousCandidates.slice(0, 4).map((src) => (
                  <button
                    key={src.weekStart}
                    type="button"
                    disabled={!canWrite}
                    onClick={() => onDuplicate(src)}
                    className="min-h-10 rounded-md border border-border px-3 text-xs disabled:opacity-40"
                  >
                    {src.weekStart}
                    {src.sourceMenuId || src.durableMenuId ? " · durable" : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="space-y-2 border-t border-border/50 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {dayLabel(day)} <span className="font-normal text-muted-foreground">{day}</span>
                  </p>
                  <button
                    type="button"
                    disabled={!canWrite}
                    onClick={() => setPickDay((d) => (d === day ? null : day))}
                    className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                  >
                    {pickDay === day ? "Cerrar" : "Añadir / reemplazar"}
                  </button>
                </div>
                <ul className="space-y-1">
                  {(byDay?.[day] ?? []).map((slot) => (
                    <li
                      key={slot.id}
                      className={cn(
                        "flex flex-wrap items-center gap-2 text-sm",
                        slot.disabled && "opacity-50 line-through",
                      )}
                    >
                      <span className="font-medium">{slot.dishLabel}</span>
                      {slot.macrosHint ? (
                        <span className="text-xs text-muted-foreground">{slot.macrosHint}</span>
                      ) : null}
                      {slot.allergenHint ? (
                        <span className="text-xs text-muted-foreground">· {slot.allergenHint}</span>
                      ) : null}
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onDisable(slot)}
                        className="text-xs underline-offset-2 hover:underline"
                      >
                        {slot.disabled ? "Activar" : "Desactivar"}
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onRemove(slot)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                  {(byDay?.[day] ?? []).length === 0 ? (
                    <li className="text-xs text-muted-foreground">Sin platos</li>
                  ) : null}
                </ul>
                {pickDay === day ? (
                  <DishLibraryPicker
                    items={library}
                    mode={replaceSlotId || (byDay?.[day] ?? []).length > 0 ? "replace" : "insert"}
                    canWrite={canWrite}
                    onPick={(dish) => {
                      const existing =
                        (byDay?.[day] ?? []).find((s) => s.id === replaceSlotId) ??
                        (byDay?.[day] ?? [])[0];
                      if (existing) onReplace(existing, dish);
                      else onAddDish(day, dish);
                      setPickDay(null);
                      setReplaceSlotId(null);
                    }}
                    onClose={() => {
                      setPickDay(null);
                      setReplaceSlotId(null);
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!canWrite}
              onClick={onPreview}
              className="min-h-12 flex-1 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              Revisar y Publicar
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => {
                onPreview();
              }}
              className="min-h-12 rounded-md border border-border px-4 text-sm disabled:opacity-40"
            >
              Vista previa
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
