import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runDoctorCapacitor } from "./doctor-capacitor.mjs";
import { makeTempRepo, writeMinimalPlatformFixture } from "./test-fixtures.mjs";

describe("doctor-capacitor", () => {
  it("PASS on minimal capacitor fixture", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    const r = runDoctorCapacitor({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.find((c) => c.id === "capacitor_config_present" && c.ok));
  });

  it("FAIL without capacitor config", () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    fs.rmSync(path.join(cwd, "capacitor.config.ts"));
    const r = runDoctorCapacitor({ cwd });
    assert.equal(r.ok, false);
  });
});
