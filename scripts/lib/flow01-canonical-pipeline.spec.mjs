/**
 * Unit check for scripts/lib/flow01-canonical-pipeline.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLOW01_CANONICAL_STEPS,
  FLOW01_EXIT,
  buildFlow01EvidenceReport,
  classifyFlow01Outcome,
  computeFlow01Durations,
  extractFlow01Steps,
  formatFlow01ComparisonTable,
  validateFlow01Pipeline,
} from "./flow01-canonical-pipeline.mjs";

describe("flow01-canonical-pipeline", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateFlow01Pipeline([...FLOW01_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
    assert.deepEqual(r.duplicates, []);
    assert.deepEqual(r.missing, []);
    assert.deepEqual(r.out_of_order, []);
  });

  it("FAIL names first missing step", () => {
    const r = validateFlow01Pipeline([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "FLOW01_T2_STARTED");
    assert.match(formatFlow01ComparisonTable(r), /FLOW01_T2_STARTED/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...FLOW01_CANONICAL_STEPS.slice(0, 2),
      "FLOW01_T1_COMPLETED",
      ...FLOW01_CANONICAL_STEPS.slice(2),
    ];
    const r = validateFlow01Pipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("FLOW01_T1_COMPLETED"));
  });

  it("lists out_of_order steps", () => {
    const r = validateFlow01Pipeline([
      "FLOW01_T1_STARTED",
      "FLOW01_T2_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.out_of_order.length > 0);
  });

  it("extracts steps from [FLOW-01] log lines", () => {
    const steps = extractFlow01Steps([
      "[FLOW-01] FLOW01_T1_STARTED {}",
      "noise",
      "[FLOW-01] FLOW01_T1_COMPLETED {}",
    ]);
    assert.deepEqual(steps, ["FLOW01_T1_STARTED", "FLOW01_T1_COMPLETED"]);
  });

  it("computes diagnostic duration_ms", () => {
    const t0 = 1_000;
    const d = computeFlow01Durations({
      FLOW01_T1_STARTED: t0,
      FLOW01_T1_COMPLETED: t0 + 10,
      FLOW01_T2_STARTED: t0 + 10,
      FLOW01_T2_COMPLETED: t0 + 30,
      FLOW01_T3_STARTED: t0 + 30,
      FLOW01_T3_COMPLETED: t0 + 50,
      FLOW01_T4_STARTED: t0 + 50,
      FLOW01_T4_COMPLETED: t0 + 90,
    });
    assert.equal(d.t1_ms, 10);
    assert.equal(d.t2_ms, 20);
    assert.equal(d.flow_total_ms, 90);
  });

  it("builds evidence envelope with terminal delivered/CLOSED on PASS", () => {
    const pipeline = [...FLOW01_CANONICAL_STEPS];
    const validation = validateFlow01Pipeline(pipeline);
    const report = buildFlow01EvidenceReport({
      status: "PASS",
      pipeline,
      validation,
      code_status: "RUNNER_ONLY",
    });
    assert.equal(report.gate, "FLOW-01");
    assert.deepEqual(report.pipeline, FLOW01_CANONICAL_STEPS);
    assert.equal(report.terminal.order_status, "delivered");
    assert.equal(report.terminal.packaging_batch, "CLOSED");
    assert.equal(report.principle, "Evidence before Implementation");
  });

  it("classifies live without driver as BLOCKED", () => {
    const o = classifyFlow01Outcome({
      mode: "live",
      validationOk: false,
      pipelineStarted: false,
      domainDriverReady: false,
    });
    assert.equal(o.status, "BLOCKED");
    assert.equal(FLOW01_EXIT[o.status], 2);
  });

  it("classifies self-test PASS", () => {
    const o = classifyFlow01Outcome({
      mode: "self-test",
      validationOk: true,
      pipelineStarted: true,
      domainDriverReady: false,
    });
    assert.equal(o.status, "PASS");
    assert.equal(FLOW01_EXIT.PASS, 0);
  });
});
