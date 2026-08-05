import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runDoctorAndroidSdk } from "./doctor-android-sdk.mjs";
import { makeTempRepo, writeFiles } from "./test-fixtures.mjs";

describe("doctor-android-sdk", () => {
  it("PASS when .android-sdk has platforms and adb", () => {
    const cwd = makeTempRepo();
    const sdk = path.join(cwd, ".android-sdk");
    fs.mkdirSync(path.join(sdk, "platform-tools"), { recursive: true });
    fs.mkdirSync(path.join(sdk, "platforms", "android-35"), {
      recursive: true,
    });
    const adb = path.join(sdk, "platform-tools", "adb");
    fs.writeFileSync(adb, "#!/bin/sh\necho Android Debug Bridge version 1.0.0\n");
    fs.chmodSync(adb, 0o755);
    // Avoid picking real JAVA/adb from host for version — still ok if adb runs
    const r = runDoctorAndroidSdk({
      cwd,
      env: { ...process.env, ANDROID_HOME: sdk },
      ci: false,
    });
    assert.equal(r.ok, true);
    assert.equal(r.evidence.sdkRoot, sdk);
  });

  it("soft-PASS in CI without SDK", () => {
    const cwd = makeTempRepo();
    writeFiles(cwd, { "README.md": "x" });
    const r = runDoctorAndroidSdk({
      cwd,
      env: { PATH: "/nonexistent" },
      ci: true,
    });
    assert.equal(r.ok, true);
  });
});
