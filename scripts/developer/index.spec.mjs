/**
 * Integration spec · Developer Platform runner.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DOCTOR_MODULES, runDeveloperDoctor } from "./index.mjs";
import { makeTempRepo, writeMinimalPlatformFixture } from "./test-fixtures.mjs";

describe("developer-doctor-runner", () => {
  it("registers all canonical doctor modules", () => {
    const names = DOCTOR_MODULES.map((m) => m.name);
    assert.deepEqual(names, [
      "development-environment",
      "environment",
      "node",
      "java",
      "gradle",
      "android-sdk",
      "capacitor",
      "vite",
      "assets",
      "runtime",
      "git",
      "network",
      "supabase",
    ]);
  });

  it("PASS on real repository with soft-android + skip-network", async () => {
    const summary = await runDeveloperDoctor({
      cwd: process.cwd(),
      ci: true,
      skipNetwork: true,
      requireAndroid: false,
    });
    assert.equal(summary.ok, true);
    assert.equal(summary.modules.length, 13);
  });

  it("FAIL when fixture lacks package.json module anchors", async () => {
    const cwd = makeTempRepo();
    writeMinimalPlatformFixture(cwd, { softAndroid: true });
    fs.rmSync(path.join(cwd, "package.json"));
    const summary = await runDeveloperDoctor({
      cwd,
      ci: true,
      skipNetwork: true,
      requireAndroid: false,
      env: { ...process.env, PATH: process.env.PATH },
    });
    assert.equal(summary.ok, false);
    assert.ok(summary.failed.includes("environment"));
  });
});
