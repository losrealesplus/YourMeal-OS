import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runDoctorRuntime } from "./doctor-runtime.mjs";
import { makeTempRepo, writeMinimalPlatformFixture } from "./test-fixtures.mjs";

describe("doctor-runtime", () => {
  it("PASS when consistency + assets runtime anchors exist", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    const r = runDoctorRuntime({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL when consistency engine missing", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    fs.rmSync(path.join(cwd, "src/runtime/ymos-runtime-consistency"), {
      recursive: true,
      force: true,
    });
    const r = runDoctorRuntime({ cwd });
    assert.equal(r.ok, false);
  });
});
