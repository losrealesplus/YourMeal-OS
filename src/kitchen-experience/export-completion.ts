/**
 * KE006 — Print / CSV for Kitchen completion (Experience only).
 * Answers: what completed · what remains · attention · next — no Delivery invent.
 */

import type { KitchenCompletionView } from "@/kitchen-experience/completion-view";
import { quantityLabel } from "@/kitchen-experience/completion-view";

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

export function completionToCsv(view: KitchenCompletionView): string {
  const header = [
    "day",
    "dish",
    "quantity",
    "batch",
    "deadline",
    "completion_status",
    "provenance",
    "next_action",
    "warnings",
    "special_critical",
  ];
  const rows = view.cards.map((c) =>
    [
      c.line.card.productionDay,
      c.line.card.dishLabel,
      quantityLabel(c.line.card),
      c.line.card.batchKey,
      c.line.card.cookingDeadline,
      c.completionStatus,
      c.line.provenance,
      c.nextActionLabel,
      c.line.card.operationalNotes,
      c.line.hasCriticalSpecial ? "yes" : "no",
    ]
      .map(csvEscape)
      .join(","),
  );
  const meta = [
    `# readiness,${csvEscape(view.readinessLabel)}`,
    `# summary,${csvEscape(view.completionSummary)}`,
    `# next_responsibility,${csvEscape(view.nextResponsibility)}`,
    `# durable_completion,unavailable`,
  ];
  return [...meta, header.join(","), ...rows].join("\n");
}

export function downloadCompletionCsv(view: KitchenCompletionView): void {
  const csv = completionToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitchen-completion-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function completionPrintHtml(view: KitchenCompletionView): string {
  const warnList = view.warnings
    .map(
      (w) =>
        `<li class="${w.severity}"><strong>${escapeHtml(w.severity)}</strong> — ${escapeHtml(w.message)}</li>`,
    )
    .join("");

  const rows = view.cards
    .map(
      (c) => `<tr>
      <td>${escapeHtml(c.line.card.dishLabel)}</td>
      <td>${quantityLabel(c.line.card)}</td>
      <td>${escapeHtml(c.line.card.batchKey)}</td>
      <td>${escapeHtml(c.line.card.cookingDeadline)}</td>
      <td>${escapeHtml(c.completionStatus)}</td>
      <td>${escapeHtml(c.nextActionLabel)}</td>
      <td>${c.line.hasCriticalSpecial ? "sí" : "—"}</td>
    </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cierre Kitchen · ${escapeHtml(view.dayDate)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 16px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 14px 0 6px; }
    p, li { font-size: 12px; }
    .meta { color: #444; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #bbb; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; }
    li.critical { font-weight: 700; }
    @media print { body { margin: 8px; } }
  </style>
</head>
<body>
  <h1>Cierre de cocina · ${escapeHtml(view.dayLabel)}</h1>
  <p class="meta">${escapeHtml(view.dayDate)} · ${escapeHtml(view.readinessLabel)}</p>
  <p><strong>Resumen:</strong> ${escapeHtml(view.completionSummary)}</p>
  <p><strong>Siguiente responsabilidad:</strong> ${escapeHtml(view.nextResponsibility)}</p>
  <p class="meta">${escapeHtml(view.readinessDetail)}</p>
  <h2>Avisos</h2>
  <ul>${warnList || "<li>Sin avisos</li>"}</ul>
  <h2>Trabajos</h2>
  <table>
    <thead>
      <tr>
        <th>Qué</th><th>Cuánto</th><th>Batch</th><th>Deadline</th>
        <th>Cierre</th><th>Siguiente</th><th>Crítico</th>
      </tr>
    </thead>
    <tbody>${rows || "<tr><td colspan='7'>Sin trabajo</td></tr>"}</tbody>
  </table>
  <p class="meta">Session completion ≠ CompleteExecutionUnit · Delivery → Future · no aceptación inventada</p>
</body>
</html>`;
}

export function printCompletion(view: KitchenCompletionView): void {
  const html = completionPrintHtml(view);
  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}
