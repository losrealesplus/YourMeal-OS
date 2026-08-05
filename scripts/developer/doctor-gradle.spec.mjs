import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runDoctorGradle } from "./doctor-gradle.mjs";
import { makeTempRepo, writeFiles } from "./test-fixtures.mjs";

describe("doctor-gradle", () => {
  it("PASS when android gradle wrapper exists", () => {
    const cwd = makeTempRepo();
    writeFiles(cwd, {
      "android/gradlew": "#!/bin/sh\n",
      "android/gradle/wrapper/gradle-wrapper.properties":
        "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-all.zip\n",
      "android/gradle/wrapper/gradle-wrapper.jar": "x",
    });
    const r = runDoctorGradle({ cwd, ci: false });
    assert.equal(r.ok, true);
  });

  it("soft-PASS in CI when wrapper missing", () => {
    const cwd = makeTempRepo();
    const r = runDoctorGradle({ cwd, ci: true });
    assert.equal(r.ok, true);
    assert.ok(r.warnings.length >= 1);
  });

  it("FAIL locally when wrapper missing", () => {
    const cwd = makeTempRepo();
    const r = runDoctorGradle({ cwd, ci: false });
    assert.equal(r.ok, false);
  });
});
