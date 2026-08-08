/**
 * DE005 — Route Preparation print / CSV (Experience only).
 * Print HTML also serves as browser Print→PDF — no PDF library invent.
 */

import type { RoutePrepDayView } from "@/delivery-experience/route-preparation";
import { responsibilityStateLabel } from "@/delivery-experience/route-preparation";

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

export function routePrepDayToCsv(view: RoutePrepDayView): string {
  const header = [
    "day",
    "sequence",
    "order",
    "customer",
    "address",
    "address_clarification_session",
    "zone",
    "window",
    "responsibility_state",
    "driver",
    "session_responsibility_note",
    "package",
    "special_instructions",
    "warnings",
  ];
  const rows = view.sequence.map((c) =>
    [
      view.dayDate,
      String(c.sequenceNumber),
      c.orderRef,
      c.customerLabel ?? "",
      c.addressLabel ?? "",
      c.addressClarification ?? "",
      c.zoneLabel ?? "",
      c.windowLabel ?? "",
      c.responsibilityState,
      c.driverLabel ?? "",
      c.sessionResponsibilityNote ?? "",
      c.packageSummary ?? "",
      c.specialInstructions ?? "",
      c.warnings
        .filter((w) => w.severity !== "info")
        .map((w) => w.message)
        .join(" | "),
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadRoutePrepCsv(view: RoutePrepDayView): void {
  const csv = routePrepDayToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delivery-route-prep-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printRoutePrepDay(view: RoutePrepDayView): void {
  const rows = view.sequence
    .map(
      (c) => `
      <tr>
        <td>${c.sequenceNumber}</td>
        <td>${escapeHtml(c.customerLabel ?? "—")}</td>
        <td>${escapeHtml(c.orderRef)}</td>
        <td>${escapeHtml(c.addressLabel ?? "no disponible en este substrate")}${
          c.addressClarification
            ? `<br/><em>Aclaración sesión: ${escapeHtml(c.addressClarification)}</em>`
            : ""
        }</td>
        <td>${escapeHtml(c.windowLabel ?? "—")}</td>
        <td>${escapeHtml(responsibilityStateLabel(c.responsibilityState))}${
          c.driverLabel ? `<br/>${escapeHtml(c.driverLabel)}` : ""
        }${
          !view.assignmentSupported
            ? "<br/><em>assignment unavailable</em>"
            : ""
        }</td>
        <td>${escapeHtml(c.packageSummary ?? "—")}</td>
        <td>${escapeHtml(
          c.warnings
            .filter((w) => w.severity !== "info")
            .map((w) => w.message)
            .join("; ") || "—",
        )}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Route Preparation ${escapeHtml(view.dayDate)}</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; padding: 16px; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { color: #555; margin-bottom: 12px; }
</style></head><body>
  <h1>Preparación de jornada · ${escapeHtml(view.dayLabel)} · ${escapeHtml(view.dayDate)}</h1>
  <p class="meta">${escapeHtml(view.statusSummary)}</p>
  <p class="meta">
    Secuencia ${view.totals.preparedSequence} · Restantes ${view.totals.remaining} ·
    Avisos ${view.totals.warnings} · Persistencia: sesión
  </p>
  <p class="meta">
    Route Preparation ≠ Route Optimization · sin mapas · sin navegación ·
    sin AssignDelivery inventado · Experience only
  </p>
  <p class="meta">Imprimir / Guardar como PDF desde el diálogo del navegador.</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Cliente</th><th>Order</th><th>Dónde</th>
        <th>Cuándo</th><th>Responsabilidad</th><th>Paquete</th><th>Atención</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
