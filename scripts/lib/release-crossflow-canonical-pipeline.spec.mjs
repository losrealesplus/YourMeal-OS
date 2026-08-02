/**
 * Unit tests for RELEASE-CROSSFLOW canonical pipeline (no domain).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_CROSSFLOW_CANONICAL_STEPS,
  RELEASE_CROSSFLOW_EXIT,
  evaluateReleaseCrossflowProgress,
  validateReleaseCrossflowPipeline,
} from "./release-crossflow-canonical-pipeline.mjs";

describe("release-crossflow-canonical-pipeline", () => {
  it("exports C1–C4 STARTED/COMPLETED tokens in order", () => {
    assert.equal(RELEASE_CROSSFLOW_CANONICAL_STEPS.length, 8);
    assert.equal(
      RELEASE_CROSSFLOW_CANONICAL_STEPS[0],
      "RELEASE_CROSSFLOW_C1_STARTED",
    );
    assert.equal(
      RELEASE_CROSSFLOW_CANONICAL_STEPS[7],
      "RELEASE_CROSSFLOW_C4_COMPLETED",
    );
    assert.equal(RELEASE_CROSSFLOW_EXIT.BLOCKED, 2);
  });

  it("empty pipeline → BLOCKED at C1 with empty arrays", () => {
    const p = evaluateReleaseCrossflowProgress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_CROSSFLOW_C1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
  });

  it("full pipeline validates PASS", () => {
    const v = validateReleaseCrossflowPipeline([
      ...RELEASE_CROSSFLOW_CANONICAL_STEPS,
    ]);
    assert.equal(v.ok, true);
    const p = evaluateReleaseCrossflowProgress([
      ...RELEASE_CROSSFLOW_CANONICAL_STEPS,
    ]);
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, null);
    assert.equal(p.certified_through, 4);
  });

  it("duplicate token → FAIL", () => {
    const steps = [
      "RELEASE_CROSSFLOW_C1_STARTED",
      "RELEASE_CROSSFLOW_C1_STARTED",
    ];
    const p = evaluateReleaseCrossflowProgress(steps);
    assert.equal(p.status, "FAIL");
    assert.ok(p.duplicates.includes("RELEASE_CROSSFLOW_C1_STARTED"));
  });
});
