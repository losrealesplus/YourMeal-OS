/**
 * Unit check for scripts/lib/release-smoke-canonical-pipeline.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_SMOKE_CANONICAL_STEPS,
  RELEASE_SMOKE_EXIT,
  RELEASE_SMOKE_CAPABILITIES,
  buildReleaseSmokeEvidenceReport,
  computeReleaseSmokeDurations,
  evaluateReleaseSmokeProgress,
  extractReleaseSmokeSteps,
  releaseSmokeStepsThrough,
  formatReleaseSmokeComparisonTable,
  validateReleaseSmokePipeline,
} from "./release-smoke-canonical-pipeline.mjs";

describe("release-smoke-canonical-pipeline", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateReleaseSmokePipeline([...RELEASE_SMOKE_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateReleaseSmokePipeline([
      "RELEASE_SMOKE_S1_STARTED",
      "RELEASE_SMOKE_S1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "RELEASE_SMOKE_S2_STARTED");
    assert.match(formatReleaseSmokeComparisonTable(r), /RELEASE_SMOKE_S2_STARTED/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...RELEASE_SMOKE_CANONICAL_STEPS.slice(0, 2),
      "RELEASE_SMOKE_S1_COMPLETED",
      ...RELEASE_SMOKE_CANONICAL_STEPS.slice(2),
    ];
    const r = validateReleaseSmokePipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("RELEASE_SMOKE_S1_COMPLETED"));
  });

  it("lists out_of_order steps", () => {
    const r = validateReleaseSmokePipeline([
      "RELEASE_SMOKE_S1_STARTED",
      "RELEASE_SMOKE_S2_STARTED",
      "RELEASE_SMOKE_S1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from [RELEASE-SMOKE] log lines", () => {
    const steps = extractReleaseSmokeSteps([
      "[RELEASE-SMOKE] RELEASE_SMOKE_S1_STARTED {}",
      "noise",
      "[RELEASE-SMOKE] RELEASE_SMOKE_S1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, [
      "RELEASE_SMOKE_S1_STARTED",
      "RELEASE_SMOKE_S1_COMPLETED",
    ]);
  });

  it("computes diagnostic duration_ms", () => {
    const t0 = 1_000;
    const d = computeReleaseSmokeDurations({
      RELEASE_SMOKE_S1_STARTED: t0,
      RELEASE_SMOKE_S1_COMPLETED: t0 + 10,
      RELEASE_SMOKE_S2_STARTED: t0 + 10,
      RELEASE_SMOKE_S2_COMPLETED: t0 + 30,
      RELEASE_SMOKE_S3_STARTED: t0 + 30,
      RELEASE_SMOKE_S3_COMPLETED: t0 + 40,
      RELEASE_SMOKE_S4_STARTED: t0 + 40,
      RELEASE_SMOKE_S4_COMPLETED: t0 + 55,
    });
    assert.equal(d.s1_ms, 10);
    assert.equal(d.s2_ms, 20);
    assert.equal(d.smoke_total_ms, 55);
  });

  it("empty pipeline → BLOCKED at RELEASE_SMOKE_S1_STARTED with empty arrays", () => {
    const p = evaluateReleaseSmokeProgress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_SMOKE_S1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
    assert.equal(RELEASE_SMOKE_EXIT.BLOCKED, 2);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateReleaseSmokeProgress([]);
    const report = buildReleaseSmokeEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      validation: progress,
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });
    assert.equal(report.gate, "RELEASE-SMOKE");
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "RELEASE_SMOKE_S1_STARTED");
    assert.equal(report.level, "release");
    assert.equal(report.certifies, "platform_capabilities");
    assert.equal(report.not_domain_entities, true);
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.out_of_order, []);
    assert.deepEqual(report.evidence, {});
    assert.equal(report.principle, "Evidence before Implementation");
    assert.deepEqual(report.expected, RELEASE_SMOKE_CANONICAL_STEPS);
  });

  it("PASS through S1 · BLOCKED at S2", () => {
    const pipeline = releaseSmokeStepsThrough(1);
    const p = evaluateReleaseSmokeProgress(pipeline, { through: 1 });
    assert.equal(p.status, "PASS");
    assert.equal(p.delivery_status, "PASS");
    assert.equal(p.gate_status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_SMOKE_S2_STARTED");
    assert.equal(RELEASE_SMOKE_CAPABILITIES[1], "preflight");
  });

  it("capabilities are platform labels not domain states", () => {
    assert.deepEqual(
      [...Object.values(RELEASE_SMOKE_CAPABILITIES)],
      ["preflight", "auth", "bootstrap", "dashboard"],
    );
  });
});
