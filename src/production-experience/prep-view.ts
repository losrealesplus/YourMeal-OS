/**
 * PE004 — Pre-preparation visibility & actions (Experience only).
 *
 * Bridge between planning and Kitchen execution — never discover late.
 */

import { utcDateOnly } from "@/menu-experience/week-plan";
import {
  getProductionPlan,
  saveProductionPlan,
  type PrePreparation,
  type PrepPriority,
  type PrepStatus,
  type ProductionPlan,
  type ProductionWorkItem,
} from "@/production-experience/production-plan";

export type PrepView = {
  prep: PrePreparation;
  effectiveStatus: PrepStatus;
  work: ProductionWorkItem | null;
  relatedDish: string;
  overdue: boolean;
  blocked: boolean;
  priority: PrepPriority;
};

export function deriveEffectivePrepStatus(
  prep: PrePreparation,
  today: string = utcDateOnly(),
): PrepStatus {
  if (prep.status === "ready" || prep.status === "done") return "ready";
  if (prep.preparationDate > prep.requiredUseDate) return "blocked";
  if (prep.status === "blocked") return "blocked";
  if (prep.preparationDate < today) return "overdue";
  if (prep.status === "pending" || prep.status === "scheduled") return "scheduled";
  return prep.status;
}

export function prepPriorityFor(prep: PrePreparation): PrepPriority {
  if (prep.priority) return prep.priority;
  if (prep.kind === "defrost") return "high";
  if (prep.kind === "protein" || prep.kind === "sauce") return "high";
  return "normal";
}

export function buildPrepViews(
  plan: ProductionPlan,
  today: string = utcDateOnly(),
): PrepView[] {
  return plan.preparations
    .map((prep) => {
      const work = plan.work.find((w) => w.id === prep.workId) ?? null;
      const effectiveStatus = deriveEffectivePrepStatus(prep, today);
      return {
        prep,
        effectiveStatus,
        work,
        relatedDish: work?.dishLabel ?? prep.label,
        overdue: effectiveStatus === "overdue",
        blocked: effectiveStatus === "blocked",
        priority: prepPriorityFor(prep),
      };
    })
    .sort((a, b) => {
      const rank: Record<PrepStatus, number> = {
        overdue: 0,
        blocked: 1,
        pending: 2,
        scheduled: 3,
        ready: 4,
        done: 5,
      };
      const pr: Record<PrepPriority, number> = {
        high: 0,
        normal: 1,
        low: 2,
      };
      return (
        rank[a.effectiveStatus] - rank[b.effectiveStatus] ||
        pr[a.priority] - pr[b.priority] ||
        a.prep.preparationDate.localeCompare(b.prep.preparationDate)
      );
    });
}

export function markPrepReady(
  weekStart: string,
  prepId: string,
): ProductionPlan | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const preparations = plan.preparations.map((p) =>
    p.id === prepId ? { ...p, status: "ready" as const } : p,
  );
  return saveProductionPlan({ ...plan, preparations });
}

export function markPrepPending(
  weekStart: string,
  prepId: string,
): ProductionPlan | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const preparations = plan.preparations.map((p) =>
    p.id === prepId ? { ...p, status: "scheduled" as const } : p,
  );
  return saveProductionPlan({ ...plan, preparations });
}

export function reschedulePrepDate(
  weekStart: string,
  prepId: string,
  preparationDate: string,
): ProductionPlan | null {
  const plan = getProductionPlan(weekStart);
  if (!plan) return null;
  const preparations = plan.preparations.map((p) => {
    if (p.id !== prepId) return p;
    const blocked = preparationDate > p.requiredUseDate;
    return {
      ...p,
      preparationDate,
      status: blocked ? ("blocked" as const) : ("scheduled" as const),
    };
  });
  return saveProductionPlan({ ...plan, preparations });
}

export function prepListToCsv(plan: ProductionPlan): string {
  const views = buildPrepViews(plan);
  const header = [
    "prep_name",
    "kind",
    "related_dish",
    "quantity",
    "preparation_date",
    "use_date",
    "status",
    "priority",
  ];
  const rows = views.map((v) =>
    [
      v.prep.label,
      v.prep.kind,
      v.relatedDish,
      String(v.prep.requiredQuantity ?? v.work?.quantity ?? ""),
      v.prep.preparationDate,
      v.prep.requiredUseDate,
      v.effectiveStatus,
      v.priority,
    ]
      .map((cell) => {
        const s = String(cell);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadPrepListCsv(plan: ProductionPlan): void {
  const csv = prepListToCsv(plan);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-preps-${plan.weekStart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPrepList(plan: ProductionPlan): void {
  const views = buildPrepViews(plan);
  const rows = views
    .map(
      (v) =>
        `<tr>
          <td>${escape(v.prep.label)}</td>
          <td>${escape(v.relatedDish)}</td>
          <td>${v.prep.requiredQuantity ?? v.work?.quantity ?? "—"}</td>
          <td>${v.prep.preparationDate}</td>
          <td>${v.prep.requiredUseDate}</td>
          <td>${v.effectiveStatus}</td>
          <td>${v.priority}</td>
        </tr>`,
    )
    .join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>Pre-preparaciones · ${plan.weekStart}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;margin:24px;color:#111}
    h1{font-size:18px;margin:0 0 8px} table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left} th{background:#f4f4f4}
  </style></head><body>
  <h1>Lista de pre-preparaciones</h1>
  <p>Semana ${plan.weekStart} · ${views.length} ítems · no es Kitchen</p>
  <table><thead><tr>
    <th>Prep</th><th>Trabajo</th><th>Cant.</th><th>Prep date</th><th>Uso</th><th>Estado</th><th>Prioridad</th>
  </tr></thead><tbody>${rows || "<tr><td colspan='7'>Sin pre-preparaciones</td></tr>"}</tbody></table>
  </body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => w.print(), 250);
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function prepKindLabel(kind: PrePreparation["kind"]): string {
  switch (kind) {
    case "base":
      return "Base";
    case "sauce":
      return "Salsa";
    case "protein":
      return "Proteína";
    case "vegetable":
      return "Verdura";
    case "defrost":
      return "Descongelado";
    case "cutting":
      return "Corte";
    case "assembly":
      return "Ensamblaje";
    case "packaging":
      return "Envasado";
    default:
      return "Otro";
  }
}

export function prepStatusLabel(s: PrepStatus): string {
  switch (s) {
    case "ready":
    case "done":
      return "Lista";
    case "scheduled":
      return "Programada";
    case "overdue":
      return "Vencida";
    case "blocked":
      return "Bloqueada";
    default:
      return "Pendiente";
  }
}
