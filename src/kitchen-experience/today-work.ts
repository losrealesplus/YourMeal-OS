/**
 * KE001 — Today's Kitchen Work (Experience only).
 *
 * Kitchen receives Production Handoff.
 * Kitchen does not plan. Kitchen does not invent Order/Customer substrate.
 * Start / Pause / Resume / Block / Assign Capability actions → Future.
 */

import { utcDateOnly, dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";
import {
  buildKitchenHandoff,
  type HandoffWarning,
  type KitchenHandoffView,
} from "@/production-experience/handoff-view";
import {
  getProductionPlan,
  listProductionPlans,
  type ProductionPlan,
} from "@/production-experience/production-plan";

export type KitchenWorkStatus =
  | "ready"
  | "in_progress"
  | "completed"
  | "blocked";

export type KitchenWorkFilter =
  | "all"
  | "urgent"
  | "pending"
  | "blocked"
  | "completed";

export type KitchenExecutionCard = {
  id: string;
  weekStart: string;
  productionDay: string;
  dayLabel: string;
  dishLabel: string;
  quantity: number;
  quantityEstimated: boolean;
  batchKey: string;
  cookingDeadline: string;
  priority: "high" | "normal" | "low";
  status: KitchenWorkStatus;
  requiredPreps: string;
  prepStatusSummary: string;
  allergenHint: string | null;
  dietaryHint: string | null;
  operationalNotes: string;
  /** Honest absence when substrate missing */
  customerLabel: string | null;
  orderRef: string | null;
  specialInstruction: string | null;
  handoffReady: boolean;
  urgent: boolean;
};

export type TodaysKitchenWork = {
  dayDate: string;
  dayLabel: string;
  cards: KitchenExecutionCard[];
  warnings: HandoffWarning[];
  handedOffPlanCount: number;
  pendingHandoffPlanCount: number;
  emptyReason: string | null;
  nextActionHint: string;
};

const STATUS_KEY = "ymos.ke.exec_status.v1";

let statusMemory: Record<string, KitchenWorkStatus> = {};

function readStatusMap(): Record<string, KitchenWorkStatus> {
  if (typeof sessionStorage === "undefined") return { ...statusMemory };
  try {
    const raw = sessionStorage.getItem(STATUS_KEY);
    if (!raw) return { ...statusMemory };
    const parsed = JSON.parse(raw) as Record<string, KitchenWorkStatus>;
    return parsed && typeof parsed === "object"
      ? { ...parsed }
      : { ...statusMemory };
  } catch {
    return { ...statusMemory };
  }
}

function writeStatusMap(map: Record<string, KitchenWorkStatus>) {
  statusMemory = map;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getKitchenWorkStatus(workId: string): KitchenWorkStatus | null {
  return readStatusMap()[workId] ?? null;
}

export function setKitchenWorkStatus(
  workId: string,
  status: KitchenWorkStatus,
): void {
  const map = readStatusMap();
  map[workId] = status;
  writeStatusMap(map);
}

export function clearKitchenWorkStatusForTests(): void {
  statusMemory = {};
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STATUS_KEY);
  }
}

function statusLabel(s: KitchenWorkStatus): string {
  switch (s) {
    case "ready":
      return "Ready";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "blocked":
      return "Blocked";
  }
}

export { statusLabel as kitchenWorkStatusLabel };

function resolveStatus(
  workId: string,
  prepBlocked: boolean,
): KitchenWorkStatus {
  const overlay = getKitchenWorkStatus(workId);
  if (overlay) return overlay;
  if (prepBlocked) return "blocked";
  return "ready";
}

function isUrgent(deadline: string, dayDate: string, today: string): boolean {
  const due = deadline.slice(0, 10);
  return due <= today || dayDate === today;
}

/**
 * All execution cards from Ready-for-Kitchen handoffs.
 * Optional dayDate filters to that production day (Today's Work).
 */
