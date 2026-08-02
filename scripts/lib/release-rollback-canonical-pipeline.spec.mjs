/**
 * Unit tests for RELEASE-ROLLBACK canonical pipeline (no infra · no CI · no restore).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_ROLLBACK_CANONICAL_STEPS,
  RELEASE_ROLLBACK_EXIT,
  evaluateReleaseRollbackProgress,
  validateReleaseRollbackPipeline,
} from "./release-rollback-canonical-pipeline.mjs";

describe("release-rollback-canonical-pipeline", () => {
  it("exports R1–R3 STARTED/COMPLETED tokens in order", () => {
    assert.equal(RELEASE_ROLLBACK_CANONICAL_STEPS.length, 6);
    assert.equal(RELEASE_ROLLBACK_CANONICAL_STEPS[0], "RELEASE_ROLLBACK_R1_STARTED");
    assert.equal(RELEASE_ROLLBACK_CANONICAL_STEPS[5], "RELEASE_ROLLBACK_R3_COMPLETED");
    assert.equal(RELEASE_ROLLBACK_EXIT.BLOCKED, 2);
  });

  it("empty pipeline → BLOCKED at R1 with empty arrays", () => {
    const p = evaluateReleaseRollbackProgress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_ROLLBACK_R1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
  });

  it("full pipeline validates PASS", () => {
    const v = validateReleaseRollbackPipeline([...RELEASE_ROLLBACK_CANONICAL_STEPS]);
    assert.equal(v.ok, true);
    const p = evaluateReleaseRollbackProgress([...RELEASE_ROLLBACK_CANONICAL_STEPS]);
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, null);
    assert.equal(p.certified_through, 3);
  });

  it("duplicate token → FAIL", () => {
    const steps = ["RELEASE_ROLLBACK_R1_STARTED", "RELEASE_ROLLBACK_R1_STARTED"];
    const p = evaluateReleaseRollbackProgress(steps);
    assert.equal(p.status, "FAIL");
    assert.ok(p.duplicates.includes("RELEASE_ROLLBACK_R1_STARTED"));
  });
});
