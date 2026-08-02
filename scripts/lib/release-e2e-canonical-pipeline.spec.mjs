/**
 * Unit tests for RELEASE-E2E canonical pipeline (no domain · no Playwright).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_E2E_CANONICAL_STEPS,
  RELEASE_E2E_EXIT,
  evaluateReleaseE2eProgress,
  validateReleaseE2ePipeline,
} from "./release-e2e-canonical-pipeline.mjs";

describe("release-e2e-canonical-pipeline", () => {
  it("exports E1–E4 STARTED/COMPLETED tokens in order", () => {
    assert.equal(RELEASE_E2E_CANONICAL_STEPS.length, 8);
    assert.equal(RELEASE_E2E_CANONICAL_STEPS[0], "RELEASE_E2E_E1_STARTED");
    assert.equal(RELEASE_E2E_CANONICAL_STEPS[7], "RELEASE_E2E_E4_COMPLETED");
    assert.equal(RELEASE_E2E_EXIT.BLOCKED, 2);
  });

  it("empty pipeline → BLOCKED at E1 with empty arrays", () => {
    const p = evaluateReleaseE2eProgress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_E2E_E1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
  });

  it("full pipeline validates PASS", () => {
    const v = validateReleaseE2ePipeline([...RELEASE_E2E_CANONICAL_STEPS]);
    assert.equal(v.ok, true);
    const p = evaluateReleaseE2eProgress([...RELEASE_E2E_CANONICAL_STEPS]);
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, null);
    assert.equal(p.certified_through, 4);
  });

  it("duplicate token → FAIL", () => {
    const steps = ["RELEASE_E2E_E1_STARTED", "RELEASE_E2E_E1_STARTED"];
    const p = evaluateReleaseE2eProgress(steps);
    assert.equal(p.status, "FAIL");
    assert.ok(p.duplicates.includes("RELEASE_E2E_E1_STARTED"));
  });
});
