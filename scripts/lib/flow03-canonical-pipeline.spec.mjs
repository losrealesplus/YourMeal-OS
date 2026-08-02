/**
 * Unit check for scripts/lib/flow03-canonical-pipeline.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW03_CANONICAL_STEPS,
  FLOW03_EXIT,
  buildFlow03EvidenceReport,
  computeFlow03Durations,
  evaluateFlow03Progress,
  extractFlow03Steps,
  flow03StepsThrough,
  formatFlow03ComparisonTable,
  validateFlow03Pipeline,
} from "./flow03-canonical-pipeline.mjs";

describe("flow03-canonical-pipeline", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateFlow03Pipeline([...FLOW03_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateFlow03Pipeline([
      "FLOW03_T1_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "FLOW03_T2_STARTED");
    assert.match(formatFlow03ComparisonTable(r), /FLOW03_T2_STARTED/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...FLOW03_CANONICAL_STEPS.slice(0, 2),
      "FLOW03_T1_COMPLETED",
      ...FLOW03_CANONICAL_STEPS.slice(2),
    ];
    const r = validateFlow03Pipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("FLOW03_T1_COMPLETED"));
  });

  it("lists out_of_order steps", () => {
    const r = validateFlow03Pipeline([
      "FLOW03_T1_STARTED",
      "FLOW03_T2_STARTED",
      "FLOW03_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from [FLOW-03] log lines", () => {
    const steps = extractFlow03Steps([
      "[FLOW-03] FLOW03_T1_STARTED {}",
      "noise",
      "[FLOW-03] FLOW03_T1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, ["FLOW03_T1_STARTED", "FLOW03_T1_COMPLETED"]);
  });

  it("computes diagnostic duration_ms", () => {
    const t0 = 1_000;
    const d = computeFlow03Durations({
      FLOW03_T1_STARTED: t0,
      FLOW03_T1_COMPLETED: t0 + 10,
      FLOW03_T2_STARTED: t0 + 10,
      FLOW03_T2_COMPLETED: t0 + 30,
      FLOW03_T3_STARTED: t0 + 30,
      FLOW03_T3_COMPLETED: t0 + 50,
    });
    assert.equal(d.t1_ms, 10);
    assert.equal(d.t2_ms, 20);
    assert.equal(d.flow_total_ms, 50);
  });

  it("empty pipeline → BLOCKED at FLOW03_T1_STARTED with empty arrays", () => {
    const p = evaluateFlow03Progress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW03_T1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
    assert.equal(FLOW03_EXIT.BLOCKED, 2);
  });

  it("builds evidence envelope for runner-only BLOCKED", () => {
    const progress = evaluateFlow03Progress([]);
    const report = buildFlow03EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: [],
      validation: progress,
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });
    assert.equal(report.gate, "FLOW-03");
    assert.equal(report.status, "BLOCKED");
    assert.equal(report.blocked_at, "FLOW03_T1_STARTED");
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.missing, []);
    assert.deepEqual(report.out_of_order, []);
    assert.deepEqual(report.evidence, {});
    assert.equal(report.principle, "Evidence before Implementation");
    assert.deepEqual(report.expected, FLOW03_CANONICAL_STEPS);
  });

  it("PASS through T1 · BLOCKED at T2", () => {
    const pipeline = flow03StepsThrough(1);
    const p = evaluateFlow03Progress(pipeline, { through: 1 });
    assert.equal(p.status, "PASS");
    assert.equal(p.delivery_status, "PASS");
    assert.equal(p.flow_status, "BLOCKED");
    assert.equal(p.blocked_at, "FLOW03_T2_STARTED");
  });

  it("PASS through T2 · BLOCKED at T3", () => {
    const pipeline = flow03StepsThrough(2);
    const p = evaluateFlow03Progress(pipeline, { through: 2 });
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, "FLOW03_T3_STARTED");
  });

  it("full contract PASS", () => {
    const p = evaluateFlow03Progress([...FLOW03_CANONICAL_STEPS]);
    assert.equal(p.status, "PASS");
    assert.equal(p.flow_status, "PASS");
    assert.equal(p.certified_through, 3);
    assert.equal(p.blocked_at, null);
  });
});
