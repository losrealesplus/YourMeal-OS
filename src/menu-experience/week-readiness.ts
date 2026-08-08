/**
 * ME005 — Week publication readiness (Experience only).
 *
 * Warn honestly. Do not block without reason.
 * Planning ends when the week is reviewed, validated, and published.
 */

import {
  activeSlots,
  dayLabel,
  slotsByDay,
  weekDates,
  type WeekPlan,
  type WeekDishSlot,
} from "@/menu-experience/week-plan";

export type ReadinessSeverity = "block" | "warn" | "info";

export type ReadinessIssueCode =
  | "empty_week"
  | "missing_day"
  | "thin_coverage"
  | "macro_gap"
  | "allergen_gap"
  | "unpublished_changes"
  | "session_only_dishes"
  | "already_published";

export type ReadinessIssue = {
  code: ReadinessIssueCode;
  severity: ReadinessSeverity;
  message: string;
  dayDate?: string;
  slotId?: string;
  dishLabel?: string;
  fixHint?: string;
};

export type WeekReadiness = {
  weekStart: string;
  status: WeekPlan["status"];
  activeCount: number;
  daysCovered: number;
  daysTotal: number;
  daysMissing: string[];
  macroGaps: number;
  allergenGaps: number;
  sessionOnlyCount: number;
  canPublish: boolean;
  readyForOrders: boolean;
  readyForProduction: boolean;
  confidence: "high" | "medium" | "low";
  issues: ReadinessIssue[];
  daySummaries: DayReadiness[];
};

export type DayReadiness = {
  dayDate: string;
  label: string;
  activeCount: number;
  empty: boolean;
  macroGaps: number;
  allergenGaps: number;
  slots: WeekDishSlot[];
};

function isSessionDish(slot: WeekDishSlot): boolean {
  return slot.dishId.startsWith("exp:");
}

function hasMacroHint(slot: WeekDishSlot): boolean {
  return Boolean(slot.macrosHint && slot.macrosHint.trim());
}

function hasAllergenHint(slot: WeekDishSlot): boolean {
  return Boolean(slot.allergenHint && slot.allergenHint.trim());
}

export function assessWeekReadiness(plan: WeekPlan): WeekReadiness {
  const days = weekDates(plan.weekStart);
  const byDay = slotsByDay(plan);
  const active = activeSlots(plan);
  const issues: ReadinessIssue[] = [];

  const daySummaries: DayReadiness[] = days.map((dayDate) => {
    const slots = (byDay[dayDate] ?? []).filter((s) => !s.disabled);
    let macroGaps = 0;
    let allergenGaps = 0;
    for (const s of slots) {
      if (!hasMacroHint(s)) macroGaps += 1;
      if (!hasAllergenHint(s)) allergenGaps += 1;
    }
    return {
      dayDate,
      label: dayLabel(dayDate),
      activeCount: slots.length,
      empty: slots.length === 0,
      macroGaps,
      allergenGaps,
      slots,
    };
  });

  const daysMissing = daySummaries.filter((d) => d.empty).map((d) => d.dayDate);
  const daysCovered = daySummaries.filter((d) => !d.empty).length;
  const macroGaps = daySummaries.reduce((n, d) => n + d.macroGaps, 0);
  const allergenGaps = daySummaries.reduce((n, d) => n + d.allergenGaps, 0);
  const sessionOnlyCount = active.filter(isSessionDish).length;

  if (active.length === 0) {
    issues.push({
      code: "empty_week",
      severity: "block",
      message: "La semana no tiene platos activos.",
      fixHint: "Añade al menos un plato desde la Dish Library.",
    });
  }

  for (const day of daySummaries) {
    if (day.empty) {
      issues.push({
        code: "missing_day",
        severity: "warn",
        message: `${day.label} · sin platos activos`,
        dayDate: day.dayDate,
        fixHint: "Añadir plato o duplicar desde otro día.",
      });
    }
  }

  if (active.length > 0 && daysCovered > 0 && daysCovered < 3) {
    issues.push({
      code: "thin_coverage",
      severity: "warn",
      message: `Cobertura baja: solo ${daysCovered} día(s) con menú.`,
      fixHint: "Completa más días antes de publicar si la operación lo necesita.",
    });
  }

  for (const slot of active) {
    if (!hasMacroHint(slot)) {
      issues.push({
        code: "macro_gap",
        severity: "warn",
        message: `Macros incompletos · ${slot.dishLabel}`,
        dayDate: slot.dayDate,
        slotId: slot.id,
        dishLabel: slot.dishLabel,
        fixHint: "Reemplaza por un plato con macros conocidos en la biblioteca.",
      });
    }
    if (!hasAllergenHint(slot)) {
      issues.push({
        code: "allergen_gap",
        severity: "warn",
        message: `Alérgenos incompletos · ${slot.dishLabel}`,
        dayDate: slot.dayDate,
        slotId: slot.id,
        dishLabel: slot.dishLabel,
        fixHint: "Reemplaza por un plato con alérgenos conocidos.",
      });
    }
  }

  if (sessionOnlyCount > 0) {
    issues.push({
      code: "session_only_dishes",
      severity: "info",
      message: `${sessionOnlyCount} plato(s) solo de sesión (no durable).`,
      fixHint: "Usa platos de la Dish Library para publicación durable.",
    });
  }

  if (plan.status === "draft" || plan.status === "preview") {
    issues.push({
      code: "unpublished_changes",
      severity: plan.status === "preview" ? "info" : "warn",
      message:
        plan.status === "preview"
          ? "Vista previa lista — cambios aún no publicados."
          : "Hay cambios sin publicar.",
      fixHint: "Revisa avisos y publica cuando tengas confianza.",
    });
  }

  if (
    plan.status === "published_session" ||
    plan.status === "published_durable"
  ) {
    issues.push({
      code: "already_published",
      severity: "info",
      message:
        plan.status === "published_durable"
          ? "Ya publicada (durable) — lista para Orders y Production."
          : "Publicada en sesión — Facade durable pendiente.",
    });
  }

  const canPublish = active.length > 0;
  const readyForOrders =
    plan.status === "published_durable" || plan.status === "published_session";
  const readyForProduction = readyForOrders;

  const warnCount = issues.filter((i) => i.severity === "warn").length;
  const confidence: WeekReadiness["confidence"] =
    !canPublish || warnCount >= 5
      ? "low"
      : warnCount >= 2
        ? "medium"
        : "high";

  return {
    weekStart: plan.weekStart,
    status: plan.status,
    activeCount: active.length,
    daysCovered,
    daysTotal: days.length,
    daysMissing,
    macroGaps,
    allergenGaps,
    sessionOnlyCount,
    canPublish,
    readyForOrders,
    readyForProduction,
    confidence,
    issues,
    daySummaries,
  };
}

/** Cap issue list for UI — keep blockers + first N warns. */
export function prioritizeIssues(
  issues: ReadinessIssue[],
  limit = 12,
): ReadinessIssue[] {
  const order: Record<ReadinessSeverity, number> = {
    block: 0,
    warn: 1,
    info: 2,
  };
  return [...issues]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit);
}
