/**
 * RELEASE-E2E · Capability driver (pilot journey — not Smoke/Cross-flow re-run).
 *
 * E1 = Platform Entry (RELEASE-SMOKE)
 * E2 = Order → Delivery (FLOW-01)
 * E3…E4 = not implemented in RELEASE-E2E-002
 */
import { runReleaseE2eE1PlatformEntry } from "./release-e2e-e1-platform-entry.mjs";
import { runReleaseE2eE2OrderDelivery } from "./release-e2e-e2-order-delivery.mjs";

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

  return {
    ok: false,
    steps,
    reason:
      "RELEASE-E2E E3+ not implemented (E2 only · Evidence before Implementation)",
    evidence,
  };
}
