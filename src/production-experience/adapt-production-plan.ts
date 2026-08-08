/**
 * PE003 — Adapt an existing production plan without regenerating from Menu.
 *
 * Living plan: move · resize · rebatch · reschedule deadlines/preps.
 * Experience only — Production Capability / Facade untouched.
 */

import { addDaysIso, weekDates } from "@/menu-experience/week-plan";
import {
  getProductionPlan,
  saveProductionPlan,
  type DayLoad,
  type ProductionAlert,
  type ProductionPlan,
  type ProductionWorkItem,
} from "@/production-experience/production-plan";

export type AdaptationKind =
  | "move_day"
  | "resize_quantity"
  | "change_batch"
  | "adjust_deadline"
  | "reschedule_prep";

export type AdaptationImpact = {
  kind: AdaptationKind;
  summary: string;
  workId: string;
  dishLabel: string;
  before: string;
  after: string;
  daysAffected: string[];
  kitchenImpact: string;
  alertsTriggered: string[];
  loadChanged: boolean;
};

function batchKey(dishId: string, dayDate: string): string {
  return `${dayDate}__${dishId}`;
}

/** Recompute day loads + capacity/incomplete alerts after adaptation. */
export function recomputePlanDerived(plan: ProductionPlan): ProductionPlan {
  const days = weekDates(plan.weekStart);
  const kept = plan.alerts.filter(
    (a) =>
      a.code !== "capacity_warning" &&
      a.code !== "incomplete_week" &&
      a.code !== "insufficient_planning",
  );

  const alerts: ProductionAlert[] = [...kept];
  const daysWithWork = new Set(plan.work.map((w) => w.productionDay));

  for (const day of days) {
    if (!daysWithWork.has(day)) {
      alerts.push({
        code: "incomplete_week",
        severity: "warn",
        message: `Día sin trabajo de producción · ${day}`,
        dayDate: day,
        fixHint: "Mueve trabajo a este día o confirma que queda cerrado.",
      });
    }
  }

  if (plan.work.length < 3) {
    alerts.push({
      code: "insufficient_planning",
      severity: "warn",
      message: "Planificación de producción muy fina — revisa cobertura semanal.",
      fixHint: "Adapta cantidades o mueve trabajo entre días.",
    });
  }

  const dayLoads: DayLoad[] = days.map((dayDate) => {
    const dayWork = plan.work.filter((w) => w.productionDay === dayDate);
    const totalQuantity = dayWork.reduce((n, w) => n + w.quantity, 0);
    const batchCount = new Set(dayWork.map((w) => w.batchKey)).size;
    const overload = totalQuantity >= 12 || batchCount >= 8;
    if (overload) {
      alerts.push({
        code: "capacity_warning",
        severity: "warn",
        message: `Posible sobrecarga · ${dayDate} · ${totalQuantity} uds / ${batchCount} lotes`,
        dayDate,
        fixHint: "Reequilibra carga antes del handoff a Kitchen.",
      });
    }
    const alertCount = alerts.filter(
      (a) => a.dayDate === dayDate && a.severity !== "info",
    ).length;
    return {
      dayDate,
      workCount: dayWork.length,
      totalQuantity,
      batchCount,
      alertCount,
      overload,
    };
  });

  return {
    ...plan,
    status: plan.status === "ready_for_kitchen" ? "reviewed" : plan.status,
    confirmedAt: null,
    dayLoads,
    alerts,
  };
}

function findWork(
  plan: ProductionPlan,
  workId: string,
): ProductionWorkItem | null {
  return plan.work.find((w) => w.id === workId) ?? null;
}

function syncPrepsForWork(
  plan: ProductionPlan,
  work: ProductionWorkItem,
  dayDeltaHint?: { from: string; to: string },
): ProductionPlan {
  const preparations = plan.preparations.map((p) => {
    if (p.workId !== work.id) return p;
    if (dayDeltaHint) {
      const offset =
        Date.parse(p.preparationDate) - Date.parse(dayDeltaHint.from);
      const days = Math.round(offset / (1000 * 60 * 60 * 24));
      return {
        ...p,
        preparationDate: addDaysIso(dayDeltaHint.to, days),
        requiredUseDate: work.productionDay,
        status: "pending" as const,
      };
    }
    return {
      ...p,
      requiredUseDate: work.productionDay,
      status: "pending" as const,
    };
  });
  return { ...plan, preparations };
}

