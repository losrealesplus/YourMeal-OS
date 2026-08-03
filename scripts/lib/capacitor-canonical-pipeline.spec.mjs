/**
 * Unit tests for Capacitor Distribution canonical pipeline.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CAPACITOR_CANONICAL_STEPS,
  CAPACITOR_EXIT,
  buildCapacitorEvidenceReport,
  capacitorStepsThrough,
  evaluateCapacitorProgress,
  extractCapacitorSteps,
  formatCapacitorComparisonTable,
  validateCapacitorPipeline,
} from "./capacitor-canonical-pipeline.mjs";

describe("capacitor-canonical-pipeline", () => {
  it("exports C1–C5 STARTED/COMPLETED tokens in order", () => {
    assert.equal(CAPACITOR_CANONICAL_STEPS.length, 10);
    assert.equal(CAPACITOR_CANONICAL_STEPS[0], "CAPACITOR_C1_STARTED");
    assert.equal(CAPACITOR_CANONICAL_STEPS[9], "CAPACITOR_C5_COMPLETED");
  });

  it("empty pipeline → BLOCKED at C1 with empty arrays", () => {
    const progress = evaluateCapacitorProgress([]);
    assert.equal(progress.status, "BLOCKED");
    assert.equal(progress.blocked_at, "CAPACITOR_C1_STARTED");
    assert.deepEqual(progress.duplicates, []);
    assert.deepEqual(progress.missing, []);
    assert.deepEqual(progress.out_of_order, []);
    assert.equal(CAPACITOR_EXIT.BLOCKED, 2);
  });

  it("full pipeline validates PASS", () => {
    const r = validateCapacitorPipeline([...CAPACITOR_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);

    const progress = evaluateCapacitorProgress([...CAPACITOR_CANONICAL_STEPS]);
    assert.equal(progress.status, "PASS");
    assert.equal(progress.certified_through, 5);
    assert.equal(progress.blocked_at, null);
  });

  it("duplicate token → FAIL", () => {
    const withDup = [
      ...CAPACITOR_CANONICAL_STEPS.slice(0, 2),
      "CAPACITOR_C1_COMPLETED",
      ...CAPACITOR_CANONICAL_STEPS.slice(2),
    ];
    const progress = evaluateCapacitorProgress(withDup);
    assert.equal(progress.status, "FAIL");
    assert.ok(progress.duplicates.includes("CAPACITOR_C1_COMPLETED"));
  });

  it("capacitorStepsThrough(1) is C1 only", () => {
    assert.deepEqual(capacitorStepsThrough(1), [
      "CAPACITOR_C1_STARTED",
      "CAPACITOR_C1_COMPLETED",
    ]);
  });

  it("extracts steps from [CAPACITOR] log lines", () => {
    const steps = extractCapacitorSteps([
      "[CAPACITOR] CAPACITOR_C1_STARTED {}",
      "noise",
      "[CAPACITOR] CAPACITOR_C1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, [
      "CAPACITOR_C1_STARTED",
      "CAPACITOR_C1_COMPLETED",
    ]);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateCapacitorProgress([]);
    const report = buildCapacitorEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      progress,
      evidence: {},
    });
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "CAPACITOR_C1_STARTED");
    assert.equal(report.level, "distribution");
    assert.equal(report.core_integrity, true);
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.evidence, {});
    assert.ok(formatCapacitorComparisonTable(progress).includes("CAPACITOR_C1"));
  });
});
