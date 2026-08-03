/**
 * FLOW-05 · B8 History.
 *
 * Certifies SaaS memory state transition exists and integrates:
 *   Confirmed → archived → queryable → visible in Historial → Archived
 *
 * Requires B7 CERTIFIED + Gate authorizing FLOW05-008.
 * Does NOT open flow05-pass / Capacitor / analytics / billing.
 * Presence/integration only — one state transition, not EatClean-only.
 *
 * Note: Order State "Archived" = pedido fuera de operación, persistido
 * y consultable. Historial es la vista; el contrato termina en Archived.
 * Operational terminal `delivered` (post-B7) has no further ops transitions.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B8_PRECONDITIONS = Object.freeze([
  "flow_05_b7_certified",
  "flow_05_gate_authorizes_008",
  "order_left_operations_present",
  "persistence_query_present",
  "history_list_capability_present",
  "history_surface_visible_present",
  "integrity_own_customer_present",
  "archived_end_transition_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B8_ANCHORS = Object.freeze([
  {
    id: "order_left_operations_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Pedido fuera de cola operativa (delivered no está en DELIVERY_QUEUE)",
    needle: /DELIVERY_QUEUE_STATUSES[\s\S]*?=\s*\[[\s\S]*?ready_for_delivery[\s\S]*?out_for_delivery[\s\S]*?delivery_issue[\s\S]*?\];/,
  },
  {
    id: "persistence_query_present",
    rel: "src/modules/orders/application/order-queries.ts",
    label: "Persistencia / consulta (fetchCustomerOrders · from orders)",
    needle: /export async function fetchCustomerOrders[\s\S]*\.from\("orders"\)/,
  },
  {
    id: "history_list_capability_present",
    rel: "src/hooks/use-customer-orders.ts",
    label: "Disponible para consulta (CAP-007 orders history)",
    needle: /CAP-007[\s\S]*orders history|fetchCustomerOrders/,
  },
  {
    id: "history_surface_visible_present",
    rel: "src/routes/_authenticated/app.orders.tsx",
    label: "Visible en Historial (EP-002A.2)",
    needle: /EP-002A\.2 Historial|orders\.list \(CAP-007\)/,
  },
  {
    id: "integrity_own_customer_present",
    rel: "src/modules/orders/application/order-queries.ts",
    label: "Integridad (own customer_id · deleted_at null)",
    needle: /\.eq\("customer_id", customerId\)[\s\S]*\.is\("deleted_at", null\)/,
  },
  {
    id: "archived_end_transition_present",
    rel: "docs/00-status/FLOW_05_SPEC.md",
    label: "END Archived · ciclo cerrado (B8)",
    needle: /B8 · History[\s\S]*Ciclo cerrado[\s\S]*Archived/,
  },
]);

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} B8Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B8Result}
 */
export function runFlow05B8History(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b7Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_007_B7_ACTA.md",
  );
  if (!fs.existsSync(b7Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_007_B7_ACTA.md — B8 requires B7 Delivery Confirmation CERTIFIED.",
    };
  }
  checks.push("flow_05_b7_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B8 requires Gate authorizing FLOW05-008.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-008/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-008 — Land Check B7 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_008");

  for (const anchor of B8_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B8 requires ${anchor.label}.`,
          "FLOW05-008 certifies History only (Archived · no analytics · no Capacitor · no flow05-pass).",
        ].join("\n"),
      };
    }
    if (anchor.needle) {
      const text = fs.readFileSync(p, "utf8");
      if (!anchor.needle.test(text)) {
        return {
          ok: false,
          checks,
          reason: `Anchor ${anchor.rel} exists but lacks ${anchor.label} marker.`,
        };
      }
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["FLOW05_B8_STARTED", "FLOW05_B8_COMPLETED"],
    source:
      "left ops · fetchCustomerOrders · CAP-007 · Historial surface · own customer integrity · END Archived · B7 CERTIFIED (no analytics · no billing · no Capacitor · no flow05-pass)",
  };
}
