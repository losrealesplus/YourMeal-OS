/**
 * Unit check for scripts/lib/canonical-pipeline.mjs (Node test runner).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPs002cEvidenceReport,
  computePipelineDurations,
  extractFcr008Steps,
  formatPipelineComparisonTable,
  PS002_CANONICAL_STEPS,
  validateCanonicalPipeline,
} from "./canonical-pipeline.mjs";

describe("canonical-pipeline (PS-002-C)", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateCanonicalPipeline([...PS002_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateCanonicalPipeline([
      "LOGIN",
      "LOGIN_OK",
      "CANONICAL_SESSION",
      "BOOTSTRAP_START",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "IDENTITY_READY");
    assert.match(formatPipelineComparisonTable(r), /IDENTITY_READY/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...PS002_CANONICAL_STEPS.slice(0, 4),
      "BOOTSTRAP_START",
      ...PS002_CANONICAL_STEPS.slice(4),
    ];
    const r = validateCanonicalPipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("BOOTSTRAP_START"));
  });

  it("lists out_of_order steps", () => {
    const r = validateCanonicalPipeline([
      "LOGIN",
      "CANONICAL_SESSION",
      "LOGIN_OK",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from console lines", () => {
    const steps = extractFcr008Steps([
      "[FCR-008] LOGIN {pipelineId: x}",
      "noise",
      "[FCR-008] LOGIN_OK {}",
      "[FCR-008] HOME_PATH {path: /admin}",
    ]);
    assert.deepEqual(steps, ["LOGIN", "LOGIN_OK", "HOME_PATH_RESOLVED"]);
  });

  it("computes duration_ms spans for regression comparison", () => {
    const t0 = 1_000;
    const d = computePipelineDurations({
      LOGIN: t0,
      CANONICAL_SESSION: t0 + 87,
      BOOTSTRAP_START: t0 + 87 + 24,
      DASHBOARD_RENDERED: t0 + 87 + 24 + 163,
    });
    assert.deepEqual(d, {
      login_to_session: 87,
      session_to_bootstrap: 24,
      bootstrap_to_dashboard: 163,
    });
  });

  it("buildPs002cEvidenceReport matches canonical envelope", () => {
    const pipeline = [...PS002_CANONICAL_STEPS];
    const validation = validateCanonicalPipeline(pipeline);
    const report = buildPs002cEvidenceReport({
      status: "PASS",
      pipeline,
      validation,
      duration_ms: {
        login_to_session: 87,
        session_to_bootstrap: 24,
        bootstrap_to_dashboard: 163,
      },
    });
    assert.equal(report.status, "PASS");
    assert.deepEqual(report.pipeline, PS002_CANONICAL_STEPS);
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.out_of_order, []);
    assert.equal(report.duration_ms.login_to_session, 87);
    assert.equal(report.auth, "supabase_real");
  });
});
