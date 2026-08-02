/**
 * RELEASE-CROSSFLOW · Capability driver (chained handoffs — not domain re-run).
 *
 * C1 = Kitchen → Delivery (FLOW-01)
 * C2 = Delivery incident → delivered (FLOW-02)
 * C3 = Delivered → billing paid (FLOW-03)
 * C4 not implemented in RELEASE-CROSSFLOW-003.
 */
import { runReleaseCrossflowC1KitchenDelivery } from "./release-crossflow-c1-kitchen-delivery.mjs";
import { runReleaseCrossflowC2DeliveryIncident } from "./release-crossflow-c2-delivery-incident.mjs";
import { runReleaseCrossflowC3Billing } from "./release-crossflow-c3-billing.mjs";

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

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C2_STARTED", {
    segment: "delivery_incident",
  });
  steps.push("RELEASE_CROSSFLOW_C2_STARTED");

  const c2 = runReleaseCrossflowC2DeliveryIncident({ cwd: root });
  evidence.c2_checks = c2.checks;
  if (!c2.ok) {
    console.error("[RELEASE-CROSSFLOW] C2 FAIL:\n" + c2.reason);
    return { ok: false, steps, reason: c2.reason, evidence };
  }
  evidence.c2_mapped_tokens = c2.mapped_tokens;
  evidence.c2_source = c2.source;

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C2_COMPLETED", {
    segment: "delivery_incident",
    mapped_tokens: c2.mapped_tokens,
    source: c2.source,
    checks: c2.checks,
  });
  steps.push("RELEASE_CROSSFLOW_C2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C3_STARTED", {
    segment: "billing",
  });
  steps.push("RELEASE_CROSSFLOW_C3_STARTED");

  const c3 = runReleaseCrossflowC3Billing({ cwd: root });
  evidence.c3_checks = c3.checks;
  if (!c3.ok) {
    console.error("[RELEASE-CROSSFLOW] C3 FAIL:\n" + c3.reason);
    return { ok: false, steps, reason: c3.reason, evidence };
  }
  evidence.c3_mapped_tokens = c3.mapped_tokens;
  evidence.c3_source = c3.source;

  console.info("[RELEASE-CROSSFLOW]", "RELEASE_CROSSFLOW_C3_COMPLETED", {
    segment: "billing",
    mapped_tokens: c3.mapped_tokens,
    source: c3.source,
    checks: c3.checks,
  });
  steps.push("RELEASE_CROSSFLOW_C3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  return {
    ok: false,
    steps,
    reason:
      "RELEASE-CROSSFLOW C4 not implemented (RELEASE-CROSSFLOW-003 scope is C3 only)",
    evidence,
  };
}
