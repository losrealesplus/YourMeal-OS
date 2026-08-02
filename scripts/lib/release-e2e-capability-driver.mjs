/**
 * RELEASE-E2E · Capability driver (pilot journey — not Smoke/Cross-flow re-run).
 *
 * E1 = Platform Entry (RELEASE-SMOKE)
 * E2 = Order → Delivery (FLOW-01)
 * E3 = Incident → Billing (FLOW-02 + FLOW-03)
 * E4 = Inventory → Close (FLOW-04)
 */
import { runReleaseE2eE1PlatformEntry } from "./release-e2e-e1-platform-entry.mjs";
import { runReleaseE2eE2OrderDelivery } from "./release-e2e-e2-order-delivery.mjs";
import { runReleaseE2eE3IncidentBilling } from "./release-e2e-e3-incident-billing.mjs";
import { runReleaseE2eE4InventoryClose } from "./release-e2e-e4-inventory-close.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseE2eCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < E1",
    };
  }

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E1_STARTED", {
    segment: "platform_entry",
  });
  steps.push("RELEASE_E2E_E1_STARTED");

  const e1 = runReleaseE2eE1PlatformEntry({ cwd: root });
  evidence.e1_checks = e1.checks;
  if (!e1.ok) {
    console.error("[RELEASE-E2E] E1 FAIL:\n" + e1.reason);
    return { ok: false, steps, reason: e1.reason, evidence };
  }
  evidence.e1_mapped_tokens = e1.mapped_tokens;
  evidence.e1_source = e1.source;

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E1_COMPLETED", {
    segment: "platform_entry",
    mapped_tokens: e1.mapped_tokens,
    source: e1.source,
    checks: e1.checks,
  });
  steps.push("RELEASE_E2E_E1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E2_STARTED", {
    segment: "order_delivery",
  });
  steps.push("RELEASE_E2E_E2_STARTED");

  const e2 = runReleaseE2eE2OrderDelivery({ cwd: root });
  evidence.e2_checks = e2.checks;
  if (!e2.ok) {
    console.error("[RELEASE-E2E] E2 FAIL:\n" + e2.reason);
    return { ok: false, steps, reason: e2.reason, evidence };
  }
  evidence.e2_mapped_tokens = e2.mapped_tokens;
  evidence.e2_source = e2.source;

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E2_COMPLETED", {
    segment: "order_delivery",
    mapped_tokens: e2.mapped_tokens,
    source: e2.source,
    checks: e2.checks,
  });
  steps.push("RELEASE_E2E_E2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E3_STARTED", {
    segment: "incident_billing",
  });
  steps.push("RELEASE_E2E_E3_STARTED");

  const e3 = runReleaseE2eE3IncidentBilling({ cwd: root });
  evidence.e3_checks = e3.checks;
  if (!e3.ok) {
    console.error("[RELEASE-E2E] E3 FAIL:\n" + e3.reason);
    return { ok: false, steps, reason: e3.reason, evidence };
  }
  evidence.e3_mapped_tokens = e3.mapped_tokens;
  evidence.e3_source = e3.source;

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E3_COMPLETED", {
    segment: "incident_billing",
    mapped_tokens: e3.mapped_tokens,
    source: e3.source,
    checks: e3.checks,
  });
  steps.push("RELEASE_E2E_E3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E4_STARTED", {
    segment: "inventory_close",
  });
  steps.push("RELEASE_E2E_E4_STARTED");

  const e4 = runReleaseE2eE4InventoryClose({ cwd: root });
  evidence.e4_checks = e4.checks;
  if (!e4.ok) {
    console.error("[RELEASE-E2E] E4 FAIL:\n" + e4.reason);
    return { ok: false, steps, reason: e4.reason, evidence };
  }
  evidence.e4_mapped_tokens = e4.mapped_tokens;
  evidence.e4_source = e4.source;

  console.info("[RELEASE-E2E]", "RELEASE_E2E_E4_COMPLETED", {
    segment: "inventory_close",
    mapped_tokens: e4.mapped_tokens,
    source: e4.source,
    checks: e4.checks,
  });
  steps.push("RELEASE_E2E_E4_COMPLETED");

  return { ok: true, steps, evidence };
}
