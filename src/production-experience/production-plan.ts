/**
 * PE001 — Experience-layer production plan.
 *
 * Working set for Zero Friction Production Planning.
 * Source: published operational week (Menu Experience).
 * Not a second Capability. Not order admin.
 *
 * Grammar: Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
 */

export type ProductionPlanStatus =
  | "draft"
  | "reviewed"
  | "confirmed"
  | "ready_for_kitchen";

export type ProductionWorkStatus =
  | "planned"
  | "alert"
  | "ready"
  | "handed_off";

export type PrepKind =
  | "base"
  | "sauce"
  | "protein"
  | "vegetable"
  | "defrost"
  | "cutting"
  | "assembly"
  | "packaging"
  | "other";

/** PE004 — prep lifecycle (Experience). */
export type PrepStatus =
  | "pending"
  | "scheduled"
  | "ready"
  | "overdue"
  | "blocked"
  | "done";

export type PrepPriority = "high" | "normal" | "low";

export type ProductionAlertCode =
  | "missing_production_data"
  | "insufficient_planning"
  | "preparation_deadline"
  | "cooking_deadline"
  | "defrost_requirement"
  | "capacity_warning"
  | "quantity_estimated"
  | "incomplete_week";

export type ProductionAlert = {
  code: ProductionAlertCode;
  severity: "block" | "warn" | "info";
  message: string;
  dayDate?: string;
  workId?: string;
  fixHint?: string;
};

export type PrePreparation = {
  id: string;
  kind: PrepKind;
  label: string;
  preparationDate: string;
  requiredUseDate: string;
  status: PrepStatus;
  workId: string;
  /** Portions / units tied to related work (Experience honesty). */
  requiredQuantity?: number;
  priority?: PrepPriority;
};

export type ProductionWorkItem = {
  id: string;
  productionDay: string;
  dishId: string;
  dishLabel: string;
  quantity: number;
  batchKey: string;
  status: ProductionWorkStatus;
  allergenHint?: string | null;
  macrosHint?: string | null;
  quantityEstimated: boolean;
  cookingDeadline: string;
  preparationDeadline: string;
  prepIds: string[];
};

export type DayLoad = {
  dayDate: string;
  workCount: number;
  totalQuantity: number;
  batchCount: number;
  alertCount: number;
  overload: boolean;
};

export type ProductionPlan = {
  id: string;
  weekStart: string;
  sourceWeekPlanId: string;
  sourceMenuStatus: string;
  status: ProductionPlanStatus;
  work: ProductionWorkItem[];
  preparations: PrePreparation[];
  alerts: ProductionAlert[];
  dayLoads: DayLoad[];
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "ymos.pe.production_plan.v1";

let memory: ProductionPlan[] = [];

function readAll(): ProductionPlan[] {
  if (typeof sessionStorage === "undefined") return [...memory];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...memory];
    const parsed = JSON.parse(raw) as ProductionPlan[];
    return Array.isArray(parsed) ? parsed : [...memory];
  } catch {
    return [...memory];
  }
}

function writeAll(rows: ProductionPlan[]) {
  memory = rows;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function listProductionPlans(): ProductionPlan[] {
  return [...readAll()].sort(
    (a, b) => Date.parse(b.weekStart) - Date.parse(a.weekStart),
  );
}

export function getProductionPlan(weekStart: string): ProductionPlan | null {
  return readAll().find((p) => p.weekStart === weekStart) ?? null;
}

export function saveProductionPlan(plan: ProductionPlan): ProductionPlan {
  const next = { ...plan, updatedAt: new Date().toISOString() };
  const rows = readAll().filter((p) => p.weekStart !== plan.weekStart);
  writeAll([next, ...rows].slice(0, 24));
  return next;
}

export function confirmProductionPlan(weekStart: string): ProductionPlan | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  return saveProductionPlan({
    ...plan,
    status: "ready_for_kitchen",
    confirmedAt: new Date().toISOString(),
  });
}

export function clearProductionPlansForTests() {
  memory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function totalQuantity(plan: ProductionPlan): number {
  return plan.work.reduce((n, w) => n + w.quantity, 0);
}

export function workByDay(
  plan: ProductionPlan,
): Record<string, ProductionWorkItem[]> {
  const map: Record<string, ProductionWorkItem[]> = {};
  for (const w of plan.work) {
    if (!map[w.productionDay]) map[w.productionDay] = [];
    map[w.productionDay]!.push(w);
  }
  return map;
}
