/**
 * Unit tests for Capacitor C3 Android Platform.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CAPACITOR_C3_PRECONDITIONS,
  runCapacitorC3AndroidPlatform,
} from "./capacitor-c3-android-platform.mjs";

function writeC3Fixtures(cwd, { gateOk = true, c2Ok = true } = {}) {
  const files = {
    "android/settings.gradle":
      "include ':app'\napply from: 'capacitor.settings.gradle'\n",
    "android/capacitor.settings.gradle":
      "include ':capacitor-android'\nproject(':capacitor-android').projectDir = new File('../node_modules/@capacitor/android/capacitor')\n",
    "android/app/build.gradle":
      "dependencies {\n    implementation project(':capacitor-android')\n}\n",
    "package.json": JSON.stringify(
      {
        dependencies: { "@capacitor/android": "^8.0.0" },
        scripts: {
          "cap:sync": "npx cap sync",
          "cap:open:android": "npx cap open android",
        },
      },
      null,
      2,
    ),
    "docs/00-status/CAPACITOR_SPEC.md":
      "### C3 · Android Build\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Ready for iOS |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/capacitor");
  fs.mkdirSync(gateDir, { recursive: true });
  if (c2Ok) {
    fs.writeFileSync(
      path.join(gateDir, "CAPACITOR_002_C2_ACTA.md"),
      "# CAPACITOR-002 · C2 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "CAPACITOR_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nCAPACITOR-003 · C3 Android Build\n"
      : "# Gate\n**Estado:** READY\nCAPACITOR-002 only\n",
  );
}

describe("capacitor-c3-android-platform", () => {
  it("lists expected C3 check ids", () => {
    assert.equal(CAPACITOR_C3_PRECONDITIONS.length, 8);
    assert.ok(CAPACITOR_C3_PRECONDITIONS.includes("capacitor_c2_certified"));
    assert.ok(
      CAPACITOR_C3_PRECONDITIONS.includes("android_platform_dir_present"),
    );
  });

  it("PASS when C2 CERTIFIED and Android platform anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c3-"));
    writeC3Fixtures(cwd);
    const r = runCapacitorC3AndroidPlatform({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...CAPACITOR_C3_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "CAPACITOR_C3_STARTED",
      "CAPACITOR_C3_COMPLETED",
    ]);
  });

  it("FAIL when C2 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c3-"));
    writeC3Fixtures(cwd, { c2Ok: false });
    const r = runCapacitorC3AndroidPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /C2|CAPACITOR_002/);
  });

  it("FAIL when Gate does not authorize CAPACITOR-003", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c3-"));
    writeC3Fixtures(cwd, { gateOk: false });
    const r = runCapacitorC3AndroidPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CAPACITOR-003/);
  });

  it("FAIL when android/ platform is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c3-"));
    writeC3Fixtures(cwd);
    fs.rmSync(path.join(cwd, "android"), { recursive: true, force: true });
    const r = runCapacitorC3AndroidPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /android/);
  });
});