export function previewMoveWork(
  plan: ProductionPlan,
  workId: string,
  toDay: string,
): AdaptationImpact | null {
  const work = findWork(plan, workId);
  if (!work || work.productionDay === toDay) return null;
  const fromLoad = plan.dayLoads.find((d) => d.dayDate === work.productionDay);
  const toLoad = plan.dayLoads.find((d) => d.dayDate === toDay);
  const nextQty = (toLoad?.totalQuantity ?? 0) + work.quantity;
  const alertsTriggered: string[] = [];
  if (nextQty >= 12) alertsTriggered.push("capacity_warning en destino");
  if ((fromLoad?.workCount ?? 1) <= 1) {
    alertsTriggered.push("día origen puede quedar vacío");
  }
  return {
    kind: "move_day",
    summary: `Mover ${work.dishLabel} → ${toDay}`,
    workId,
    dishLabel: work.dishLabel,
    before: work.productionDay,
    after: toDay,
    daysAffected: [work.productionDay, toDay],
    kitchenImpact: `Handoff del ${toDay} gana ${work.quantity} uds; ${work.productionDay} pierde trabajo.`,
    alertsTriggered,
    loadChanged: true,
  };
}

export function moveWorkToDay(
  weekStart: string,
  workId: string,
  toDay: string,
): { plan: ProductionPlan; impact: AdaptationImpact } | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const impact = previewMoveWork(plan, workId, toDay);
  if (!impact) return null;
  const work = findWork(plan, workId)!;
  const from = work.productionDay;
  const nextWork: ProductionWorkItem = {
    ...work,
    productionDay: toDay,
    batchKey: batchKey(work.dishId, toDay),
    cookingDeadline: `${toDay}T10:00:00.000Z`,
    preparationDeadline: `${addDaysIso(toDay, -1)}T18:00:00.000Z`,
    status: "planned",
  };
  let next: ProductionPlan = {
    ...plan,
    work: plan.work.map((w) => (w.id === workId ? nextWork : w)),
  };
  next = syncPrepsForWork(next, nextWork, { from, to: toDay });
  next = recomputePlanDerived(next);
  return { plan: saveProductionPlan(next), impact };
}

export function previewResizeQuantity(
  plan: ProductionPlan,
  workId: string,
  quantity: number,
): AdaptationImpact | null {
  const work = findWork(plan, workId);
  if (!work || quantity < 1 || quantity === work.quantity) return null;
  const dayLoad = plan.dayLoads.find((d) => d.dayDate === work.productionDay);
  const nextQty =
    (dayLoad?.totalQuantity ?? 0) - work.quantity + quantity;
  const alertsTriggered: string[] = [];
  if (nextQty >= 12) alertsTriggered.push("capacity_warning");
  if (quantity > work.quantity * 2) {
    alertsTriggered.push("aumento brusco de cantidad");
  }
  return {
    kind: "resize_quantity",
    summary: `Cantidad ${work.dishLabel}: ${work.quantity} → ${quantity}`,
    workId,
    dishLabel: work.dishLabel,
    before: String(work.quantity),
    after: String(quantity),
    daysAffected: [work.productionDay],
    kitchenImpact: `Kitchen prepara ${quantity} uds el ${work.productionDay} (antes ${work.quantity}).`,
    alertsTriggered,
    loadChanged: true,
  };
}

export function resizeWorkQuantity(
  weekStart: string,
  workId: string,
  quantity: number,
): { plan: ProductionPlan; impact: AdaptationImpact } | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const impact = previewResizeQuantity(plan, workId, quantity);
  if (!impact) return null;
  const nextWork = plan.work.map((w) =>
    w.id === workId
      ? { ...w, quantity, quantityEstimated: false, status: "planned" as const }
      : w,
  );
  const next = recomputePlanDerived({ ...plan, work: nextWork });
  return { plan: saveProductionPlan(next), impact };
}

export function previewChangeBatch(
  plan: ProductionPlan,
  workId: string,
  batchSuffix: string,
): AdaptationImpact | null {
  const work = findWork(plan, workId);
  if (!work) return null;
  const nextKey = `${work.productionDay}__${batchSuffix.trim() || work.dishId}`;
  if (nextKey === work.batchKey) return null;
  return {
    kind: "change_batch",
    summary: `Lote ${work.dishLabel}`,
    workId,
    dishLabel: work.dishLabel,
    before: work.batchKey,
    after: nextKey,
    daysAffected: [work.productionDay],
    kitchenImpact: `Kitchen ve el trabajo en lote ${nextKey}.`,
    alertsTriggered: [],
    loadChanged: true,
  };
}

