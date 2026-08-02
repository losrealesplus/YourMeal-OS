/**
 * RELEASE-SMOKE · Capability driver (platform — not domain).
 *
 * S1 = preflight · S2 = Auth · S3 = Bootstrap · S4 = Dashboard
 * (PS-002-C mapped · no Cross-flow · no full Playwright E2E).
 */
import { runReleaseSmokeS1Preflight } from "./release-smoke-s1-preflight.mjs";
import { runReleaseSmokeS2Auth } from "./release-smoke-s2-auth.mjs";
import { runReleaseSmokeS3Bootstrap } from "./release-smoke-s3-bootstrap.mjs";
import { runReleaseSmokeS4Dashboard } from "./release-smoke-s4-dashboard.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runReleaseSmokeCapabilityDriver({ root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = {};

  if (max < 1) {
    return {
      ok: false,
      steps,
      reason: "Capability driver invoked with through < S1",
    };
  }

  // —— S1 · Preflight ——
  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S1_STARTED", {
    capability: "preflight",
  });
  steps.push("RELEASE_SMOKE_S1_STARTED");

  const s1 = runReleaseSmokeS1Preflight({ cwd: root });
  evidence.s1_checks = s1.checks;
  if (!s1.ok) {
    console.error("[RELEASE-SMOKE] S1 preflight FAIL:\n" + s1.reason);
    return { ok: false, steps, reason: s1.reason, evidence };
  }

  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S1_COMPLETED", {
    capability: "preflight",
    checks: s1.checks,
  });
  steps.push("RELEASE_SMOKE_S1_COMPLETED");

  if (max < 2) return { ok: true, steps, evidence };

  // —— S2 · Auth ——
  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S2_STARTED", {
    capability: "auth",
  });
  steps.push("RELEASE_SMOKE_S2_STARTED");

  const s2 = runReleaseSmokeS2Auth({ cwd: root });
  evidence.s2_checks = s2.checks;
  if (!s2.ok) {
    console.error("[RELEASE-SMOKE] S2 auth FAIL:\n" + s2.reason);
    return { ok: false, steps, reason: s2.reason, evidence };
  }
  evidence.s2_mapped_tokens = s2.mapped_tokens;
  evidence.s2_source = s2.source;

  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S2_COMPLETED", {
    capability: "auth",
    mapped_tokens: s2.mapped_tokens,
    source: s2.source,
    checks: s2.checks,
  });
  steps.push("RELEASE_SMOKE_S2_COMPLETED");

  if (max < 3) return { ok: true, steps, evidence };

  // —— S3 · Bootstrap ——
  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S3_STARTED", {
    capability: "bootstrap",
  });
  steps.push("RELEASE_SMOKE_S3_STARTED");

  const s3 = runReleaseSmokeS3Bootstrap({ cwd: root });
  evidence.s3_checks = s3.checks;
  if (!s3.ok) {
    console.error("[RELEASE-SMOKE] S3 bootstrap FAIL:\n" + s3.reason);
    return { ok: false, steps, reason: s3.reason, evidence };
  }
  evidence.s3_mapped_tokens = s3.mapped_tokens;
  evidence.s3_source = s3.source;

  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S3_COMPLETED", {
    capability: "bootstrap",
    mapped_tokens: s3.mapped_tokens,
    source: s3.source,
    checks: s3.checks,
  });
  steps.push("RELEASE_SMOKE_S3_COMPLETED");

  if (max < 4) return { ok: true, steps, evidence };

  // —— S4 · Dashboard ——
  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S4_STARTED", {
    capability: "dashboard",
  });
  steps.push("RELEASE_SMOKE_S4_STARTED");

  const s4 = runReleaseSmokeS4Dashboard({ cwd: root });
  evidence.s4_checks = s4.checks;
  if (!s4.ok) {
    console.error("[RELEASE-SMOKE] S4 dashboard FAIL:\n" + s4.reason);
    return { ok: false, steps, reason: s4.reason, evidence };
  }
  evidence.s4_mapped_tokens = s4.mapped_tokens;
  evidence.s4_source = s4.source;

  console.info("[RELEASE-SMOKE]", "RELEASE_SMOKE_S4_COMPLETED", {
    capability: "dashboard",
    mapped_tokens: s4.mapped_tokens,
    source: s4.source,
    checks: s4.checks,
  });
  steps.push("RELEASE_SMOKE_S4_COMPLETED");

  return { ok: true, steps, evidence };
}
