/**
 * Unit check for scripts/lib/flow02-canonical-pipeline.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW02_CANONICAL_STEPS,
  FLOW02_EXIT,
  buildFlow02EvidenceReport,
  computeFlow02Durations,
  evaluateFlow02Progress,
  extractFlow02Steps,
  flow02StepsThrough,
  formatFlow02ComparisonTable,
  validateFlow02Pipeline,
} from "./flow02-canonical-pipeline.mjs";

describe("flow02-canonical-pipeline", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateFlow02Pipeline([...FLOW02_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateFlow02Pipeline([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "FLOW02_T2_STARTED");
    assert.match(formatFlow02ComparisonTable(r), /FLOW02_T2_STARTED/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...FLOW02_CANONICAL_STEPS.slice(0, 2),
      "FLOW02_T1_COMPLETED",
      ...FLOW02_CANONICAL_STEPS.slice(2),
    ];
    const r = validateFlow02Pipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("FLOW02_T1_COMPLETED"));
  });

  it("lists out_of_order steps", () => {
    const r = validateFlow02Pipeline([
      "FLOW02_T1_STARTED",
      "FLOW02_T2_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from [FLOW-02] log lines", () => {
    const steps = extractFlow02Steps([
      "[FLOW-02] FLOW02_T1_STARTED {}",
      "noise",
      "[FLOW-02] FLOW02_T1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, ["FLOW02_T1_STARTED", "FLOW02_T1_COMPLETED"]);
  });

  it("computes diagnostic duration_ms", () => {
    const t0 = 1_000;
    const d = computeFlow02Durations({
      FLOW02_T1_STARTED: t0,
      FLOW02_T1_COMPLETED: t0 + 10,
      FLOW02_T2_STARTED: t0 + 10,
      FLOW02_T2_COMPLETED: t0 + 30,
      FLOW02_T3_STARTED: t0 + 30,
      FLOW02_T3_COMPLETED: t0 + 50,
    });
    assert.equal(d.t1_ms, 10);
    assert.equal(d.t2_ms, 20);
    assert.equal(d.flow_total_ms, 50);
  });

  it("empty pipeline → BLOCKED at FLOW02_T1_STARTED with empty arrays", () => {
    const p = evaluateFlow02Progress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW02_T1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
    assert.equal(FLOW02_EXIT.BLOCKED, 2);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateFlow02Progress([]);
    const report = buildFlow02EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      validation: progress,
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });
    assert.equal(report.gate, "FLOW-02");
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "FLOW02_T1_STARTED");
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.out_of_order, []);
    assert.deepEqual(report.evidence, {});
    assert.equal(report.principle, "Evidence before Implementation");
    assert.deepEqual(report.expected, FLOW02_CANONICAL_STEPS);
  });

  it("PASS through T1 · BLOCKED at T2", () => {
    const pipeline = flow02StepsThrough(1);
    const p = evaluateFlow02Progress(pipeline, { through: 1 });
    assert.equal(p.status, "PASS");
    assert.equal(p.delivery_status, "PASS");
    assert.equal(p.flow_status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW02_T2_STARTED");
  });
});
