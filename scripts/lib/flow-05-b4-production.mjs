/**
 * FLOW-05 · B4 Production.
 *
 * Certifies SaaS production state transition exists and integrates:
 *   Ready for Production → queue → batch → recipes → ingredients
 *   → completed → marked produced → Ready for Route Planning
 *
 * Requires B3 CERTIFIED + Gate authorizing FLOW05-004.
 * Does NOT open B5 (Route Planning). No delivery/billing/inventory ops.
 * Presence/integration only — one state transition, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B4_PRECONDITIONS = Object.freeze([
  "flow_05_b3_certified",
  "flow_05_gate_authorizes_004",
  "production_entry_present",
  "production_queue_present",
  "production_batch_assignment_present",
  "recipes_resolved_present",
  "ingredients_resolved_present",
  "production_completed_present",
  "ready_for_route_planning_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B4_ANCHORS = Object.freeze([
  {
    id: "production_entry_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Ready for Production → startProduction",
    needle: /\bstartProduction\b/,
  },
  {
    id: "production_queue_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Order enters production queue",
    needle: /\bKITCHEN_QUEUE_STATUSES\b/,
  },
  {
    id: "production_batch_assignment_present",
    rel: "src/modules/operations/application/kitchen-execution-service.ts",
    label: "Assignment to production batch/lot",
    needle: /\bkitchen_production_batches\b/,
  },
  {
    id: "recipes_resolved_present",
    rel: "src/modules/operations/application/production-report-service.ts",
    label: "Recipes resolved (loadRecipeLines)",
    needle: /\bloadRecipeLines\b/,
  },
  {
    id: "ingredients_resolved_present",
    rel: "src/modules/operations/domain/production-report.ts",
    label: "Ingredients resolved (ingredientSummary)",
    needle: /\bingredientSummary\b/,
  },
  {
    id: "production_completed_present",
    rel: "src/modules/operations/application/operations-service.ts",
    label: "Production completed (completeProduction)",
    needle: /\bcompleteProduction\b/,
  },
  {
    id: "ready_for_route_planning_present",
    rel: "src/modules/operations/domain/operational-status.ts",
    label: "Ready for Route Planning (prepared → ready_for_delivery)",
    needle: /prepared:\s*\["ready_for_delivery"\]/,
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
 * }} B4Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B4Result}
 */
export function runFlow05B4Production(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b3Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_003_B3_ACTA.md",
  );
  if (!fs.existsSync(b3Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_003_B3_ACTA.md — B4 requires B3 Order Creation CERTIFIED.",
    };
  }
  checks.push("flow_05_b3_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B4 requires Gate authorizing FLOW05-004.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-004/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-004 — Land Check B3 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_004");

  for (const anchor of B4_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B4 requires ${anchor.label}.`,
          "FLOW05-004 certifies Production only (Ready for Route Planning · no B5).",
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
    mapped_tokens: ["FLOW05_B4_STARTED", "FLOW05_B4_COMPLETED"],
    source:
      "startProduction · queue · batch · recipes · ingredients · completeProduction · ready for routes · B3 CERTIFIED (no B5+ · no delivery · no Capacitor)",
  };
}
