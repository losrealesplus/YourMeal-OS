/**
 * PE006 — Kitchen Handoff (Experience only).
 *
 * Production decides what work must be executed.
 * Kitchen executes that work.
 * The handoff transfers responsibility — it does not create new planning.
 *
 * Honesty: never invent customer / order / instruction substrate.
 */

import {
  buildPrepViews,
  prepKindLabel,
  prepStatusLabel,
  type PrepView,
} from "@/production-experience/prep-view";
import {
  getProductionPlan,
  saveProductionPlan,
  totalQuantity,
  type ProductionPlan,
  type ProductionWorkItem,
} from "@/production-experience/production-plan";
import { dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";

export type HandoffReadiness = "ready" | "ready_with_warnings" | "blocked";

export type HandoffNavAction = "planning" | "alerts" | "preps" | "adapt";

export type HandoffWarning = {
  id: string;
  code: string;
  severity: "block" | "warn" | "info";
  message: string;
  fixHint: string;
  nextAction: HandoffNavAction;
};

export type HandoffWorkLine = {
  workId: string;
  productionDay: string;
  dayLabel: string;
  dishLabel: string;
  quantity: number;
  quantityEstimated: boolean;
  batchKey: string;
  cookingDeadline: string;
  preparationDeadline: string;
  requiredPreps: string;
  prepStatusSummary: string;
  allergenHint: string | null;
  macrosHint: string | null;
  priority: "high" | "normal" | "low";
  /** Only real operational notes from available fields — never invented. */
  operationalNotes: string;
  /** Honest absence when Experience has no Order substrate. */
  customerLabel: string | null;
  orderRef: string | null;
  specialInstruction: string | null;
  dietaryHint: string | null;
};

export type KitchenHandoffView = {
  weekStart: string;
  weekLabel: string;
  planStatus: ProductionPlan["status"];
  readiness: HandoffReadiness;
  readinessReason: string;
  workCount: number;
  totalQuantity: number;
  warningCount: number;
  blockCount: number;
  lines: HandoffWorkLine[];
  warnings: HandoffWarning[];
  alreadyHandedOff: boolean;
};

function prepWorst(
  views: PrepView[],
): { summary: string; labels: string; priority: "high" | "normal" | "low" } {
  if (views.length === 0) {
    return { summary: "Sin preps", labels: "—", priority: "normal" };
  }
  const rank: Record<string, number> = {
    blocked: 0,
    overdue: 1,
    pending: 2,
    scheduled: 3,
    ready: 4,
    done: 5,
  };
  const sorted = [...views].sort(
    (a, b) =>
      (rank[a.effectiveStatus] ?? 9) - (rank[b.effectiveStatus] ?? 9),
  );
  const worst = sorted[0]!;
  const labels = views
    .map(
      (v) =>
        `${prepKindLabel(v.prep.kind)}:${prepStatusLabel(v.effectiveStatus)}`,
    )
    .join(" · ");
  const priority =
    worst.effectiveStatus === "overdue" || worst.effectiveStatus === "blocked"
      ? "high"
      : worst.priority;
  return {
    summary: prepStatusLabel(worst.effectiveStatus),
    labels,
    priority,
  };
}

function lineForWork(
  plan: ProductionPlan,
  w: ProductionWorkItem,
  prepViews: PrepView[],
): HandoffWorkLine {
  const related = prepViews.filter((p) => p.prep.workId === w.id);
  const prep = prepWorst(related);
  const notes: string[] = [];
  if (w.quantityEstimated) notes.push("Cantidad estimada desde menú publicado");
  if (w.macrosHint) notes.push(`Macros: ${w.macrosHint}`);
  if (related.some((p) => p.prep.kind === "defrost")) {
    notes.push("Requiere descongelado previo");
  }

  return {
    workId: w.id,
    productionDay: w.productionDay,
    dayLabel: dayLabel(w.productionDay),
    dishLabel: w.dishLabel,
    quantity: w.quantity,
    quantityEstimated: w.quantityEstimated,
    batchKey: w.batchKey,
    cookingDeadline: w.cookingDeadline.slice(0, 16),
    preparationDeadline: w.preparationDeadline.slice(0, 10),
    requiredPreps: prep.labels,
    prepStatusSummary: prep.summary,
    allergenHint: w.allergenHint ?? null,
    macrosHint: w.macrosHint ?? null,
    priority: prep.priority,
    operationalNotes: notes.length ? notes.join(" · ") : "—",
    // Experience honesty: Order/Customer context not on this substrate
    customerLabel: null,
    orderRef: null,
    specialInstruction: null,
    dietaryHint: w.macrosHint ?? null,
  };
}

/** Build readiness + executable handoff lines for a production plan. */
export function buildKitchenHandoff(
  plan: ProductionPlan,
  today?: string,
): KitchenHandoffView {
  const prepViews = buildPrepViews(plan, today);
  const warnings: HandoffWarning[] = [];

  if (plan.work.length === 0) {
    warnings.push({
      id: "no-work",
      code: "incomplete_production_data",
      severity: "block",
      message: "No hay trabajo de producción para transferir",
      fixHint: "Genera o completa el plan en Planning.",
      nextAction: "planning",
    });
  }

  for (const a of plan.alerts) {
    if (a.severity === "info" && a.code === "quantity_estimated") continue;
    if (a.severity === "info") continue;
    warnings.push({
      id: `alert:${a.code}:${a.workId ?? a.dayDate ?? a.message}`,
      code: a.code,
      severity: a.severity,
      message: a.message,
      fixHint: a.fixHint ?? "Revisa alertas de producción.",
      nextAction:
        a.code === "defrost_requirement" || a.code === "preparation_deadline"
          ? "preps"
          : a.code === "incomplete_week" || a.code === "insufficient_planning"
            ? "planning"
            : a.code === "capacity_warning"
              ? "adapt"
              : "alerts",
    });
  }

  for (const v of prepViews) {
    if (v.effectiveStatus === "overdue") {
      warnings.push({
        id: `prep-overdue:${v.prep.id}`,
        code: "overdue_preparation",
        severity: "warn",
        message: `Prep vencida · ${v.prep.label}`,
        fixHint: "Marca lista o reprograma en Preps antes del handoff.",
        nextAction: "preps",
      });
    } else if (v.effectiveStatus === "blocked") {
      warnings.push({
        id: `prep-blocked:${v.prep.id}`,
        code: "missing_preparation",
        severity: "warn",
        message: `Prep bloqueada · ${v.prep.label}`,
        fixHint: "Corrige la prep antes de transferir a Kitchen.",
        nextAction: "preps",
      });
    } else if (
      v.effectiveStatus === "pending" ||
      v.effectiveStatus === "scheduled"
    ) {
      warnings.push({
        id: `prep-open:${v.prep.id}`,
        code: "missing_preparation",
        severity: "info",
        message: `Prep pendiente · ${v.prep.label}`,
        fixHint: "Kitchen debe saber que esta prep aún no está lista.",
        nextAction: "preps",
      });
    }
  }

  // Deduplicate by id
  const byId = new Map<string, HandoffWarning>();
  for (const w of warnings) {
    const prev = byId.get(w.id);
    if (
      !prev ||
      (w.severity === "block" && prev.severity !== "block") ||
      (w.severity === "warn" && prev.severity === "info")
    ) {
      byId.set(w.id, w);
    }
  }
  const unique = [...byId.values()];

  // Cap info noise: keep info only if few warn/block
  const material = unique.filter((w) => w.severity !== "info");
  const info = unique.filter((w) => w.severity === "info").slice(0, 6);
  const shown = [...material, ...info].sort((a, b) => {
    const rank = { block: 0, warn: 1, info: 2 } as const;
    return rank[a.severity] - rank[b.severity];
  });

  const blockCount = shown.filter((w) => w.severity === "block").length;
  const warnCount = shown.filter((w) => w.severity === "warn").length;

  let readiness: HandoffReadiness = "ready";
  let readinessReason = "Trabajo listo para transferir a Kitchen.";
  if (blockCount > 0 || plan.work.length === 0) {
    readiness = "blocked";
    readinessReason =
      shown.find((w) => w.severity === "block")?.message ??
      "Handoff bloqueado — resuelve los avisos bloqueantes.";
  } else if (warnCount > 0) {
    readiness = "ready_with_warnings";
    readinessReason =
      "Puedes confirmar con avisos explícitos — Kitchen verá los riesgos.";
  }

  const lines = [...plan.work]
    .sort(
      (a, b) =>
        a.productionDay.localeCompare(b.productionDay) ||
        a.dishLabel.localeCompare(b.dishLabel),
    )
    .map((w) => lineForWork(plan, w, prepViews));

  return {
    weekStart: plan.weekStart,
    weekLabel: formatWeekLabel(plan.weekStart),
    planStatus: plan.status,
    readiness,
    readinessReason,
    workCount: plan.work.length,
    totalQuantity: totalQuantity(plan),
    warningCount: warnCount + blockCount,
    blockCount,
    lines,
    warnings: shown,
    alreadyHandedOff: plan.status === "ready_for_kitchen",
  };
}

export type ConfirmHandoffResult =
  | { ok: true; plan: ProductionPlan; readiness: HandoffReadiness }
  | {
      ok: false;
      reason: string;
      readiness: HandoffReadiness;
    };

/**
 * Confirm responsibility transfer to Kitchen.
 * Does not invent data. Does not open Kitchen execution.
 */
export function confirmKitchenHandoff(
  weekStart: string,
  options: { acknowledgeWarnings?: boolean } = {},
): ConfirmHandoffResult {
  const plan = getProductionPlan(weekStart);
  if (!plan) {
    return {
      ok: false,
      reason: "No hay plan de producción para esta semana.",
      readiness: "blocked",
    };
  }

  const view = buildKitchenHandoff(plan);
  if (view.readiness === "blocked") {
    return {
      ok: false,
      reason: view.readinessReason,
      readiness: "blocked",
    };
  }
  if (
    view.readiness === "ready_with_warnings" &&
    !options.acknowledgeWarnings
  ) {
    return {
      ok: false,
      reason:
        "Hay avisos abiertos. Revisa Preps/Alertas o confirma asumiendo avisos.",
      readiness: "ready_with_warnings",
    };
  }

  const next = saveProductionPlan({
    ...plan,
    status: "ready_for_kitchen",
    confirmedAt: new Date().toISOString(),
    work: plan.work.map((w) => ({ ...w, status: "handed_off" as const })),
  });

  return { ok: true, plan: next, readiness: view.readiness };
}

export function readinessLabel(r: HandoffReadiness): string {
  if (r === "ready") return "Ready";
  if (r === "ready_with_warnings") return "Ready with warnings";
  return "Blocked";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Execution-first CSV for Kitchen handoff. */
export function kitchenHandoffToCsv(view: KitchenHandoffView): string {
  const header = [
    "production_day",
    "dish",
    "quantity",
    "batch",
    "cooking_deadline",
    "required_preps",
    "prep_status",
    "allergens",
    "dietary",
    "priority",
    "notes",
    "customer",
    "order_ref",
    "special_instruction",
  ];
  const rows = view.lines.map((l) =>
    [
      l.productionDay,
      l.dishLabel,
      String(l.quantity) + (l.quantityEstimated ? "*" : ""),
      l.batchKey,
      l.cookingDeadline,
      l.requiredPreps,
      l.prepStatusSummary,
      l.allergenHint ?? "",
      l.dietaryHint ?? "",
      l.priority,
      l.operationalNotes,
      l.customerLabel ?? "",
      l.orderRef ?? "",
      l.specialInstruction ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadKitchenHandoffCsv(view: KitchenHandoffView): void {
  const csv = kitchenHandoffToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitchen-handoff-${view.weekStart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Print / print-to-PDF handoff — execution clarity over decoration. */
export function kitchenHandoffPrintHtml(view: KitchenHandoffView): string {
  const workLines = view.lines
    .map(
      (l) =>
        `<tr>
          <td>${escapeHtml(l.dayLabel)} ${l.productionDay}</td>
          <td>${escapeHtml(l.dishLabel)}</td>
          <td>${l.quantity}${l.quantityEstimated ? "*" : ""}</td>
          <td>${escapeHtml(l.batchKey)}</td>
          <td>${escapeHtml(l.cookingDeadline)}</td>
          <td>${escapeHtml(l.requiredPreps)}</td>
          <td>${escapeHtml(l.prepStatusSummary)}</td>
          <td>${escapeHtml(l.allergenHint ?? "—")}</td>
          <td>${escapeHtml(l.operationalNotes)}</td>
        </tr>`,
    )
    .join("");

  const warnLines = view.warnings
    .filter((w) => w.severity !== "info")
    .map(
      (w) =>
        `<li><strong>${w.severity}</strong> — ${escapeHtml(w.message)} · ${escapeHtml(w.fixHint)}</li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Kitchen Handoff · ${view.weekStart}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 18px 0 6px; }
    p, li { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #bbb; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
    .meta { color: #444; margin-bottom: 12px; }
    .ready { font-weight: 600; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <h1>Kitchen Handoff</h1>
  <p class="meta ready">${escapeHtml(view.weekLabel)} · ${readinessLabel(view.readiness)} · ${view.workCount} trabajos · ${view.totalQuantity} uds</p>
  <p class="meta">Production → Kitchen · transferencia de responsabilidad · no replanificar aquí</p>
  <p class="meta">${escapeHtml(view.readinessReason)}</p>
  <h2>Trabajo a ejecutar</h2>
  <table>
    <thead>
      <tr>
        <th>Día</th><th>Qué</th><th>Cuánto</th><th>Batch</th><th>Cuándo</th>
        <th>Prep requerida</th><th>Prep status</th><th>Alérgenos</th><th>Notas</th>
      </tr>
    </thead>
    <tbody>${workLines || "<tr><td colspan='9'>Sin trabajo</td></tr>"}</tbody>
  </table>
  <h2>Avisos</h2>
  <ul>${warnLines || "<li>Sin avisos materiales</li>"}</ul>
  <p class="meta">* cantidad estimada · Cliente/pedido: no disponible en este substrate (honestidad Experience)</p>
</body>
</html>`;
}

export function printKitchenHandoff(view: KitchenHandoffView): void {
  const html = kitchenHandoffPrintHtml(view);
  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}
