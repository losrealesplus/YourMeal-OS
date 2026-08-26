/**
 * ME003 — Zero Friction Weekly Adaptation panel (Experience only).
 *
 * Adapt living planning: replace · move · remove · add · duplicate · copy day.
 * Not menu CRUD.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin";
import { CONVERSATION_DISHES } from "@/order-experience/conversation-catalog";
import { DishLibraryPicker } from "@/menu-experience/DishLibraryPicker";
import type { DishLibraryItem } from "@/menu-experience/dish-library";
import type { DishPick, DurableMenuSeed } from "@/menu-experience/MenuPlanningPanel";
import {
  dayLabel,
  duplicateSlot,
  formatWeekLabel,
  getWeekPlan,
  markPreview,
  markPublished,
  mondayIso,
  moveSlot,
  removeSlot,
  replaceSlotDish,
  saveWeekPlan,
  slotsByDay,
  upsertSlot,
  weekDates,
  type WeekDishSlot,
  type WeekPlan,
} from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
  weekStart: string;
  durableMenus: DurableMenuSeed[];
  dishPicks: DishPick[];
  libraryItems: DishLibraryItem[];
  onPreview: () => void;
  onPublish: (plan: WeekPlan) => Promise<void>;
  onBackToSearch: () => void;
};

type Action = "replace" | "move" | "copy" | "add" | null;

function ensurePlanFromDurable(
  weekStart: string,
  durableMenus: DurableMenuSeed[],
): WeekPlan | null {
  const existing = getWeekPlan(weekStart);
  if (existing) return existing;
  const seed = durableMenus.find((m) => m.weekStart === weekStart);
  if (!seed || !seed.weekStart) return null;
  const now = new Date().toISOString();
  return saveWeekPlan({
    id: `wp_adapt_${seed.id}`,
    weekStart: seed.weekStart,
    status: seed.status === "published" ? "published_durable" : "draft",
    sourceMenuId: seed.id,
    durableMenuId: seed.id,
    slots: seed.slots.map((s, i) => ({
      id: `slot_adapt_${i}_${Math.random().toString(36).slice(2, 6)}`,
      dayDate: s.dayDate ?? weekStart,
      dishId: s.dishId,
      dishLabel: s.dishLabel,
      disabled: false,
      macrosHint: s.macrosHint ?? null,
      allergenHint: s.allergenHint ?? null,
    })),
    createdAt: now,
    updatedAt: now,
  });
}

export function MenuAdaptationPanel({
  canWrite,
  weekStart,
  durableMenus,
  dishPicks,
  libraryItems,
  onPreview,
  onPublish,
  onBackToSearch,
}: Props) {
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [addDay, setAddDay] = useState<string | null>(null);

  useEffect(() => {
    ensurePlanFromDurable(weekStart, durableMenus);
    setTick((n) => n + 1);
  }, [weekStart, durableMenus]);

  const picks = useMemo(() => {
    if (dishPicks.length > 0) return dishPicks;
    return CONVERSATION_DISHES.map((d) => ({
      id: d.id,
      label: d.label,
      durable: false,
      macrosHint: null as string | null,
      allergenHint: null as string | null,
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

  const days = weekDates(weekStart);
  const byDay = plan ? slotsByDay(plan) : null;
  const selected = plan?.slots.find((s) => s.id === selectedId) ?? null;

  function refresh() {
    setTick((n) => n + 1);
  }

  function requireWrite() {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return false;
    }
    return true;
  }

  function onReplace(dish: DishPick) {
    if (!requireWrite() || !selected) return;
    replaceSlotDish(weekStart, selected.id, {
      dishId: dish.id,
      dishLabel: dish.label,
      macrosHint: dish.macrosHint,
      allergenHint: dish.allergenHint,
    });
    refresh();
    setAction(null);
    toast.success(`Reemplazado · ${dish.label}`);
  }

  function onMove(toDay: string) {
    if (!requireWrite() || !selected) return;
    moveSlot(weekStart, selected.id, toDay);
    refresh();
    setAction(null);
    toast.success(`Movido a ${dayLabel(toDay)}`);
  }

  function onCopy(toDay: string) {
    if (!requireWrite() || !selected) return;
    duplicateSlot(weekStart, selected.id, toDay);
    refresh();
    setAction(null);
    toast.success(`Copiado a ${dayLabel(toDay)}`);
  }

  function onDuplicateSameDay(slot: WeekDishSlot) {
    if (!requireWrite()) return;
    duplicateSlot(weekStart, slot.id);
    refresh();
    toast.success("Plato duplicado");
  }

  function onRemove(slot: WeekDishSlot) {
    if (!requireWrite()) return;
    removeSlot(weekStart, slot.id);
    if (selectedId === slot.id) setSelectedId(null);
    refresh();
    toast.success("Plato quitado");
  }

  function onAdd(dayDate: string, dish: DishPick) {
    if (!requireWrite()) return;
    ensurePlanFromDurable(weekStart, durableMenus);
    upsertSlot(weekStart, {
      dayDate,
      dishId: dish.id,
      dishLabel: dish.label,
      disabled: false,
      macrosHint: dish.macrosHint,
      allergenHint: dish.allergenHint,
    });
    refresh();
    setAddDay(null);
    toast.success(`Añadido · ${dish.label}`);
  }

  if (!plan) {
    return (
      <section className="space-y-3" aria-labelledby="me-adapt-empty">
        <h2 id="me-adapt-empty" className="text-sm font-semibold tracking-wide">
          Adaptación semanal
        </h2>
        <p className="text-sm">No hay plan para {formatWeekLabel(weekStart)}.</p>
        <button
          type="button"
          onClick={onBackToSearch}
          className="min-h-11 rounded-md bg-foreground px-4 text-sm text-background"
        >
          Ir a búsqueda
        </button>
      </section>
    );
  }

  const activeCount = plan.slots.filter((s) => !s.disabled).length;

  return (
    <section className="space-y-4" aria-labelledby="me-adapt">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="me-adapt" className="text-sm font-semibold tracking-wide">
            Adaptación semanal
          </h2>
          <p className="text-lg font-medium">{formatWeekLabel(plan.weekStart)}</p>
          <p className="text-xs text-muted-foreground">
            Cambia · mueve · quita · añade — sin reconstruir la semana
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToSearch}
          className="text-xs underline-offset-2 hover:underline"
        >
          Búsqueda
        </button>
      </div>

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
        <StatusChip tone="info" label={`${activeCount} platos`} />
        <StatusChip tone="info" label={`Semana ${plan.weekStart}`} />
        {plan.weekStart === mondayIso() ? (
          <StatusChip tone="positive" label="Semana actual" />
        ) : null}
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <div key={day} className="space-y-2 border-t border-border/50 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {dayLabel(day)}{" "}
                <span className="font-normal text-muted-foreground">{day}</span>
              </p>
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => {
                  setAddDay((d) => (d === day ? null : day));
                  setAction(null);
                  setSelectedId(null);
                }}
                className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
              >
                {addDay === day ? "Cerrar" : "Añadir plato"}
              </button>
            </div>

            <ul className="space-y-1">
              {(byDay?.[day] ?? []).map((slot) => {
                const active = selectedId === slot.id;
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(slot.id);
                        setAction(null);
                        setAddDay(null);
                      }}
                      className={cn(
                        "flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/40",
                        active && "bg-muted/50",
                        slot.disabled && "opacity-50 line-through",
                      )}
                    >
                      <span className="font-medium">{slot.dishLabel}</span>
                      {slot.allergenHint ? (
                        <span className="text-xs text-muted-foreground">
                          {slot.allergenHint}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {(byDay?.[day] ?? []).length === 0 ? (
                <li className="text-xs text-muted-foreground">Sin platos</li>
              ) : null}
            </ul>

            {addDay === day ? (
              <DishLibraryPicker
                items={library}
                mode="insert"
                canWrite={canWrite}
                onPick={(dish) => onAdd(day, dish)}
                onClose={() => setAddDay(null)}
              />
            ) : null}
          </div>
        ))}
      </div>

      {selected ? (
        <div className="space-y-3 rounded-md border border-border px-3 py-3">
          <p className="text-sm font-medium">
            Adaptar · {selected.dishLabel} · {dayLabel(selected.dayDate)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => setAction(action === "replace" ? null : "replace")}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                action === "replace"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              Reemplazar
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => setAction(action === "move" ? null : "move")}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                action === "move"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              Mover
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => setAction(action === "copy" ? null : "copy")}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs",
                action === "copy"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              Copiar a día
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => onDuplicateSameDay(selected)}
              className="min-h-10 rounded-md border border-border px-3 text-xs disabled:opacity-40"
            >
              Duplicar
            </button>
            <button
              type="button"
              disabled={!canWrite}
              onClick={() => onRemove(selected)}
              className="min-h-10 rounded-md border border-border px-3 text-xs disabled:opacity-40"
            >
              Quitar
            </button>
            <span className="inline-flex min-h-10 items-center px-2 text-xs text-muted-foreground">
              Bulk Adaptation → Reserved
            </span>
          </div>

          {action === "replace" ? (
            <DishLibraryPicker
              items={library}
              mode="replace"
              canWrite={canWrite}
              onPick={(dish) => onReplace(dish)}
              onClose={() => setAction(null)}
            />
          ) : null}

          {action === "move" || action === "copy" ? (
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  disabled={action === "move" && day === selected.dayDate}
                  onClick={() =>
                    action === "move" ? onMove(day) : onCopy(day)
                  }
                  className="min-h-10 rounded-md border border-border px-3 text-xs disabled:opacity-40"
                >
                  {dayLabel(day)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Selecciona un plato para adaptarlo.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            markPreview(weekStart);
            refresh();
            onPreview();
          }}
          className="min-h-12 flex-1 rounded-md border border-border px-4 text-sm"
        >
          Vista previa
        </button>
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => {
            void (async () => {
              if (!requireWrite()) return;
              const current = getWeekPlan(weekStart);
              if (!current) return;
              await onPublish(current);
              markPublished(weekStart, "published_session");
              refresh();
            })();
          }}
          className="min-h-12 flex-1 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          Publicar adaptación
        </button>
      </div>
    </section>
  );
}
