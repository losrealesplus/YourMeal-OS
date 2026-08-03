/**
 * Unit tests for FLOW-05 canonical pipeline.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW05_CANONICAL_STEPS,
  FLOW05_EXIT,
  buildFlow05EvidenceReport,
  evaluateFlow05Progress,
  extractFlow05Steps,
  flow05StepsThrough,
  formatFlow05ComparisonTable,
  validateFlow05Pipeline,
} from "./flow-05-canonical-pipeline.mjs";

describe("flow-05-canonical-pipeline", () => {
  it("exports B1–B8 STARTED/COMPLETED tokens in order", () => {
    assert.equal(FLOW05_CANONICAL_STEPS.length, 16);
    assert.equal(FLOW05_CANONICAL_STEPS[0], "FLOW05_B1_STARTED");
    assert.equal(FLOW05_CANONICAL_STEPS[15], "FLOW05_B8_COMPLETED");
  });

  it("empty pipeline → BLOCKED at B1 with empty arrays", () => {
    const progress = evaluateFlow05Progress([]);
    assert.equal(progress.status, "BLOCKED");
    assert.equal(progress.blocked_at, "FLOW05_B1_STARTED");
    assert.deepEqual(progress.duplicates, []);
    assert.deepEqual(progress.missing, []);
    assert.deepEqual(progress.out_of_order, []);
    assert.equal(FLOW05_EXIT.BLOCKED, 2);
  });

  it("full pipeline validates PASS", () => {
    const r = validateFlow05Pipeline([...FLOW05_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);

    const progress = evaluateFlow05Progress([...FLOW05_CANONICAL_STEPS]);
    assert.equal(progress.status, "PASS");
    assert.equal(progress.certified_through, 8);
    assert.equal(progress.blocked_at, null);
  });

  it("duplicate token → FAIL", () => {
    const withDup = [
      ...FLOW05_CANONICAL_STEPS.slice(0, 2),
      "FLOW05_B1_COMPLETED",
      ...FLOW05_CANONICAL_STEPS.slice(2),
    ];
    const progress = evaluateFlow05Progress(withDup);
    assert.equal(progress.status, "FAIL");
    assert.ok(progress.duplicates.includes("FLOW05_B1_COMPLETED"));
  });

  it("flow05StepsThrough(1) is B1 only", () => {
    assert.deepEqual(flow05StepsThrough(1), [
      "FLOW05_B1_STARTED",
      "FLOW05_B1_COMPLETED",
    ]);
  });

  it("extracts steps from [FLOW-05] log lines", () => {
    const steps = extractFlow05Steps([
      "[FLOW-05] FLOW05_B1_STARTED {}",
      "noise",
      "[FLOW-05] FLOW05_B1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, ["FLOW05_B1_STARTED", "FLOW05_B1_COMPLETED"]);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateFlow05Progress([]);
    const report = buildFlow05EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      progress,
      evidence: {},
    });
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "FLOW05_B1_STARTED");
    assert.deepEqual(report.evidence, {});
    assert.equal(report.tenant_agnostic, true);
    assert.match(formatFlow05ComparisonTable(progress), /FLOW05_B1_STARTED/);
  });
});
