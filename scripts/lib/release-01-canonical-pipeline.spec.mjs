/**
 * Unit tests for RELEASE-01 canonical pipeline (no infra · no CI · no drivers).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_01_CANONICAL_STEPS,
  RELEASE_01_EXIT,
  evaluateRelease01Progress,
  validateRelease01Pipeline,
} from "./release-01-canonical-pipeline.mjs";

describe("release-01-canonical-pipeline", () => {
  it("exports P1–P5 STARTED/COMPLETED tokens in order", () => {
    assert.equal(RELEASE_01_CANONICAL_STEPS.length, 10);
    assert.equal(
      RELEASE_01_CANONICAL_STEPS[0],
      "RELEASE_01_P1_STARTED",
    );
    assert.equal(
      RELEASE_01_CANONICAL_STEPS[9],
      "RELEASE_01_P5_COMPLETED",
    );
    assert.equal(RELEASE_01_EXIT.BLOCKED, 2);
  });

  it("empty pipeline → BLOCKED at P1 with empty arrays", () => {
    const p = evaluateRelease01Progress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_01_P1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
  });

  it("full pipeline validates PASS", () => {
    const v = validateRelease01Pipeline([
      ...RELEASE_01_CANONICAL_STEPS,
    ]);
    assert.equal(v.ok, true);
    const p = evaluateRelease01Progress([
      ...RELEASE_01_CANONICAL_STEPS,
    ]);
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, null);
    assert.equal(p.certified_through, 5);
  });

  it("duplicate token → FAIL", () => {
    const steps = [
      "RELEASE_01_P1_STARTED",
      "RELEASE_01_P1_STARTED",
    ];
    const p = evaluateRelease01Progress(steps);
    assert.equal(p.status, "FAIL");
    assert.ok(p.duplicates.includes("RELEASE_01_P1_STARTED"));
  });
});
