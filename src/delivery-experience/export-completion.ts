/**
 * DE006 — Delivery Completion print / CSV (Experience only).
 * Print HTML also serves as browser Print→PDF.
 */

import type { DeliveryCompletionDayView } from "@/delivery-experience/completion-view";
import {
  completionStateLabel,
  responsibilityStateLabel,
  unresolvedKindLabel,
} from "@/delivery-experience/completion-view";

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

export function deliveryCompletionToCsv(
  view: DeliveryCompletionDayView,
): string {
  const header = [
    "day",
    "order",
    "customer",
    "address",
    "window",
    "route_position",
    "delivery_status",
    "completion_state",
    "completed_in_session",
    "responsibility",
    "unresolved_kind_session",
    "unresolved_note_session",
    "next_responsibility",
    "billing_outcome",
    "warnings",
  ];
  const rows = view.cards.map((c) =>
    [
      view.dayDate,
      c.orderRef,
      c.customerLabel ?? "",
      c.addressLabel ?? "",
      c.windowLabel ?? "",
      c.routePosition != null ? String(c.routePosition) : "",
      c.deliveryStatus,
      c.completionState,
      c.completedInSession ? "yes" : "no",
      c.responsibilityState,
      c.sessionUnresolvedKind ?? "",
      c.sessionUnresolvedNote ?? "",
      c.nextResponsibility,
      c.billingOutcomeLabel,
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

export function downloadDeliveryCompletionCsv(
  view: DeliveryCompletionDayView,
): void {
  const csv = deliveryCompletionToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delivery-completion-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printDeliveryCompletion(view: DeliveryCompletionDayView): void {
  const rows = view.cards
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.customerLabel ?? "—")}</td>
        <td>${escapeHtml(c.orderRef)}</td>
        <td>${c.routePosition ?? "—"}</td>
        <td>${escapeHtml(completionStateLabel(c.completionState))}${
          c.completedInSession
            ? "<br/><em>Completed in this session</em>"
            : ""
        }</td>
        <td>${escapeHtml(responsibilityStateLabel(c.responsibilityState))}</td>
        <td>${
          c.sessionUnresolvedKind
            ? escapeHtml(
                `${unresolvedKindLabel(c.sessionUnresolvedKind)}: ${c.sessionUnresolvedNote ?? ""}`,
              )
            : "—"
        }</td>
        <td>${escapeHtml(c.nextResponsibilityLabel)}</td>
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
<html><head><meta charset="utf-8"/><title>Delivery Completion ${escapeHtml(view.dayDate)}</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; padding: 16px; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { color: #555; margin-bottom: 12px; }
</style></head><body>
  <h1>Cierre de entregas · ${escapeHtml(view.dayLabel)} · ${escapeHtml(view.dayDate)}</h1>
  <p class="meta">${escapeHtml(view.statusSummary)}</p>
  <p class="meta">
    Completed ${view.totals.completed} · Remaining ${view.totals.remaining} ·
    Failed ${view.totals.failed} · Blocked ${view.totals.blocked} ·
    Warnings ${view.totals.warnings}
  </p>
  <p class="meta">
    ConfirmDelivery ${view.confirmDeliverySupported ? "available (Facade)" : "unavailable"} ·
    POD no simulado · Billing no automático · Experience only
  </p>
  <p class="meta">Imprimir / Guardar como PDF desde el diálogo del navegador.</p>
  <table>
    <thead>
      <tr>
        <th>Cliente</th><th>Order</th><th># ruta</th><th>Outcome</th>
        <th>Responsabilidad</th><th>Sin resolver</th><th>Siguiente</th><th>Atención</th>
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
