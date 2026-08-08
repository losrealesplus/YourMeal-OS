/**
 * PE005 — Production risks, deadlines & overload (Experience only).
 *
 * Warn early. Prioritize clearly. Do not over-alert.
 * Do not block without reason. Always offer a next step.
 */

import { addDaysIso, dayLabel, utcDateOnly } from "@/menu-experience/week-plan";
import { buildPrepViews } from "@/production-experience/prep-view";
import {
  getProductionPlan,
  saveProductionPlan,
  type ProductionPlan,
} from "@/production-experience/production-plan";

export type RiskUrgency = "now" | "soon" | "watch";

export type RiskNextAction = "adapt" | "preps" | "planning" | "handoff";

export type ProductionRisk = {
  id: string;
  code: string;
  severity: "block" | "warn" | "info";
  title: string;
  reason: string;
  weekStart: string;
  dayDate: string | null;
  deadline: string | null;
  urgency: RiskUrgency;
  workSummary: string;
  loadLabel: string;
  nextStep: string;
  nextAction: RiskNextAction;
  affectedPreps: number;
  kitchenImpact: string;
};

const RESOLVED_KEY = "ymos.pe.resolved_risks.v1";

function readResolved(): Record<string, string[]> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(RESOLVED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeResolved(map: Record<string, string[]>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(RESOLVED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function listResolvedRiskIds(weekStart: string): string[] {
  return readResolved()[weekStart] ?? [];
}

export function resolveRisk(weekStart: string, riskId: string): void {
  const map = readResolved();
  const cur = new Set(map[weekStart] ?? []);
  cur.add(riskId);
  map[weekStart] = [...cur];
  writeResolved(map);
}

export function clearResolvedRisksForTests(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(RESOLVED_KEY);
  }
}

function urgencyRank(u: RiskUrgency): number {
  if (u === "now") return 0;
  if (u === "soon") return 1;
  return 2;
}

function severityRank(s: ProductionRisk["severity"]): number {
  if (s === "block") return 0;
  if (s === "warn") return 1;
  return 2;
}

/** Build prioritized operational risks for a plan. */
export function buildProductionRisks(
  plan: ProductionPlan,
  today: string = utcDateOnly(),
): ProductionRisk[] {
  const risks: ProductionRisk[] = [];
  const prepViews = buildPrepViews(plan, today);
  const tomorrow = addDaysIso(today, 1);

  for (const a of plan.alerts) {
    if (a.severity === "info" && a.code === "quantity_estimated") continue;
    if (a.severity === "info" && a.code === "cooking_deadline") {
      // handled via work deadlines below for approaching
      continue;
    }
    const work = a.workId
      ? plan.work.find((w) => w.id === a.workId)
      : null;
    const dayLoad = a.dayDate
      ? plan.dayLoads.find((d) => d.dayDate === a.dayDate)
      : null;

    let nextAction: RiskNextAction = "adapt";
    let nextStep = a.fixHint ?? "Revisa el trabajo relacionado.";
    if (a.code === "defrost_requirement" || a.code === "preparation_deadline") {
      nextAction = "preps";
      nextStep = "Abre Preps y confirma o reprograma.";
    }
    if (a.code === "incomplete_week" || a.code === "insufficient_planning") {
      nextAction = "planning";
      nextStep = "Completa cobertura o confirma el día cerrado.";
    }
    if (a.code === "capacity_warning") {
      nextAction = "adapt";
      nextStep = "Reequilibra carga: mueve o reduce cantidad.";
    }

    risks.push({
      id: `alert:${a.code}:${a.workId ?? a.dayDate ?? a.message}`,
      code: a.code,
      severity: a.severity === "info" ? "info" : a.severity,
      title: a.message,
      reason: a.fixHint ?? a.code,
      weekStart: plan.weekStart,
      dayDate: a.dayDate ?? work?.productionDay ?? null,
      deadline: work?.cookingDeadline?.slice(0, 16) ?? null,
      urgency:
        a.severity === "block"
          ? "now"
          : a.code === "capacity_warning"
            ? "soon"
            : "watch",
      workSummary: work
        ? `${work.dishLabel} · ${work.quantity} uds`
        : a.dayDate
          ? `Día ${dayLabel(a.dayDate)}`
          : "Semana",
      loadLabel: dayLoad
        ? `${dayLoad.totalQuantity} uds · ${dayLoad.batchCount} lotes`
        : "—",
      nextStep,
      nextAction,
      affectedPreps: prepViews.filter(
        (p) => p.prep.workId === a.workId || p.prep.requiredUseDate === a.dayDate,
      ).length,
      kitchenImpact:
        a.severity === "warn" || a.severity === "block"
          ? "Puede retrasar o ensuciar el handoff a Kitchen."
          : "Informativo — revisar si aplica.",
    });
  }

  for (const v of prepViews) {
    if (v.effectiveStatus === "overdue") {
      risks.push({
        id: `prep-overdue:${v.prep.id}`,
        code: "overdue_preparation",
        severity: "warn",
        title: `Prep vencida · ${v.prep.label}`,
        reason: `Debía prepararse el ${v.prep.preparationDate}`,
        weekStart: plan.weekStart,
        dayDate: v.prep.preparationDate,
        deadline: v.prep.preparationDate,
        urgency: "now",
        workSummary: v.relatedDish,
        loadLabel: `${v.prep.requiredQuantity ?? v.work?.quantity ?? "?"} uds`,
        nextStep: "Marca lista o reprograma en Preps.",
        nextAction: "preps",
        affectedPreps: 1,
        kitchenImpact: `Uso previsto ${v.prep.requiredUseDate} en riesgo.`,
      });
    } else if (v.effectiveStatus === "blocked") {
      risks.push({
        id: `prep-blocked:${v.prep.id}`,
        code: "incomplete_preparation",
        severity: "warn",
        title: `Prep bloqueada · ${v.prep.label}`,
        reason: "Fecha de prep posterior al uso o estado bloqueado",
        weekStart: plan.weekStart,
        dayDate: v.prep.preparationDate,
        deadline: v.prep.requiredUseDate,
        urgency: "soon",
        workSummary: v.relatedDish,
        loadLabel: "—",
        nextStep: "Reprograma la prep antes del día de uso.",
        nextAction: "preps",
        affectedPreps: 1,
        kitchenImpact: "Kitchen no puede asumir esta prep como lista.",
      });
    } else if (
      v.effectiveStatus === "scheduled" &&
      v.prep.preparationDate <= tomorrow &&
      v.prep.preparationDate >= today
    ) {
      risks.push({
        id: `prep-due:${v.prep.id}`,
        code: "deadline_approaching",
        severity: "info",
        title: `Prep próxima · ${v.prep.label}`,
        reason: `Preparar el ${v.prep.preparationDate}`,
        weekStart: plan.weekStart,
        dayDate: v.prep.preparationDate,
        deadline: v.prep.preparationDate,
        urgency: v.prep.preparationDate === today ? "now" : "soon",
        workSummary: v.relatedDish,
        loadLabel: `${v.prep.requiredQuantity ?? v.work?.quantity ?? "?"} uds`,
        nextStep: "Confirma prep o ajusta fecha.",
        nextAction: "preps",
        affectedPreps: 1,
        kitchenImpact: `Afecta ejecución del ${v.prep.requiredUseDate}.`,
      });
    }
  }

  for (const w of plan.work) {
    const dueDay = w.cookingDeadline.slice(0, 10);
    if (dueDay >= today && dueDay <= tomorrow) {
      risks.push({
        id: `cook-deadline:${w.id}`,
        code: "deadline_approaching",
        severity: dueDay === today ? "warn" : "info",
        title: `Deadline cocción · ${w.dishLabel}`,
        reason: `Vence ${w.cookingDeadline.slice(0, 16)}`,
        weekStart: plan.weekStart,
        dayDate: w.productionDay,
        deadline: w.cookingDeadline.slice(0, 16),
        urgency: dueDay === today ? "now" : "soon",
        workSummary: `${w.quantity}${w.quantityEstimated ? "*" : ""} uds · ${w.status}`,
        loadLabel: (() => {
          const load = plan.dayLoads.find((d) => d.dayDate === w.productionDay);
          return load ? `${load.totalQuantity} uds día` : "—";
        })(),
        nextStep: "Ajusta deadline o mueve trabajo en Adaptación.",
        nextAction: "adapt",
        affectedPreps: prepViews.filter((p) => p.prep.workId === w.id).length,
        kitchenImpact: `Kitchen debe ejecutar el ${w.productionDay}.`,
      });
    }
  }

  if (
    plan.work.length > 0 &&
    plan.status !== "ready_for_kitchen" &&
    plan.alerts.some((a) => a.severity === "warn" || a.severity === "block")
  ) {
    risks.push({
      id: `handoff-incomplete:${plan.weekStart}`,
      code: "incomplete_handoff",
      severity: "warn",
      title: "Handoff Kitchen incompleto",
      reason: "Hay avisos abiertos y el plan no está Ready for Kitchen",
      weekStart: plan.weekStart,
      dayDate: null,
      deadline: null,
      urgency: "soon",
      workSummary: `${plan.work.length} trabajos`,
      loadLabel: `${plan.dayLoads.filter((d) => d.overload).length} días sobrecarga`,
      nextStep: "Resuelve avisos y confirma el plan en Planning.",
      nextAction: "handoff",
      affectedPreps: prepViews.filter((p) => p.overdue || p.blocked).length,
      kitchenImpact: "No entregar a Kitchen hasta revisar.",
    });
  }

  // Dedupe by id, prioritize higher severity
  const byId = new Map<string, ProductionRisk>();
  for (const r of risks) {
    const prev = byId.get(r.id);
    if (!prev || severityRank(r.severity) < severityRank(prev.severity)) {
      byId.set(r.id, r);
    }
  }

  const resolved = new Set(listResolvedRiskIds(plan.weekStart));
  return [...byId.values()]
    .filter((r) => !resolved.has(r.id))
    .filter((r) => r.severity !== "info" || r.urgency !== "watch")
    .sort(
      (a, b) =>
        severityRank(a.severity) - severityRank(b.severity) ||
        urgencyRank(a.urgency) - urgencyRank(b.urgency) ||
        (a.deadline ?? "").localeCompare(b.deadline ?? ""),
    );
}

/** Active risks only (warn/block + approaching now/soon). */
export function activeProductionRisks(
  plan: ProductionPlan,
  today?: string,
): ProductionRisk[] {
  return buildProductionRisks(plan, today).filter(
    (r) =>
      r.severity === "block" ||
      r.severity === "warn" ||
      r.urgency === "now" ||
      r.urgency === "soon",
  );
}

export function acknowledgePlanReviewed(weekStart: string): ProductionPlan | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  return saveProductionPlan({ ...plan, status: "reviewed" });
}

export function riskCodeLabel(code: string): string {
  switch (code) {
    case "missing_production_data":
      return "Datos incompletos";
    case "incomplete_preparation":
      return "Prep incompleta";
    case "overdue_preparation":
      return "Prep vencida";
    case "deadline_approaching":
      return "Deadline cercano";
    case "capacity_warning":
      return "Sobrecarga";
    case "incomplete_week":
      return "Hueco planificación";
    case "insufficient_planning":
      return "Planificación fina";
    case "defrost_requirement":
      return "Descongelado";
    case "incomplete_handoff":
      return "Handoff incompleto";
    default:
      return code;
  }
}
