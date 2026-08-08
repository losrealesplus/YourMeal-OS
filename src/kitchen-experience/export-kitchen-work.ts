/**
 * KE001 — Kitchen-friendly print / CSV (execution clarity).
 */

import type {
  KitchenExecutionCard,
  TodaysKitchenWork,
} from "@/kitchen-experience/today-work";
import { kitchenWorkStatusLabel } from "@/kitchen-experience/today-work";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function kitchenWorkToCsv(view: TodaysKitchenWork): string {
  const header = [
    "day",
    "dish",
    "production_quantity",
    "execution_quantity",
    "batch",
    "deadline",
    "priority",
    "status",
    "preps",
    "prep_status",
    "allergens",
    "dietary",
    "notes",
    "customer",
    "order_ref",
    "special_instruction",
    "execution_adapted",
  ];
  const rows = view.cards.map((c) =>
    [
      c.productionDay,
      c.dishLabel,
      String(c.quantity) + (c.quantityEstimated ? "*" : ""),
      String(
        c.executionQuantity != null ? c.executionQuantity : c.quantity,
      ),
      c.batchKey,
      c.cookingDeadline,
      c.priority,
      c.status,
      c.requiredPreps,
      c.prepStatusSummary,
      c.allergenHint ?? "",
      c.dietaryHint ?? "",
      c.operationalNotes,
      c.customerLabel ?? "",
      c.orderRef ?? "",
      c.specialInstruction ?? "",
      c.executionAdapted ? "session" : "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadKitchenWorkCsv(view: TodaysKitchenWork): void {
  const csv = kitchenWorkToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitchen-today-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function kitchenWorkPrintHtml(view: TodaysKitchenWork): string {
  const rows = view.cards
    .map(
      (c: KitchenExecutionCard) =>
        `<tr>
          <td>${escapeHtml(c.dishLabel)}</td>
          <td>${c.executionQuantity != null ? c.executionQuantity : c.quantity}${c.quantityEstimated ? "*" : ""}${c.executionQuantity != null && c.executionQuantity !== c.quantity ? ` (Prod ${c.quantity})` : ""}</td>
          <td>${escapeHtml(c.batchKey)}</td>
          <td>${escapeHtml(c.cookingDeadline)}</td>
          <td>${escapeHtml(kitchenWorkStatusLabel(c.status))}</td>
          <td>${escapeHtml(c.requiredPreps)}</td>
          <td>${escapeHtml(c.allergenHint ?? "—")}</td>
          <td>${escapeHtml(c.dietaryHint ?? "—")}</td>
          <td>${escapeHtml(c.operationalNotes)}</td>
          <td>${escapeHtml(c.customerLabel ?? "n/d")}</td>
          <td>${escapeHtml(c.specialInstruction ?? "n/d")}</td>
        </tr>`,
    )
    .join("");

  const warns = view.warnings
    .map(
      (w) =>
        `<li><strong>${w.severity}</strong> — ${escapeHtml(w.message)}</li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cocina · ${view.dayDate}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 18px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 16px 0 6px; }
    p, li { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #bbb; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
    .meta { color: #444; margin-bottom: 10px; }
    @media print { body { margin: 8px; } }
  </style>
</head>
<body>
  <h1>Trabajo de cocina · ${escapeHtml(view.dayLabel)}</h1>
  <p class="meta">${view.dayDate} · ${view.cards.length} ítems · sin reinterpretar Production</p>
  <h2>Cola de ejecución</h2>
  <table>
    <thead>
      <tr>
        <th>Qué</th><th>Cuánto</th><th>Batch</th><th>Cuándo</th><th>Estado</th>
        <th>Prep</th><th>Alérgenos</th><th>Dietario</th><th>Notas</th>
        <th>Cliente</th><th>Instrucción</th>
      </tr>
    </thead>
    <tbody>${rows || "<tr><td colspan='11'>Sin trabajo</td></tr>"}</tbody>
  </table>
  <h2>Avisos</h2>
  <ul>${warns || "<li>Sin avisos</li>"}</ul>
  <p class="meta">n/d = no disponible en substrate · * cantidad estimada</p>
</body>
</html>`;
}

export function printKitchenWork(view: TodaysKitchenWork): void {
  const html = kitchenWorkPrintHtml(view);
  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}
