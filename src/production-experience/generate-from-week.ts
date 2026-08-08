/**
 * PE001 — Transform published weekly menu → executable production plan.
 *
 * Experience only. Does not change Production Capability / Facade.
 * Quantities are estimated from menu coverage until Orders enrich the plan.
 */

import {
  activeSlots,
  addDaysIso,
  weekDates,
  type WeekPlan,
} from "@/menu-experience/week-plan";
import {
  saveProductionPlan,
  type DayLoad,
  type PrePreparation,
  type PrepKind,
  type ProductionAlert,
  type ProductionPlan,
  type ProductionWorkItem,
} from "@/production-experience/production-plan";

function inferPreps(
  dishLabel: string,
  productionDay: string,
  workId: string,
  quantity: number,
): PrePreparation[] {
  const label = dishLabel.toLowerCase();
  const preps: Array<{
    kind: PrepKind;
    title: string;
    offsetDays: number;
    priority: "high" | "normal" | "low";
  }> = [];

  if (
    /pescado|salmón|salmon|atún|marisco|congel|frozen|defrost/.test(label)
  ) {
    preps.push({
      kind: "defrost",
      title: "Descongelar",
      offsetDays: -1,
      priority: "high",
    });
  }
  if (/salsa|sauce|alioli|pesto/.test(label)) {
    preps.push({
      kind: "sauce",
      title: "Preparar salsa",
      offsetDays: -1,
      priority: "high",
    });
  }
  if (/verdura|vegetal|ensalada|veggie/.test(label)) {
    preps.push({
      kind: "vegetable",
      title: "Prep verdura",
      offsetDays: 0,
      priority: "normal",
    });
  }
  if (/base|arroz|rice|quinoa|bowl|poke/.test(label)) {
    preps.push({
      kind: "base",
      title: "Preparar base",
      offsetDays: 0,
      priority: "normal",
    });
  }
  if (/pollo|carne|protein|ternera|cerdo|tofu/.test(label)) {
    preps.push({
      kind: "protein",
      title: "Preparar proteína",
      offsetDays: 0,
      priority: "high",
    });
  }
  if (/corte|juliana|dice|picad/.test(label)) {
    preps.push({
      kind: "cutting",
      title: "Corte / mise en place",
      offsetDays: 0,
      priority: "normal",
    });
  }
  if (/pack|envas|bolsa/.test(label)) {
    preps.push({
      kind: "packaging",
      title: "Prep envasado",
      offsetDays: 0,
      priority: "low",
    });
  }

  if (preps.length === 0) {
    preps.push({
      kind: "assembly",
      title: "Preparación de ensamblaje",
      offsetDays: 0,
      priority: "normal",
    });
  }

  return preps.map((p, i) => ({
    id: `prep_${workId}_${i}`,
    kind: p.kind,
    label: `${p.title} · ${dishLabel}`,
    preparationDate: addDaysIso(productionDay, p.offsetDays),
    requiredUseDate: productionDay,
    status: "scheduled" as const,
    workId,
    requiredQuantity: quantity,
    priority: p.priority,
  }));
}

function batchKey(dishId: string, dayDate: string): string {
  return `${dayDate}__${dishId}`;
}

/**
 * Generate (or regenerate) an Experience production plan from a published week.
 * Refuses unpublished / empty weeks.
 */
