/**
 * FLOW-05 · B7 Delivery Confirmation.
 *
 * Certifies SaaS business-acceptance state transition exists and integrates:
 *   Delivered → confirmation registered → order closed → Confirmed
 *
 * Requires B6 CERTIFIED + Gate authorizing FLOW05-007.
 * Does NOT open B8 (History). No archive/reports/billing/ratings.
 * Presence/integration only — one state transition, not EatClean-only.
 *
 * Note: Order State "Confirmed" maps to operational terminal `delivered`
 * after FLOW01_T4_COMPLETED (confirmation registered). Distinct from B6
 * execution spine (departure / attempt / stop stamp).
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B7_PRECONDITIONS = Object.freeze([
  "flow_05_b6_certified",
  "flow_05_gate_authorizes_007",
  "confirmation_token_present",
  "confirmation_domain_acta_present",
  "customer_receives_surface_present",
  "confirmation_pipeline_closed_present",
  "delivered_terminal_present",
  "confirmed_ready_for_history_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B7_ANCHORS = Object.freeze([
  {
    id: "confirmation_token_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Confirmación registrada (FLOW01_T4_COMPLETED)",
    needle: /logFlow01Step\("FLOW01_T4_COMPLETED"/,
  },
  {
    id: "confirmation_domain_acta_present",
    rel: "docs/10-validation/flow-01/FLOW01_004_T4_ACTA.md",
    label: "Domain Delivery confirmation CERTIFIED (FLOW01-004)",
    needle: /Delivery confirmation|FLOW01_T4_COMPLETED/,
  },
  {
    id: "customer_receives_surface_present",
    rel: "src/routes/_authenticated/app.orders.$orderId.tsx",
    label: "Cliente recibe / ve pedido delivered",
    needle: /status === "delivered"/,
  },
  {
    id: "confirmation_pipeline_closed_present",
    rel: "src/modules/operations/application/flow01-evidence.ts",
    label: "Pedido / pipeline cerrado tras confirmación",
    needle: /step === "FLOW01_T4_COMPLETED"/,
  },
  {
    id: "delivered_terminal_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Estado terminal delivered (= Order State Confirmed)",
    needle: /delivered:\s*"Entregado"/,
  },
  {
    id: "confirmed_ready_for_history_present",
    rel: "docs/00-status/FLOW_05_SPEC.md",
    label: "END Confirmed · lista para historial (B8)",
    needle: /B7 · Delivery Confirmation[\s\S]*lista para historial \(B8\)/,
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
 * }} B7Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B7Result}
 */
export function runFlow05B7DeliveryConfirmation(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b6Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_006_B6_ACTA.md",
  );
  if (!fs.existsSync(b6Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_006_B6_ACTA.md — B7 requires B6 Delivery CERTIFIED.",
    };
  }
  checks.push("flow_05_b6_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B7 requires Gate authorizing FLOW05-007.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-007/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-007 — Land Check B6 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_007");

  for (const anchor of B7_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B7 requires ${anchor.label}.`,
          "FLOW05-007 certifies Delivery Confirmation only (Confirmed · no B8 History).",
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
    mapped_tokens: ["FLOW05_B7_STARTED", "FLOW05_B7_COMPLETED"],
    source:
      "T4_COMPLETED · FLOW01-004 confirmation · customer delivered surface · pipeline closed · Confirmed → ready for history · B6 CERTIFIED (no B8+ · no archive · no Capacitor)",
  };
}
