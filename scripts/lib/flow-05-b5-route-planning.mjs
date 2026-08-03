/**
 * FLOW-05 · B5 Route Planning.
 *
 * Certifies SaaS logistics handoff exists and integrates:
 *   Ready for Route Planning → eligible → route · driver · sequence
 *   → validated → Ready for Delivery
 *
 * Requires B4 CERTIFIED + Gate authorizing FLOW05-005.
 * Does NOT open B6 (Delivery execution). No tracking/geo/confirmation.
 * Presence/integration only — one state transition, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B5_PRECONDITIONS = Object.freeze([
  "flow_05_b4_certified",
  "flow_05_gate_authorizes_005",
  "route_planning_entry_present",
  "order_eligible_for_dispatch_present",
  "delivery_assignment_present",
  "route_assignment_present",
  "driver_assignment_present",
  "delivery_sequence_present",
  "route_validated_present",
  "ready_for_delivery_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B5_ANCHORS = Object.freeze([
  {
    id: "route_planning_entry_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Ready for Route Planning (assignDelivery)",
    needle: /\bassignDelivery\b/,
  },
  {
    id: "order_eligible_for_dispatch_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Order eligible for dispatch (prepared → ready_for_delivery)",
    needle: /prepared:\s*\["ready_for_delivery"\]/,
  },
  {
    id: "delivery_assignment_present",
    rel: "src/modules/operations/domain/delivery-assignment.ts",
    label: "Delivery assignment composition",
    needle: /\bassignDeliveryOrder\b/,
  },
  {
    id: "route_assignment_present",
    rel: "src/modules/delivery/application/route-service.ts",
    label: "Assignment to route (status planned)",
    needle: /status:\s*"planned"/,
  },
  {
    id: "driver_assignment_present",
    rel: "src/modules/delivery/application/route-service.ts",
    label: "Assignment to driver (setDriver)",
    needle: /\bsetDriver\b/,
  },
  {
    id: "delivery_sequence_present",
    rel: "src/modules/delivery/application/route-service.ts",
    label: "Delivery sequence defined (addStop)",
    needle: /\baddStop\b/,
  },
  {
    id: "route_validated_present",
    rel: "src/modules/delivery/domain/route-status.ts",
    label: "Route validated (nextRouteStatuses)",
    needle: /\bnextRouteStatuses\b/,
  },
  {
    id: "ready_for_delivery_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Ready for Delivery (handoff edge · not B6 execution)",
    needle: /ready_for_delivery:\s*\["out_for_delivery"\]/,
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
 * }} B5Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B5Result}
 */
export function runFlow05B5RoutePlanning(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b4Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_004_B4_ACTA.md",
  );
  if (!fs.existsSync(b4Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_004_B4_ACTA.md — B5 requires B4 Production CERTIFIED.",
    };
  }
  checks.push("flow_05_b4_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B5 requires Gate authorizing FLOW05-005.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-005/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-005 — Land Check B4 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_005");

  for (const anchor of B5_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B5 requires ${anchor.label}.`,
          "FLOW05-005 certifies Route Planning only (Ready for Delivery · no B6).",
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
    mapped_tokens: ["FLOW05_B5_STARTED", "FLOW05_B5_COMPLETED"],
    source:
      "assignDelivery · eligibility · assignment · route · driver · sequence · validated · ready for delivery · B4 CERTIFIED (no B6+ · no tracking · no Capacitor)",
  };
}
