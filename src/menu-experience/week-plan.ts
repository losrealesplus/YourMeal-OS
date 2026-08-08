/**
 * ME001 — Experience-layer weekly menu plan.
 *
 * Working set for Zero Friction Weekly Menu Planning.
 * Session continuity until Product opens a Menu Facade.
 * Not a second Capability. Not Import / Bulk (Reserved).
 */

export type WeekPlanStatus =
  | "draft"
  | "preview"
  | "published_session"
  | "published_durable";

export type WeekDishSlot = {
  id: string;
  dayDate: string;
  dishId: string;
  dishLabel: string;
  disabled: boolean;
  macrosHint?: string | null;
  allergenHint?: string | null;
};

export type WeekPlan = {
  id: string;
  weekStart: string;
  status: WeekPlanStatus;
  slots: WeekDishSlot[];
  sourceWeekStart?: string | null;
  sourceMenuId?: string | null;
  durableMenuId?: string | null;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "ymos.me.week_plan.v1";

let memory: WeekPlan[] = [];

export const DAY_LABELS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function utcDateOnly(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Monday (UTC) of the week containing `date`. */
export function mondayIso(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return utcDateOnly(d);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return utcDateOnly(dt);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));
}

export function nextWeekStart(weekStart: string): string {
  return addDaysIso(weekStart, 7);
}

export function prevWeekStart(weekStart: string): string {
  return addDaysIso(weekStart, -7);
}

export function formatWeekLabel(weekStart: string): string {
  const end = addDaysIso(weekStart, 6);
  return `${weekStart} → ${end}`;
}

export function dayLabel(dayDate: string): string {
  const [y, m, d] = dayDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return DAY_LABELS_ES[dt.getUTCDay() === 0 ? 6 : dt.getUTCDay() - 1] ?? dayDate;
}

function readAll(): WeekPlan[] {
  if (typeof sessionStorage === "undefined") return [...memory];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...memory];
    const parsed = JSON.parse(raw) as WeekPlan[];
    return Array.isArray(parsed) ? parsed : [...memory];
  } catch {
    return [...memory];
  }
}

function writeAll(rows: WeekPlan[]) {
  memory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function listWeekPlans(): WeekPlan[] {
  return [...readAll()].sort(
    (a, b) => Date.parse(b.weekStart) - Date.parse(a.weekStart),
  );
}

export function getWeekPlan(weekStart: string): WeekPlan | null {
  return readAll().find((p) => p.weekStart === weekStart) ?? null;
}

export function saveWeekPlan(plan: WeekPlan): WeekPlan {
  const next = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  const rows = readAll().filter((p) => p.weekStart !== plan.weekStart);
  writeAll([next, ...rows].slice(0, 24));
  return next;
}

export function createEmptyWeek(weekStart: string): WeekPlan {
  const now = new Date().toISOString();
  const plan: WeekPlan = {
    id: `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    weekStart,
    status: "draft",
    slots: [],
    createdAt: now,
    updatedAt: now,
  };
  return saveWeekPlan(plan);
}

/** Duplicate source slots onto target week (shifted by day offset). */
export function duplicateWeekPlan(input: {
  source: WeekPlan;
  targetWeekStart: string;
  sourceMenuId?: string | null;
}): WeekPlan {
  const sourceDays = weekDates(input.source.weekStart);
  const targetDays = weekDates(input.targetWeekStart);
  const dayMap = new Map(sourceDays.map((d, i) => [d, targetDays[i]!]));
  const now = new Date().toISOString();
  const plan: WeekPlan = {
    id: `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    weekStart: input.targetWeekStart,
    status: "draft",
    sourceWeekStart: input.source.weekStart,
    sourceMenuId: input.sourceMenuId ?? input.source.sourceMenuId ?? null,
    slots: input.source.slots.map((s) => ({
      ...s,
      id: `slot_${Math.random().toString(36).slice(2, 9)}`,
      dayDate: dayMap.get(s.dayDate) ?? s.dayDate,
      disabled: false,
    })),
    createdAt: now,
    updatedAt: now,
  };
  return saveWeekPlan(plan);
}

export function upsertSlot(
  weekStart: string,
  slot: Omit<WeekDishSlot, "id"> & { id?: string },
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  const id = slot.id ?? `slot_${Math.random().toString(36).slice(2, 9)}`;
  const nextSlot: WeekDishSlot = {
    id,
    dayDate: slot.dayDate,
    dishId: slot.dishId,
    dishLabel: slot.dishLabel,
    disabled: slot.disabled ?? false,
    macrosHint: slot.macrosHint ?? null,
    allergenHint: slot.allergenHint ?? null,
  };
  const others = plan.slots.filter((s) => s.id !== id);
  return saveWeekPlan({ ...plan, status: "draft", slots: [...others, nextSlot] });
}

export function removeSlot(weekStart: string, slotId: string): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  return saveWeekPlan({
    ...plan,
    status: "draft",
    slots: plan.slots.filter((s) => s.id !== slotId),
  });
}

