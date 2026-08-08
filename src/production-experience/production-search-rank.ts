/**
 * PE002 — Experience-layer ranking for production search.
 *
 * Grammar: Semana → Día → Trabajo → Cantidad → Deadline → Kitchen
 * Operator language: day · load · batch · alert · prep — never IDs.
 */

import { dayLabel, formatWeekLabel, mondayIso } from "@/menu-experience/week-plan";
import type {
  ProductionAlert,
  ProductionPlan,
  ProductionWorkItem,
  PrePreparation,
} from "@/production-experience/production-plan";

export type ProductionSearchScope =
  | "week"
  | "day"
  | "work"
  | "batch"
  | "prep"
  | "alert";

export type ProductionSearchHit = {
  id: string;
  scope: ProductionSearchScope;
  weekStart: string;
  dayDate: string | null;
  title: string;
  workSummary: string;
  quantity: number;
  loadLabel: string;
  deadline: string | null;
  alertStatus: "none" | "info" | "warn" | "block";
  alertCount: number;
  prepCount: number;
  planStatus: ProductionPlan["status"];
  kitchenReady: boolean;
  overload: boolean;
  updatedAt: string | null;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function alertLevel(
  alerts: ProductionAlert[],
): ProductionSearchHit["alertStatus"] {
  if (alerts.some((a) => a.severity === "block")) return "block";
  if (alerts.some((a) => a.severity === "warn")) return "warn";
  if (alerts.some((a) => a.severity === "info")) return "info";
  return "none";
}

export function hitGlance(hit: ProductionSearchHit): string {
  const week = formatWeekLabel(hit.weekStart);
  const day = hit.dayDate ? ` · ${dayLabel(hit.dayDate)}` : "";
  return `${week}${day} · ${hit.title}`;
}

export function alertLabel(s: ProductionSearchHit["alertStatus"]): string {
  if (s === "block") return "Alerta bloqueante";
  if (s === "warn") return "Avisos";
  if (s === "info") return "Info";
  return "Sin alertas";
}

export function alertTone(
  s: ProductionSearchHit["alertStatus"],
): "positive" | "warning" | "info" | "neutral" {
  if (s === "none") return "positive";
  if (s === "info") return "info";
  return "warning";
}

export function buildProductionHits(
  plans: ProductionPlan[],
): ProductionSearchHit[] {
  const hits: ProductionSearchHit[] = [];

  for (const plan of plans) {
    const warnAlerts = plan.alerts.filter((a) => a.severity !== "info");
    const planAlert = alertLevel(plan.alerts);
    const totalQty = plan.work.reduce((n, w) => n + w.quantity, 0);
    const anyOverload = plan.dayLoads.some((d) => d.overload);

    hits.push({
      id: `week:${plan.weekStart}`,
      scope: "week",
      weekStart: plan.weekStart,
      dayDate: null,
      title: `Semana ${plan.weekStart}`,
      workSummary: `${plan.work.length} trabajos · ${plan.preparations.length} preps`,
      quantity: totalQty,
      loadLabel: anyOverload ? "Carga alta" : `${plan.work.length} bloques`,
      deadline: null,
      alertStatus: planAlert,
      alertCount: warnAlerts.length,
      prepCount: plan.preparations.length,
      planStatus: plan.status,
      kitchenReady: plan.status === "ready_for_kitchen",
      overload: anyOverload,
      updatedAt: plan.updatedAt,
    });

    for (const day of plan.dayLoads) {
      const dayWork = plan.work.filter((w) => w.productionDay === day.dayDate);
      const dayAlerts = plan.alerts.filter((a) => a.dayDate === day.dayDate);
      const dayPreps = plan.preparations.filter(
        (p) =>
          p.requiredUseDate === day.dayDate ||
          p.preparationDate === day.dayDate,
      );
      if (dayWork.length === 0 && day.workCount === 0) {
        // still index empty days with incomplete signal
      }
      hits.push({
        id: `day:${plan.weekStart}:${day.dayDate}`,
        scope: "day",
        weekStart: plan.weekStart,
        dayDate: day.dayDate,
        title: `${dayLabel(day.dayDate)} · producción`,
        workSummary:
          dayWork.length > 0
            ? dayWork
                .map((w) => w.dishLabel)
                .slice(0, 3)
                .join(" · ")
            : "Sin trabajo",
        quantity: day.totalQuantity,
        loadLabel: day.overload
          ? "Sobrecarga"
          : `${day.workCount} trabajos · ${day.batchCount} lotes`,
        deadline:
          dayWork[0]?.cookingDeadline?.slice(0, 16) ??
          `${day.dayDate}T10:00`,
        alertStatus: alertLevel(dayAlerts),
        alertCount: dayAlerts.filter((a) => a.severity !== "info").length,
        prepCount: dayPreps.length,
        planStatus: plan.status,
        kitchenReady: plan.status === "ready_for_kitchen",
        overload: day.overload,
        updatedAt: plan.updatedAt,
      });
    }

    for (const w of plan.work) {
      hits.push(workHit(plan, w));
    }

    const batches = new Map<string, ProductionWorkItem[]>();
    for (const w of plan.work) {
      const list = batches.get(w.batchKey) ?? [];
      list.push(w);
      batches.set(w.batchKey, list);
    }
    for (const [batchKey, items] of batches) {
      const sample = items[0]!;
      const qty = items.reduce((n, i) => n + i.quantity, 0);
      const related = plan.alerts.filter((a) =>
        items.some((i) => i.id === a.workId),
      );
      hits.push({
        id: `batch:${plan.weekStart}:${batchKey}`,
        scope: "batch",
        weekStart: plan.weekStart,
        dayDate: sample.productionDay,
        title: `Lote · ${sample.dishLabel}`,
        workSummary: batchKey,
        quantity: qty,
        loadLabel: `${items.length} línea(s)`,
        deadline: sample.cookingDeadline.slice(0, 16),
        alertStatus: alertLevel(related),
        alertCount: related.filter((a) => a.severity !== "info").length,
        prepCount: sample.prepIds.length,
        planStatus: plan.status,
        kitchenReady: plan.status === "ready_for_kitchen",
        overload: false,
        updatedAt: plan.updatedAt,
      });
    }

    for (const p of plan.preparations) {
      hits.push(prepHit(plan, p));
    }

    for (const a of plan.alerts.filter((x) => x.severity !== "info")) {
      hits.push({
        id: `alert:${plan.weekStart}:${a.code}:${a.workId ?? a.dayDate ?? a.message}`,
        scope: "alert",
        weekStart: plan.weekStart,
        dayDate: a.dayDate ?? null,
        title: a.message,
        workSummary: a.fixHint ?? a.code,
        quantity: 0,
        loadLabel: a.severity,
        deadline: null,
        alertStatus: a.severity === "block" ? "block" : "warn",
        alertCount: 1,
        prepCount: 0,
        planStatus: plan.status,
        kitchenReady: plan.status === "ready_for_kitchen",
        overload: a.code === "capacity_warning",
        updatedAt: plan.updatedAt,
      });
    }
  }

  return hits;
}

function workHit(
  plan: ProductionPlan,
  w: ProductionWorkItem,
): ProductionSearchHit {
  const related = plan.alerts.filter((a) => a.workId === w.id);
  return {
    id: `work:${plan.weekStart}:${w.id}`,
    scope: "work",
    weekStart: plan.weekStart,
    dayDate: w.productionDay,
    title: w.dishLabel,
    workSummary: `${w.quantity}${w.quantityEstimated ? "*" : ""} uds · ${w.status}`,
    quantity: w.quantity,
    loadLabel: w.status,
    deadline: w.cookingDeadline.slice(0, 16),
    alertStatus: alertLevel(related),
    alertCount: related.filter((a) => a.severity !== "info").length,
    prepCount: w.prepIds.length,
    planStatus: plan.status,
    kitchenReady: plan.status === "ready_for_kitchen",
    overload: false,
    updatedAt: plan.updatedAt,
  };
}

function prepHit(
  plan: ProductionPlan,
  p: PrePreparation,
): ProductionSearchHit {
  return {
    id: `prep:${plan.weekStart}:${p.id}`,
    scope: "prep",
    weekStart: plan.weekStart,
    dayDate: p.preparationDate,
    title: p.label,
    workSummary: `${p.kind} · uso ${p.requiredUseDate} · ${p.status}`,
    quantity: 0,
    loadLabel: p.status,
    deadline: p.requiredUseDate,
    alertStatus:
      p.status === "pending" ||
      p.status === "scheduled" ||
      p.status === "overdue" ||
      p.status === "blocked"
        ? "warn"
        : "none",
    alertCount:
      p.status === "ready" || p.status === "done" ? 0 : 1,
    prepCount: 1,
    planStatus: plan.status,
    kitchenReady: plan.status === "ready_for_kitchen",
    overload: false,
    updatedAt: plan.updatedAt,
  };
}

export function scoreProductionHit(
  hit: ProductionSearchHit,
  rawQuery: string,
): number {
  const q = normalize(rawQuery.trim());
  const current = mondayIso();
  let score = 0;

  if (hit.weekStart === current) score += 120;
  else if (hit.weekStart > current) score += 70;
  else score += 20;

  if (hit.overload) score += 55;
  if (hit.alertStatus === "block") score += 70;
  else if (hit.alertStatus === "warn") score += 50;
  else if (hit.alertStatus === "info") score += 15;

  if (hit.kitchenReady) score += 25;
  if (hit.scope === "day") score += 10;
  if (hit.scope === "work") score += 8;
  if (hit.scope === "alert") score += 20;
  if (hit.scope === "prep") score += 12;

  if (hit.updatedAt) {
    const age = Date.now() - Date.parse(hit.updatedAt);
    if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24) score += 35;
    else if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24 * 7) score += 20;
  }

  if (!q) return score;

  const hay = normalize(
    [
      hit.title,
      hit.workSummary,
      hit.loadLabel,
      hit.weekStart,
      hit.dayDate ?? "",
      hit.dayDate ? dayLabel(hit.dayDate) : "",
      hit.deadline ?? "",
      hit.scope,
      hit.planStatus,
      hit.kitchenReady ? "kitchen listo handoff" : "pendiente",
      hit.overload ? "sobrecarga carga alta" : "",
      hit.alertStatus !== "none" ? "alerta aviso" : "",
    ].join(" "),
  );

  if (hay.includes(q)) score += 200;
  const parts = q.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (hay.includes(part)) score += 40;
  }

  // date fragment: 08-03 or 2026-08
  if (hit.dayDate && normalize(hit.dayDate).includes(q)) score += 180;
  if (normalize(hit.weekStart).includes(q)) score += 160;

  return score;
}

export function rankProductionHits(
  hits: ProductionSearchHit[],
  query: string,
): ProductionSearchHit[] {
  return [...hits]
    .map((h) => ({ h, s: scoreProductionHit(h, query) }))
    .filter(({ s, h }) => {
      if (!query.trim()) return true;
      return s >= 40 || normalize(h.title).includes(normalize(query));
    })
    .sort((a, b) => b.s - a.s || b.h.weekStart.localeCompare(a.h.weekStart))
    .map(({ h }) => h);
}
