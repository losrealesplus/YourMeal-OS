/**
 * Unit check for scripts/lib/canonical-pipeline.mjs (Node test runner).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractFcr008Steps,
  formatPipelineComparisonTable,
  PS002_CANONICAL_STEPS,
  validateCanonicalPipeline,
} from "./canonical-pipeline.mjs";

describe("canonical-pipeline (PS-002-C)", () => {
  it("PASS full ordered once-only contract", () => {
    const r = validateCanonicalPipeline([...PS002_CANONICAL_STEPS]);
    assert.equal(r.ok, true);
    assert.equal(r.firstFailure, null);
  });

  it("FAIL names first missing step", () => {
    const r = validateCanonicalPipeline([
      "LOGIN",
      "LOGIN_OK",
      "CANONICAL_SESSION",
      "BOOTSTRAP_START",
    ]);
    assert.equal(r.ok, false);
    assert.equal(r.firstFailure, "IDENTITY_READY");
    assert.match(formatPipelineComparisonTable(r), /IDENTITY_READY/);
  });

  it("FAIL on duplicates", () => {
    const withDup = [
      ...PS002_CANONICAL_STEPS.slice(0, 4),
      "BOOTSTRAP_START",
      ...PS002_CANONICAL_STEPS.slice(4),
    ];
    const r = validateCanonicalPipeline(withDup);
    assert.equal(r.ok, false);
    assert.ok(r.duplicates.includes("BOOTSTRAP_START"));
  });

  it("extracts steps from console lines", () => {
    const steps = extractFcr008Steps([
      "[FCR-008] LOGIN {pipelineId: x}",
      "noise",
      "[FCR-008] LOGIN_OK {}",
      "[FCR-008] HOME_PATH {path: /admin}",
    ]);
    assert.deepEqual(steps, ["LOGIN", "LOGIN_OK", "HOME_PATH_RESOLVED"]);
  });
});
