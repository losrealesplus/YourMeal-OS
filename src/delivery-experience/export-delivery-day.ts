/**
 * DE001 — Delivery Day print / CSV (Experience only).
 */

import type {
  DeliveryDayCard,
  TodaysDeliveryDay,
} from "@/delivery-experience/today-delivery";
import {
  deliveryReadinessLabel,
  deliveryStatusLabel,
} from "@/delivery-experience/today-delivery";

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

export function deliveryDayToCsv(view: TodaysDeliveryDay): string {
  const header = [
    "day",
    "order",
    "customer",
    "address",
    "zone",
    "window",
    "package",
    "dietary",
    "special",
    "status",
    "readiness",
    "driver",
  ];
  const rows = view.cards.map((c: DeliveryDayCard) =>
    [
      view.dayDate,
      c.orderRef,
      c.customerLabel ?? "",
      c.addressLabel ?? "",
      c.zoneLabel ?? "",
      c.windowLabel ?? "",
      c.packageSummary ?? "",
      c.dietaryInfo ?? "",
      c.specialInstructions ?? "",
      c.deliveryStatus,
      c.readiness,
      c.driverLabel ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadDeliveryDayCsv(view: TodaysDeliveryDay): void {
  const csv = deliveryDayToCsv(view);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delivery-today-${view.dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printDeliveryDay(view: TodaysDeliveryDay): void {
  const rows = view.cards
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c.customerLabel ?? "—")}</td>
        <td>${escapeHtml(c.orderRef)}</td>
        <td>${escapeHtml(c.addressLabel ?? "no disponible en este substrate")}</td>
        <td>${escapeHtml(c.packageSummary ?? "—")}</td>
        <td>${escapeHtml(deliveryStatusLabel(c.deliveryStatus))}</td>
        <td>${escapeHtml(deliveryReadinessLabel(c.readiness))}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Delivery Day ${escapeHtml(view.dayDate)}</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; padding: 16px; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { color: #555; margin-bottom: 12px; }
</style></head><body>
  <h1>Jornada de entregas · ${escapeHtml(view.dayLabel)} · ${escapeHtml(view.dayDate)}</h1>
  <p class="meta">
    Total ${view.totals.total} · Ready ${view.totals.ready} ·
    Warnings ${view.totals.readyWithWarnings} · Incomplete ${view.totals.incomplete} ·
    Remaining ${view.totals.remaining} · Completed ${view.totals.completed}
  </p>
  <p class="meta">Sin rutas · sin mapas · sin asignación inventada · Experience only</p>
  <table>
    <thead>
      <tr>
        <th>Cliente</th><th>Pedido</th><th>Dirección</th>
        <th>Paquete</th><th>Estado</th><th>Readiness</th>
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
