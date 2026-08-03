/**
 * FLOW-05 · B6 Delivery.
 *
 * Certifies SaaS delivery-execution state transition exists and integrates:
 *   Ready for Delivery → departure → physical delivery → Delivered
 *
 * Requires B5 CERTIFIED + Gate authorizing FLOW05-006.
 * Does NOT open B7 (Confirmation). No signature/PIN/QR/incidents/history.
 * Presence/integration only — one state transition, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B6_PRECONDITIONS = Object.freeze([
  "flow_05_b5_certified",
  "flow_05_gate_authorizes_006",
  "delivery_ready_entry_present",
  "departure_prepared_present",
  "out_for_delivery_departure_present",
  "physical_delivery_attempt_present",
  "stop_delivered_stamp_present",
  "status_updated_delivered_present",
  "delivered_end_transition_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B6_ANCHORS = Object.freeze([
  {
    id: "delivery_ready_entry_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Ready for Delivery (DELIVERY_QUEUE_STATUSES)",
    needle: /\bDELIVERY_QUEUE_STATUSES\b/,
  },
  {
    id: "departure_prepared_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Prepared for departure (ready_for_delivery → out_for_delivery)",
    needle: /ready_for_delivery:\s*\["out_for_delivery"\]/,
  },
  {
    id: "out_for_delivery_departure_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Salida a reparto (startOutForDelivery)",
    needle: /\bstartOutForDelivery\b/,
  },
  {
    id: "physical_delivery_attempt_present",
    rel: "src/modules/delivery/application/delivery-service.ts",
    label: "Entrega física (DeliveryService.recordAttempt)",
    needle: /\brecordAttempt\b/,
  },
  {
    id: "stop_delivered_stamp_present",
    rel: "src/modules/delivery/application/route-service.ts",
    label: "Llegada / stamp en parada (markOrderStopsDelivered)",
    needle: /\bmarkOrderStopsDelivered\b/,
  },
  {
    id: "status_updated_delivered_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Estado actualizado (completeDelivery)",
    needle: /\bcompleteDelivery\b/,
  },
  {
    id: "delivered_end_transition_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "END Delivered (out_for_delivery → delivered)",
    needle: /out_for_delivery:\s*\["delivered"/,
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
 * }} B6Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B6Result}
 */
export function runFlow05B6Delivery(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b5Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_005_B5_ACTA.md",
  );
  if (!fs.existsSync(b5Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_005_B5_ACTA.md — B6 requires B5 Route Planning CERTIFIED.",
    };
  }
  checks.push("flow_05_b5_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B6 requires Gate authorizing FLOW05-006.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-006/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-006 — Land Check B5 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_006");

  for (const anchor of B6_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B6 requires ${anchor.label}.`,
          "FLOW05-006 certifies Delivery only (Delivered · no B7 Confirmation).",
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
    mapped_tokens: ["FLOW05_B6_STARTED", "FLOW05_B6_COMPLETED"],
    source:
      "queue · departure · out_for_delivery · recordAttempt · stop stamp · completeDelivery · Delivered · B5 CERTIFIED (no B7+ · no confirmation · no Capacitor)",
  };
}
