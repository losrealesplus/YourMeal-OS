/**
 * DE004 — Responsibility print / CSV (Experience only).
 */

import type { ResponsibilityDayView } from "@/delivery-experience/responsibility-view";
import { responsibilityStateLabel } from "@/delivery-experience/responsibility-view";

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

export function responsibilityDayToCsv(view: ResponsibilityDayView): string {
  const header = [
    "day",
    "order",
    "customer",
    "address",
    "zone",
    "window",
    "status",
    "responsibility_state",
    "driver",
    "session_responsibility_note",
  ];
  const rows = view.cards.map((c) =>
    [
      view.dayDate,
      c.orderRef,
      c.customerLabel ?? "",
      c.addressLabel ?? "",
      c.zoneLabel ?? "",
      c.windowLabel ?? "",
      c.deliveryStatus,
      c.responsibilityState,
      c.driverLabel ?? "",
      c.sessionResponsibilityNote ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadResponsibilityCsv(view: ResponsibilityDayView): void {
  const csv = responsibilityDayToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delivery-responsibility-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printResponsibilityDay(view: ResponsibilityDayView): void {
  const rows = view.cards
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.customerLabel ?? "—")}</td>
        <td>${escapeHtml(c.orderRef)}</td>
        <td>${escapeHtml(c.addressLabel ?? "no disponible en este substrate")}</td>
        <td>${escapeHtml(responsibilityStateLabel(c.responsibilityState))}</td>
        <td>${escapeHtml(c.driverLabel ?? "—")}</td>
        <td>${escapeHtml(c.sessionResponsibilityNote ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Delivery Responsibility ${escapeHtml(view.dayDate)}</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; padding: 16px; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { color: #555; margin-bottom: 12px; }
</style></head><body>
  <h1>Responsabilidad de entregas · ${escapeHtml(view.dayLabel)} · ${escapeHtml(view.dayDate)}</h1>
  <p class="meta">${escapeHtml(view.responsibilityStatusSummary)}</p>
  <p class="meta">
    Total ${view.totals.total} · Assigned ${view.totals.assigned} ·
    Unassigned ${view.totals.unassigned} · Unavailable ${view.totals.assignmentUnavailable} ·
    Completed ${view.totals.completed}
  </p>
  <p class="meta">Sin rutas · sin AssignDelivery inventado · Experience only</p>
  <table>
    <thead>
      <tr>
        <th>Cliente</th><th>Order</th><th>Dirección</th>
        <th>Responsabilidad</th><th>Conductor</th><th>Nota sesión</th>
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
