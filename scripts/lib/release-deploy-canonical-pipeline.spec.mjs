/**
 * Unit tests for RELEASE-DEPLOY canonical pipeline (no infra · no CI · no deploy).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELEASE_DEPLOY_CANONICAL_STEPS,
  RELEASE_DEPLOY_EXIT,
  evaluateReleaseDeployProgress,
  validateReleaseDeployPipeline,
} from "./release-deploy-canonical-pipeline.mjs";

describe("release-deploy-canonical-pipeline", () => {
  it("exports D1–D3 STARTED/COMPLETED tokens in order", () => {
    assert.equal(RELEASE_DEPLOY_CANONICAL_STEPS.length, 6);
    assert.equal(RELEASE_DEPLOY_CANONICAL_STEPS[0], "RELEASE_DEPLOY_D1_STARTED");
    assert.equal(RELEASE_DEPLOY_CANONICAL_STEPS[5], "RELEASE_DEPLOY_D3_COMPLETED");
    assert.equal(RELEASE_DEPLOY_EXIT.BLOCKED, 2);
  });

  it("empty pipeline → BLOCKED at D1 with empty arrays", () => {
    const p = evaluateReleaseDeployProgress([]);
    assert.equal(p.status, "BLOCKED");
    assert.equal(p.blocked_at, "RELEASE_DEPLOY_D1_STARTED");
    assert.deepEqual(p.duplicates, []);
    assert.deepEqual(p.missing, []);
    assert.deepEqual(p.out_of_order, []);
  });

  it("full pipeline validates PASS", () => {
    const v = validateReleaseDeployPipeline([...RELEASE_DEPLOY_CANONICAL_STEPS]);
    assert.equal(v.ok, true);
    const p = evaluateReleaseDeployProgress([...RELEASE_DEPLOY_CANONICAL_STEPS]);
    assert.equal(p.status, "PASS");
    assert.equal(p.blocked_at, null);
    assert.equal(p.certified_through, 3);
  });

  it("duplicate token → FAIL", () => {
    const steps = ["RELEASE_DEPLOY_D1_STARTED", "RELEASE_DEPLOY_D1_STARTED"];
    const p = evaluateReleaseDeployProgress(steps);
    assert.equal(p.status, "FAIL");
    assert.ok(p.duplicates.includes("RELEASE_DEPLOY_D1_STARTED"));
  });
});
