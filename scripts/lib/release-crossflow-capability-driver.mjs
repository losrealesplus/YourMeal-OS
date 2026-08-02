/**
 * RELEASE-CROSSFLOW · Capability driver (chained handoffs — not domain re-run).
 *
 * C1 = Kitchen → Delivery (FLOW-01 mapped)
 * C2+ not implemented in RELEASE-CROSSFLOW-001.
 */
import { runReleaseCrossflowC1KitchenDelivery } from "./release-crossflow-c1-kitchen-delivery.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseCrossflowCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < C1",
    };
  }

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C1_STARTED", {
    segment: "kitchen_delivery",
  });
  steps.push("RELEASE_CROSSFLOW_C1_STARTED");

  const c1 = runReleaseCrossflowC1KitchenDelivery({ cwd: root });
  evidence.c1_checks = c1.checks;
  if (!c1.ok) {
    console.error("[RELEASE-CROSSFLOW] C1 FAIL:\n" + c1.reason);
    return { ok: false, steps, reason: c1.reason, evidence };
  }
  evidence.c1_mapped_tokens = c1.mapped_tokens;
  evidence.c1_source = c1.source;

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C1_COMPLETED", {
    segment: "kitchen_delivery",
    mapped_tokens: c1.mapped_tokens,
    source: c1.source,
    checks: c1.checks,
  });
  steps.push("RELEASE_CROSSFLOW_C1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "RELEASE-CROSSFLOW C2+ not implemented (RELEASE-CROSSFLOW-001 scope is C1 only)",
    evidence,
  };
}
