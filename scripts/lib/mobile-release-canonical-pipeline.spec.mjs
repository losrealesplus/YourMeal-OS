/**
 * Unit tests for MOBILE-RELEASE-01 canonical pipeline.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MOBILE_RELEASE_CANONICAL_STEPS,
  MOBILE_RELEASE_EXIT,
  buildMobileReleaseEvidenceReport,
  evaluateMobileReleaseProgress,
  extractMobileReleaseSteps,
  mobileReleaseStepsThrough,
  validateMobileReleasePipeline,
} from "./mobile-release-canonical-pipeline.mjs";

describe("mobile-release-canonical-pipeline", () => {
  it("exports MR1–MR5 STARTED/COMPLETED tokens in order", () => {
    assert.equal(MOBILE_RELEASE_CANONICAL_STEPS.length, 10);
    assert.equal(
      MOBILE_RELEASE_CANONICAL_STEPS[0],
      "MOBILE_RELEASE_MR1_STARTED",
    );
    assert.equal(
      MOBILE_RELEASE_CANONICAL_STEPS[9],
      "MOBILE_RELEASE_MR5_COMPLETED",
    );
  });

  it("empty pipeline → BLOCKED at MR1 with empty arrays", () => {
    const progress = evaluateMobileReleaseProgress([]);
    assert.equal(progress.status, "BLOCKED");
    assert.equal(progress.blocked_at, "MOBILE_RELEASE_MR1_STARTED");
    assert.deepEqual(progress.duplicates, []);
    assert.deepEqual(progress.missing, []);
    assert.deepEqual(progress.out_of_order, []);
    assert.equal(MOBILE_RELEASE_EXIT.BLOCKED, 2);
  });

  it("full pipeline validates PASS", () => {
    const r = validateMobileReleasePipeline([...MOBILE_RELEASE_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);

    const progress = evaluateMobileReleaseProgress([
      ...MOBILE_RELEASE_CANONICAL_STEPS,
    ]);
    assert.equal(progress.status, "PASS");
    assert.equal(progress.certified_through, 5);
    assert.equal(progress.blocked_at, null);
  });

  it("duplicate token → FAIL", () => {
    const withDup = [
      ...MOBILE_RELEASE_CANONICAL_STEPS.slice(0, 2),
      "MOBILE_RELEASE_MR1_COMPLETED",
      ...MOBILE_RELEASE_CANONICAL_STEPS.slice(2),
    ];
    const progress = evaluateMobileReleaseProgress(withDup);
    assert.equal(progress.status, "FAIL");
    assert.ok(progress.duplicates.includes("MOBILE_RELEASE_MR1_COMPLETED"));
  });

  it("mobileReleaseStepsThrough(1) is MR1 only", () => {
    assert.deepEqual(mobileReleaseStepsThrough(1), [
      "MOBILE_RELEASE_MR1_STARTED",
      "MOBILE_RELEASE_MR1_COMPLETED",
    ]);
  });

  it("extracts steps from [MOBILE-RELEASE] log lines", () => {
    const steps = extractMobileReleaseSteps([
      "[MOBILE-RELEASE] MOBILE_RELEASE_MR1_STARTED {}",
      "noise",
      "[MOBILE-RELEASE] MOBILE_RELEASE_MR1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, [
      "MOBILE_RELEASE_MR1_STARTED",
      "MOBILE_RELEASE_MR1_COMPLETED",
    ]);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateMobileReleaseProgress([]);
    const report = buildMobileReleaseEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "MOBILE_RELEASE_MR1_STARTED");
    assert.equal(report.certified_through, 0);
    assert.deepEqual(report.evidence, {});
    assert.equal(report.gate, "MOBILE-RELEASE");
  });
});