export function changeWorkBatch(
  weekStart: string,
  workId: string,
  batchSuffix: string,
): { plan: ProductionPlan; impact: AdaptationImpact } | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const impact = previewChangeBatch(plan, workId, batchSuffix);
  if (!impact) return null;
  const nextWork = plan.work.map((w) =>
    w.id === workId
      ? { ...w, batchKey: impact.after, status: "planned" as const }
      : w,
  );
  const next = recomputePlanDerived({ ...plan, work: nextWork });
  return { plan: saveProductionPlan(next), impact };
}

export function previewAdjustDeadline(
  plan: ProductionPlan,
  workId: string,
  cookingDeadlineIso: string,
): AdaptationImpact | null {
  const work = findWork(plan, workId);
  if (!work || cookingDeadlineIso === work.cookingDeadline) return null;
  return {
    kind: "adjust_deadline",
    summary: `Deadline ${work.dishLabel}`,
    workId,
    dishLabel: work.dishLabel,
    before: work.cookingDeadline.slice(0, 16),
    after: cookingDeadlineIso.slice(0, 16),
    daysAffected: [work.productionDay],
    kitchenImpact: `Kitchen debe terminar antes de ${cookingDeadlineIso.slice(0, 16)}.`,
    alertsTriggered: ["cooking_deadline actualizado"],
    loadChanged: false,
  };
}

export function adjustWorkDeadline(
  weekStart: string,
  workId: string,
  cookingDeadlineIso: string,
): { plan: ProductionPlan; impact: AdaptationImpact } | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const impact = previewAdjustDeadline(plan, workId, cookingDeadlineIso);
  if (!impact) return null;
  const day = cookingDeadlineIso.slice(0, 10);
  const nextWork = plan.work.map((w) =>
    w.id === workId
      ? {
          ...w,
          cookingDeadline: cookingDeadlineIso,
          preparationDeadline: `${addDaysIso(day, -1)}T18:00:00.000Z`,
          status: "planned" as const,
        }
      : w,
  );
  const alerts: ProductionAlert[] = [
    ...plan.alerts.filter(
      (a) => !(a.workId === workId && a.code === "cooking_deadline"),
    ),
    {
      code: "cooking_deadline",
      severity: "info",
      message: `Deadline cocción · ${cookingDeadlineIso.slice(0, 16)} · ${impact.dishLabel}`,
      dayDate: day,
      workId,
    },
  ];
  const next = recomputePlanDerived({ ...plan, work: nextWork, alerts });
  return { plan: saveProductionPlan(next), impact };
}

export function previewReschedulePrep(
  plan: ProductionPlan,
  prepId: string,
  preparationDate: string,
): AdaptationImpact | null {
  const prep = plan.preparations.find((p) => p.id === prepId);
  if (!prep || prep.preparationDate === preparationDate) return null;
  const work = findWork(plan, prep.workId);
  return {
    kind: "reschedule_prep",
    summary: `Prep · ${prep.label}`,
    workId: prep.workId,
    dishLabel: work?.dishLabel ?? prep.label,
    before: prep.preparationDate,
    after: preparationDate,
    daysAffected: [prep.preparationDate, preparationDate, prep.requiredUseDate],
    kitchenImpact: `Pre-preparación lista el ${preparationDate} para uso ${prep.requiredUseDate}.`,
    alertsTriggered:
      preparationDate > prep.requiredUseDate
        ? ["prep después del uso — revisar"]
        : [],
    loadChanged: false,
  };
}

export function reschedulePrep(
  weekStart: string,
  prepId: string,
  preparationDate: string,
): { plan: ProductionPlan; impact: AdaptationImpact } | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const impact = previewReschedulePrep(plan, prepId, preparationDate);
  if (!impact) return null;
  const preparations = plan.preparations.map((p) =>
    p.id === prepId
      ? { ...p, preparationDate, status: "pending" as const }
      : p,
  );
  const next = recomputePlanDerived({ ...plan, preparations });
  return { plan: saveProductionPlan(next), impact };
}
