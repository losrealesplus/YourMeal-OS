/**
 * PE001 — Executable work documents (not decorative reports).
 * CSV download + print-oriented text. Browser print-to-PDF for PDF path.
 */

import { dayLabel, formatWeekLabel } from "@/menu-experience/week-plan";
import {
  totalQuantity,
  type ProductionPlan,
} from "@/production-experience/production-plan";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Excel-friendly CSV of production work lines. */
export function productionPlanToCsv(plan: ProductionPlan): string {
  const header = [
    "production_day",
    "day_label",
    "dish",
    "quantity",
    "batch",
    "status",
    "cooking_deadline",
    "preparation_deadline",
    "allergens",
    "quantity_estimated",
  ];
  const rows = plan.work.map((w) =>
    [
      w.productionDay,
      dayLabel(w.productionDay),
      w.dishLabel,
      String(w.quantity),
      w.batchKey,
      w.status,
      w.cookingDeadline,
      w.preparationDeadline,
      w.allergenHint ?? "",
      w.quantityEstimated ? "yes" : "no",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadProductionPlanCsv(plan: ProductionPlan): void {
  const csv = productionPlanToCsv(plan);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-plan-${plan.weekStart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Plain-text handoff sheet for print / print-to-PDF. */
export function productionPlanPrintHtml(plan: ProductionPlan): string {
  const workLines = plan.work
    .map(
      (w) =>
        `<tr>
          <td>${dayLabel(w.productionDay)} ${w.productionDay}</td>
          <td>${escapeHtml(w.dishLabel)}</td>
          <td>${w.quantity}${w.quantityEstimated ? "*" : ""}</td>
          <td>${escapeHtml(w.batchKey)}</td>
          <td>${w.cookingDeadline.slice(0, 16)}</td>
          <td>${escapeHtml(w.allergenHint ?? "—")}</td>
        </tr>`,
    )
    .join("");

  const prepLines = plan.preparations
    .map(
      (p) =>
        `<tr>
          <td>${p.preparationDate}</td>
          <td>${escapeHtml(p.label)}</td>
          <td>${p.requiredUseDate}</td>
          <td>${p.status}</td>
        </tr>`,
    )
    .join("");

  const alertLines = plan.alerts
    .filter((a) => a.severity !== "info")
    .map((a) => `<li><strong>${a.severity}</strong> — ${escapeHtml(a.message)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Plan de producción · ${plan.weekStart}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 20px 0 8px; }
    p, li { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f4; }
    .meta { color: #555; margin-bottom: 16px; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Plan de producción</h1>
  <p class="meta">${formatWeekLabel(plan.weekStart)} · ${plan.work.length} trabajos · ${totalQuantity(plan)} uds · estado ${plan.status}</p>
  <p class="meta">Handoff Kitchen — no reabrir Orders. * cantidad estimada desde menú publicado.</p>
  <h2>Trabajo</h2>
  <table>
    <thead>
      <tr>
        <th>Día</th><th>Plato / lote</th><th>Cant.</th><th>Batch</th><th>Deadline</th><th>Alérgenos</th>
      </tr>
    </thead>
    <tbody>${workLines}</tbody>
  </table>
  <h2>Pre-preparaciones</h2>
  <table>
    <thead>
      <tr><th>Prep date</th><th>Trabajo</th><th>Uso</th><th>Estado</th></tr>
    </thead>
    <tbody>${prepLines || "<tr><td colspan='4'>Sin pre-preparaciones</td></tr>"}</tbody>
  </table>
  <h2>Alertas</h2>
  <ul>${alertLines || "<li>Sin alertas operativas</li>"}</ul>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printProductionPlan(plan: ProductionPlan): void {
  const html = productionPlanPrintHtml(plan);
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}
