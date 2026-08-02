/**
 * Unit check for scripts/lib/flow04-canonical-pipeline.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW04_CANONICAL_STEPS,
  FLOW04_EXIT,
  buildFlow04EvidenceReport,
  computeFlow04Durations,
  evaluateFlow04Progress,
  extractFlow04Steps,
  flow04StepsThrough,
  formatFlow04ComparisonTable,
  validateFlow04Pipeline,
} from "./flow04-canonical-pipeline.mjs";

describe("flow04-canonical-pipeline", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateFlow04Pipeline([...FLOW04_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateFlow04Pipeline([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "FLOW04_T2_STARTED");
    assert.match(formatFlow04ComparisonTable(r), /FLOW04_T2_STARTED/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...FLOW04_CANONICAL_STEPS.slice(0, 2),
      "FLOW04_T1_COMPLETED",
      ...FLOW04_CANONICAL_STEPS.slice(2),
    ];
    const r = validateFlow04Pipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("FLOW04_T1_COMPLETED"));
  });

  it("lists out_of_order steps", () => {
    const r = validateFlow04Pipeline([
      "FLOW04_T1_STARTED",
      "FLOW04_T2_STARTED",
      "FLOW04_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from [FLOW-04] log lines", () => {
    const steps = extractFlow04Steps([
      "[FLOW-04] FLOW04_T1_STARTED {}",
      "noise",
      "[FLOW-04] FLOW04_T1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
  });

  it("computes diagnostic duration_ms", () => {
    const t0 = 1_000;
    const d = computeFlow04Durations({
      FLOW04_T1_STARTED: t0,
      FLOW04_T1_COMPLETED: t0 + 10,
      FLOW04_T2_STARTED: t0 + 10,
      FLOW04_T2_COMPLETED: t0 + 30,
      FLOW04_T3_STARTED: t0 + 30,
      FLOW04_T3_COMPLETED: t0 + 50,
    });
    assert.equal(d.t1_ms, 10);
    assert.equal(d.t2_ms, 20);
    assert.equal(d.flow_total_ms, 50);
  });

  it("empty pipeline → BLOCKED at FLOW04_T1_STARTED with empty arrays", () => {
    const p = evaluateFlow04Progress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW04_T1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
    assert.equal(FLOW04_EXIT.BLOCKED, 2);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateFlow04Progress([]);
    const report = buildFlow04EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      validation: progress,
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });
    assert.equal(report.gate, "FLOW-04");
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "FLOW04_T1_STARTED");
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.out_of_order, []);
    assert.deepEqual(report.evidence, {});
    assert.equal(report.principle, "Evidence before Implementation");
    assert.deepEqual(report.expected, FLOW04_CANONICAL_STEPS);
  });

  it("PASS through T1 · BLOCKED at T2", () => {
    const pipeline = flow04StepsThrough(1);
    const p = evaluateFlow04Progress(pipeline, { through: 1 });
    assert.equal(p.status, "PASS");
    assert.equal(p.delivery_status, "PASS");
    assert.equal(p.flow_status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW04_T2_STARTED");
  });

  it("PASS through T2 · BLOCKED at T3", () => {
    const pipeline = flow04StepsThrough(2);
    const p = evaluateFlow04Progress(pipeline, { through: 2 });
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, "FLOW04_T3_STARTED");
  });

  it("full contract PASS", () => {
    const p = evaluateFlow04Progress([...FLOW04_CANONICAL_STEPS]);
    assert.equal(p.status, "PASS");
    assert.equal(p.flow_status, "PASS");
    assert.equal(p.certified_through, 3);
    assert.equal(p.blocked_at, null);
  });
});