export function setSlotDisabled(
  weekStart: string,
  slotId: string,
  disabled: boolean,
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  return saveWeekPlan({
    ...plan,
    status: "draft",
    slots: plan.slots.map((s) => (s.id === slotId ? { ...s, disabled } : s)),
  });
}

/** ME003 — move a dish to another day in the same week. */
export function moveSlot(
  weekStart: string,
  slotId: string,
  toDayDate: string,
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return null;
  return saveWeekPlan({
    ...plan,
    status: "draft",
    slots: plan.slots.map((s) =>
      s.id === slotId ? { ...s, dayDate: toDayDate, disabled: false } : s,
    ),
  });
}

/** ME003 — duplicate a dish onto a day (same day by default). */
export function duplicateSlot(
  weekStart: string,
  slotId: string,
  toDayDate?: string,
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return null;
  const copy: WeekDishSlot = {
    ...slot,
    id: `slot_${Math.random().toString(36).slice(2, 9)}`,
    dayDate: toDayDate ?? slot.dayDate,
    disabled: false,
  };
  return saveWeekPlan({
    ...plan,
    status: "draft",
    slots: [...plan.slots, copy],
  });
}

/** ME003 — replace dish identity on a slot. */
export function replaceSlotDish(
  weekStart: string,
  slotId: string,
  dish: { dishId: string; dishLabel: string; macrosHint?: string | null; allergenHint?: string | null },
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  return saveWeekPlan({
    ...plan,
    status: "draft",
    slots: plan.slots.map((s) =>
      s.id === slotId
        ? {
            ...s,
            dishId: dish.dishId,
            dishLabel: dish.dishLabel,
            macrosHint: dish.macrosHint ?? null,
            allergenHint: dish.allergenHint ?? null,
            disabled: false,
          }
        : s,
    ),
  });
}

export function markPreview(weekStart: string): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  return saveWeekPlan({ ...plan, status: "preview" });
}

export function markPublished(
  weekStart: string,
  mode: "published_session" | "published_durable",
  durableMenuId?: string | null,
): WeekPlan | null {
  const plan = getWeekPlan(weekStart);
  if (!plan) return null;
  return saveWeekPlan({
    ...plan,
    status: mode,
    durableMenuId: durableMenuId ?? plan.durableMenuId ?? null,
  });
}

export function activeSlots(plan: WeekPlan): WeekDishSlot[] {
  return plan.slots.filter((s) => !s.disabled);
}

export function slotsByDay(plan: WeekPlan): Record<string, WeekDishSlot[]> {
  const map: Record<string, WeekDishSlot[]> = {};
  for (const day of weekDates(plan.weekStart)) map[day] = [];
  for (const slot of plan.slots) {
    if (!map[slot.dayDate]) map[slot.dayDate] = [];
    map[slot.dayDate]!.push(slot);
  }
  return map;
}

export function clearWeekPlansForTests() {
  memory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
