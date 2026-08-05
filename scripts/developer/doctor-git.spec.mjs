import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorGit } from "./doctor-git.mjs";
import { makeTempRepo } from "./test-fixtures.mjs";

describe("doctor-git", () => {
  it("PASS on the real workspace repository", () => {
    const r = runDoctorGit({ cwd: process.cwd() });
    assert.equal(r.ok, true);
    assert.ok(r.evidence.branch);
  });

  it("FAIL on a non-git temp directory", () => {
    const cwd = makeTempRepo();
    const r = runDoctorGit({ cwd });
    assert.equal(r.ok, false);
  });
});
