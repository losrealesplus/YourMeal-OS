import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorJava } from "./doctor-java.mjs";

describe("doctor-java", () => {
  it("PASS when java is available (local)", () => {
    const r = runDoctorJava({ ci: false });
    if (!r.evidence.javaPath) {
      // Environment without Java — skip hard assert
      assert.equal(r.ok, false);
      return;
    }
    assert.equal(r.ok, true);
    assert.ok(r.evidence.javaVersion);
  });

  it("soft-PASS in CI when java missing from PATH", () => {
    const r = runDoctorJava({
      ci: true,
      env: { ...process.env, PATH: "/nonexistent" },
    });
    assert.equal(r.ok, true);
    assert.ok(r.warnings.length >= 1);
  });
});