export function listExecutionCards(
  dayDate?: string | null,
  today: string = utcDateOnly(),
): KitchenExecutionCard[] {
  const handedOff = listHandedOffPlans();
  const cards: KitchenExecutionCard[] = [];

  for (const plan of handedOff) {
    const handoff = buildKitchenHandoff(plan, today);
    for (const line of handoff.lines) {
      if (dayDate && line.productionDay !== dayDate) continue;
      const prepBlocked =
        line.prepStatusSummary === "Bloqueada" ||
        line.prepStatusSummary === "Vencida";
      const status = resolveStatus(line.workId, prepBlocked);
      cards.push({
        id: line.workId,
        weekStart: plan.weekStart,
        productionDay: line.productionDay,
        dayLabel: line.dayLabel,
        dishLabel: line.dishLabel,
        quantity: line.quantity,
        quantityEstimated: line.quantityEstimated,
        batchKey: line.batchKey,
        cookingDeadline: line.cookingDeadline,
        priority:
          line.priority === "high" || prepBlocked ? "high" : line.priority,
        status,
        requiredPreps: line.requiredPreps,
        prepStatusSummary: line.prepStatusSummary,
        allergenHint: line.allergenHint,
        dietaryHint: line.dietaryHint,
        operationalNotes: line.operationalNotes,
        customerLabel: line.customerLabel,
        orderRef: line.orderRef,
        specialInstruction: line.specialInstruction,
        handoffReady: true,
        urgent: isUrgent(line.cookingDeadline, line.productionDay, today),
      });
    }
  }

  cards.sort(
    (a, b) =>
      (a.status === "blocked" ? 0 : 1) - (b.status === "blocked" ? 0 : 1) ||
      (a.urgent ? 0 : 1) - (b.urgent ? 0 : 1) ||
      a.cookingDeadline.localeCompare(b.cookingDeadline) ||
      a.dishLabel.localeCompare(b.dishLabel),
  );
  return cards;
}

/** Build today's execution queue from Production handoff (Experience). */
export function buildTodaysKitchenWork(
  dayDate: string = utcDateOnly(),
): TodaysKitchenWork {
  const plans = listProductionPlans();
  const handedOff = plans.filter((p) => p.status === "ready_for_kitchen");
  const pending = plans.filter((p) => p.status !== "ready_for_kitchen");

  const warnings: HandoffWarning[] = [];
  const cards = listExecutionCards(dayDate, dayDate);

  for (const plan of handedOff) {
    const handoff = buildKitchenHandoff(plan, dayDate);
    for (const w of handoff.warnings) {
      if (w.severity === "info") continue;
      warnings.push({
        ...w,
        id: `${plan.weekStart}:${w.id}`,
      });
    }
  }

  // Surface incomplete handoffs that still have work on this day (warning, not invent)
  for (const plan of pending) {
    const dayWork = plan.work.filter((w) => w.productionDay === dayDate);
    if (dayWork.length === 0) continue;
    warnings.push({
      id: `incomplete-handoff:${plan.weekStart}`,
      code: "incomplete_handoff",
      severity: "warn",
      message: `Handoff incompleto · ${formatWeekLabel(plan.weekStart)}`,
      fixHint: "Confirma Kitchen Handoff en Production antes de ejecutar.",
      nextAction: "planning",
    });
  }

  let emptyReason: string | null = null;
  let nextActionHint = "Revisa la cola y abre el trabajo prioritario.";
  if (plans.length === 0) {
    emptyReason =
      "No hay plan de producción. Production debe generar y transferir el handoff.";
    nextActionHint = "Abrir Production Planning";
  } else if (handedOff.length === 0) {
    emptyReason =
      "No hay trabajo Ready for Kitchen. El handoff de Production aún no está confirmado.";
    nextActionHint = "Revisar Production Handoff";
  } else if (cards.length === 0) {
    emptyReason = `No hay trabajo para ${dayLabel(dayDate)} (${dayDate}) en planes transferidos.`;
    nextActionHint = "Revisar Production Handoff u otro día";
  }

  return {
    dayDate,
    dayLabel: dayLabel(dayDate),
    cards,
    warnings: dedupeWarnings(warnings),
    handedOffPlanCount: handedOff.length,
    pendingHandoffPlanCount: pending.filter((p) =>
      p.work.some((w) => w.productionDay === dayDate),
    ).length,
    emptyReason,
    nextActionHint,
  };
}

function dedupeWarnings(list: HandoffWarning[]): HandoffWarning[] {
  const byId = new Map<string, HandoffWarning>();
  for (const w of list) {
    if (!byId.has(w.id)) byId.set(w.id, w);
  }
  return [...byId.values()];
}

export function filterKitchenCards(
  cards: KitchenExecutionCard[],
  filter: KitchenWorkFilter,
): KitchenExecutionCard[] {
  switch (filter) {
    case "urgent":
      return cards.filter(
        (c) =>
          c.urgent && c.status !== "completed" && c.status !== "blocked",
      );
    case "pending":
      return cards.filter(
        (c) => c.status === "ready" || c.status === "in_progress",
      );
    case "blocked":
      return cards.filter((c) => c.status === "blocked");
    case "completed":
      return cards.filter((c) => c.status === "completed");
    default:
      return cards;
  }
}

export function listHandedOffPlans(): ProductionPlan[] {
  return listProductionPlans().filter((p) => p.status === "ready_for_kitchen");
}

export function getHandoffGlance(weekStart: string): KitchenHandoffView | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  return buildKitchenHandoff(plan);
}
