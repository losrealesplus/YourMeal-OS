/**
 * KE004 — Print / export label context (Experience only).
 * Supports identification + special info. Not physical label generation.
 */

import {
  LABEL_ABSENT_COPY,
  LABEL_NO_SPECIAL_COPY,
  labelFieldDisplay,
  sortedSpecial,
  type KitchenLabelContext,
} from "@/kitchen-experience/label-context";

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

export function labelContextsToCsv(contexts: KitchenLabelContext[]): string {
  const header = [
    "day",
    "dish",
    "execution_quantity",
    "production_quantity",
    "batch",
    "deadline",
    "customer",
    "order_ref",
    "delivery",
    "allergens",
    "dietary",
    "special_instruction",
    "other_special",
    "has_critical",
  ];
  const rows = contexts.map((ctx) => {
    const byId = Object.fromEntries(ctx.identity.map((f) => [f.id, f]));
    const allergens =
      ctx.special.find((s) => s.kind === "allergen")?.detail ?? "";
    const dietary =
      ctx.special.find((s) => s.kind === "dietary")?.detail ?? "";
    const instruction =
      ctx.special.find((s) => s.kind === "instruction")?.detail ?? "";
    const other = ctx.special
      .filter(
        (s) =>
          s.kind !== "allergen" &&
          s.kind !== "dietary" &&
          s.kind !== "instruction",
      )
      .map((s) => `${s.title}: ${s.detail}`)
      .join(" | ");
    return [
      ctx.productionDay,
      ctx.dishLabel,
      String(ctx.executionQuantity),
      String(ctx.productionQuantity) + (ctx.quantityEstimated ? "*" : ""),
      ctx.batchKey,
      ctx.cookingDeadline,
      labelFieldDisplay(byId.customer!),
      labelFieldDisplay(byId.order!),
      labelFieldDisplay(byId.delivery!),
      allergens || LABEL_ABSENT_COPY,
      dietary || LABEL_ABSENT_COPY,
      instruction || LABEL_ABSENT_COPY,
      other || LABEL_NO_SPECIAL_COPY,
      ctx.hasCritical ? "yes" : "no",
    ]
      .map(csvEscape)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function downloadLabelContextsCsv(
  contexts: KitchenLabelContext[],
  dayDate: string,
): void {
  const csv = labelContextsToCsv(contexts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kitchen-labels-${dayDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function labelContextPrintHtml(
  contexts: KitchenLabelContext[],
  dayDate: string,
  dayLabel: string,
): string {
  const blocks = contexts
    .map((ctx) => {
      const identityRows = ctx.identity
        .map(
          (f) =>
            `<tr class="${f.severity}"><th>${escapeHtml(f.label)}</th><td>${escapeHtml(labelFieldDisplay(f))}</td></tr>`,
        )
        .join("");
      const specialSorted = sortedSpecial(ctx.special);
      const specialRows = specialSorted.length
        ? specialSorted
            .map(
              (s) =>
                `<li class="${s.severity}"><strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.detail)}${s.source === "session" ? " <em>(sesión)</em>" : ""}</li>`,
            )
            .join("")
        : `<li class="normal">${LABEL_NO_SPECIAL_COPY}</li>`;

      return `<article class="card">
  <h2>${escapeHtml(ctx.dishLabel)} · ${ctx.executionQuantity} uds · ${escapeHtml(ctx.batchKey)}</h2>
  <p class="meta">${escapeHtml(ctx.dayLabel)} · ${ctx.productionDay} · deadline ${escapeHtml(ctx.cookingDeadline)}</p>
  <table><tbody>${identityRows}</tbody></table>
  <h3>Información especial</h3>
  <ul>${specialRows}</ul>
</article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas / contexto · ${escapeHtml(dayDate)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 16px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    h2 { font-size: 14px; margin: 0 0 4px; }
    h3 { font-size: 12px; margin: 10px 0 4px; }
    p, li, th, td { font-size: 11px; }
    .meta { color: #444; margin: 0 0 8px; }
    .card { border: 1px solid #bbb; padding: 10px 12px; margin: 0 0 12px; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
    th { width: 28%; background: #f5f5f5; font-weight: 600; }
    li.critical { font-weight: 700; }
    li.important { font-weight: 600; }
    tr.critical td { font-weight: 700; }
    tr.important td { font-weight: 600; }
    .note { color: #555; font-size: 10px; margin-top: 12px; }
    @media print { body { margin: 8px; } .card { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Contexto de etiquetado · ${escapeHtml(dayLabel)}</h1>
  <p class="meta">${escapeHtml(dayDate)} · ${contexts.length} ítem(s) · Kitchen consume — no inventa</p>
  ${blocks || "<p>Sin trabajo</p>"}
  <p class="note">${LABEL_ABSENT_COPY} = hueco de substrate · Generación física de etiquetas → Future · * cantidad estimada</p>
</body>
</html>`;
}

export function printLabelContexts(
  contexts: KitchenLabelContext[],
  dayDate: string,
  dayLabel: string,
): void {
  const html = labelContextPrintHtml(contexts, dayDate, dayLabel);
  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}