export function generateProductionPlanFromWeek(week: WeekPlan): {
  ok: true;
  plan: ProductionPlan;
} | {
  ok: false;
  reason: string;
} {
  const published =
    week.status === "published_session" ||
    week.status === "published_durable";
  if (!published) {
    return {
      ok: false,
      reason:
        "No hay semana publicada. Publica en Menu Planning antes de generar producción.",
    };
  }

  const slots = activeSlots(week);
  if (slots.length === 0) {
    return {
      ok: false,
      reason: "La semana publicada no tiene platos activos.",
    };
  }

  const grouped = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = batchKey(slot.dishId, slot.dayDate);
    const list = grouped.get(key) ?? [];
    list.push(slot);
    grouped.set(key, list);
  }

  const work: ProductionWorkItem[] = [];
  const preparations: PrePreparation[] = [];
  const alerts: ProductionAlert[] = [];

  for (const [, group] of grouped) {
    const sample = group[0]!;
    const workId = `work_${sample.dayDate}_${sample.dishId}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    const quantity = group.length;
    const item: ProductionWorkItem = {
      id: workId,
      productionDay: sample.dayDate,
      dishId: sample.dishId,
      dishLabel: sample.dishLabel,
      quantity,
      batchKey: batchKey(sample.dishId, sample.dayDate),
      status: "planned",
      allergenHint: sample.allergenHint ?? null,
      macrosHint: sample.macrosHint ?? null,
      quantityEstimated: true,
      cookingDeadline: `${sample.dayDate}T10:00:00.000Z`,
      preparationDeadline: `${addDaysIso(sample.dayDate, -1)}T18:00:00.000Z`,
      prepIds: [],
    };

    const preps = inferPreps(
      sample.dishLabel,
      sample.dayDate,
      workId,
      quantity,
    );
    item.prepIds = preps.map((p) => p.id);
    preparations.push(...preps);
    work.push(item);

    alerts.push({
      code: "quantity_estimated",
      severity: "info",
      message: `Cantidad estimada (${quantity}) desde menú · ${sample.dishLabel}`,
      dayDate: sample.dayDate,
      workId,
      fixHint: "Orders enriquecerán cantidades en fases posteriores.",
    });

    if (!sample.allergenHint) {
      alerts.push({
        code: "missing_production_data",
        severity: "warn",
        message: `Alérgenos incompletos · ${sample.dishLabel}`,
        dayDate: sample.dayDate,
        workId,
        fixHint: "Completa el plato en Dish Library o reemplázalo en Menu.",
      });
      item.status = "alert";
    }

    if (preps.some((p) => p.kind === "defrost")) {
      alerts.push({
        code: "defrost_requirement",
        severity: "warn",
        message: `Descongelado requerido · ${sample.dishLabel}`,
        dayDate: sample.dayDate,
        workId,
        fixHint: `Preparar el ${addDaysIso(sample.dayDate, -1)}.`,
      });
    }

    alerts.push({
      code: "cooking_deadline",
      severity: "info",
      message: `Deadline cocción · ${sample.dayDate} 10:00 UTC · ${sample.dishLabel}`,
      dayDate: sample.dayDate,
      workId,
    });
  }

  const days = weekDates(week.weekStart);
  const daysWithWork = new Set(work.map((w) => w.productionDay));
  for (const day of days) {
    if (!daysWithWork.has(day)) {
      alerts.push({
        code: "incomplete_week",
        severity: "warn",
        message: `Día sin trabajo de producción · ${day}`,
        dayDate: day,
        fixHint: "Completa el menú publicado o confirma que el día está cerrado.",
      });
    }
  }

  if (work.length < 3) {
    alerts.push({
      code: "insufficient_planning",
      severity: "warn",
      message: "Planificación de producción muy fina — revisa cobertura semanal.",
      fixHint: "Vuelve a Menu Planning si faltan días u ofertas.",
    });
  }

  const dayLoads: DayLoad[] = days.map((dayDate) => {
    const dayWork = work.filter((w) => w.productionDay === dayDate);
    const totalQuantity = dayWork.reduce((n, w) => n + w.quantity, 0);
    const batchCount = new Set(dayWork.map((w) => w.batchKey)).size;
    const alertCount = alerts.filter(
      (a) => a.dayDate === dayDate && a.severity !== "info",
    ).length;
    const overload = totalQuantity >= 12 || batchCount >= 8;
    if (overload) {
      alerts.push({
        code: "capacity_warning",
        severity: "warn",
        message: `Posible sobrecarga · ${dayDate} · ${totalQuantity} uds / ${batchCount} lotes`,
        dayDate,
        fixHint: "Revisa carga antes de confirmar handoff a Kitchen.",
      });
    }
    return {
      dayDate,
      workCount: dayWork.length,
      totalQuantity,
      batchCount,
      alertCount,
      overload,
    };
  });

  const now = new Date().toISOString();
  const plan: ProductionPlan = {
    id: `pp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    weekStart: week.weekStart,
    sourceWeekPlanId: week.id,
    sourceMenuStatus: week.status,
    status: "reviewed",
    work: work.sort((a, b) =>
      a.productionDay === b.productionDay
        ? a.dishLabel.localeCompare(b.dishLabel)
        : a.productionDay.localeCompare(b.productionDay),
    ),
    preparations: preparations.sort((a, b) =>
      a.preparationDate.localeCompare(b.preparationDate),
    ),
    alerts,
    dayLoads,
    confirmedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, plan: saveProductionPlan(plan) };
}
