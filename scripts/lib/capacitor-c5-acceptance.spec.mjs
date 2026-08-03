/**
 * Unit tests for Capacitor C5 Acceptance (operational).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CAPACITOR_C5_PRECONDITIONS,
  runCapacitorC5Acceptance,
} from "./capacitor-c5-acceptance.mjs";

function writeC5Fixtures(cwd, { gateOk = true, c4Ok = true } = {}) {
  const files = {
    "package.json": JSON.stringify(
      {
        scripts: {
          build: "vite build",
          "build:web": "vite build",
          "build:mobile": "CAPACITOR_BUILD=1 vite build",
          "cap:sync": "npx cap sync",
          "cap:open:android": "npx cap open android",
          "cap:open:ios": "npx cap open ios",
        },
      },
      null,
      2,
    ),
    "capacitor.config.ts":
      'import type { CapacitorConfig } from "@capacitor/cli";\nconst config: CapacitorConfig = {\n  appId: "com.yourmealos.app",\n  appName: "YourMealOS",\n  webDir: ".output/public",\n};\nexport default config;\n',
    "android/capacitor.settings.gradle":
      "include ':capacitor-android'\nproject(':capacitor-android').projectDir = new File('../node_modules/@capacitor/android/capacitor')\n",
    "android/app/build.gradle":
      "dependencies {\n    implementation project(':capacitor-android')\n}\n",
    "ios/App/App.xcodeproj/project.pbxproj":
      "/* Begin PBXFileReference */\n\t50379B222058CBB4000EE86E /* capacitor.config.json */ = {isa = PBXFileReference; path = capacitor.config.json; };\n",
    "ios/App/App/capacitor.config.json":
      '{\n  "appId": "com.yourmealos.app",\n  "appName": "YourMealOS",\n  "webDir": ".output/public"\n}\n',
    "src/platform/device-capabilities/resolve.ts":
      'import { Capacitor } from "@capacitor/core";\nexport function isNative() {\n  return typeof window !== "undefined" && Capacitor.isNativePlatform();\n}\n',
    "docs/00-status/CAPACITOR_SPEC.md":
      "### C5 · Acceptance\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Distribution Certified · END |\n\n| I8 | **Core Integrity** — Distribution no altera el Core |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/capacitor");
  fs.mkdirSync(gateDir, { recursive: true });
  if (c4Ok) {
    fs.writeFileSync(
      path.join(gateDir, "CAPACITOR_004_C4_ACTA.md"),
      "# CAPACITOR-004 · C4 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "CAPACITOR_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **CLOSED** · was **READY**\nCAPACITOR-005 · C5 Acceptance\n"
      : "# Gate\n**Estado:** READY\nCAPACITOR-004 only\n",
  );
}

describe("capacitor-c5-acceptance", () => {
  it("lists expected C5 check ids", () => {
    assert.equal(CAPACITOR_C5_PRECONDITIONS.length, 12);
    assert.ok(CAPACITOR_C5_PRECONDITIONS.includes("capacitor_c4_certified"));
    assert.ok(
      CAPACITOR_C5_PRECONDITIONS.includes("same_core_webdir_both_platforms"),
    );
  });

  it("PASS when C4 CERTIFIED and operational spine is intact", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c5-"));
    writeC5Fixtures(cwd);
    const r = runCapacitorC5Acceptance({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...CAPACITOR_C5_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "CAPACITOR_C5_STARTED",
      "CAPACITOR_C5_COMPLETED",
    ]);
  });

  it("FAIL when C4 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c5-"));
    writeC5Fixtures(cwd, { c4Ok: false });
    const r = runCapacitorC5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /C4|CAPACITOR_004/);
  });

  it("FAIL when Gate does not authorize CAPACITOR-005", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c5-"));
    writeC5Fixtures(cwd, { gateOk: false });
    const r = runCapacitorC5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CAPACITOR-005/);
  });

  it("FAIL when webDir diverges between root and iOS", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c5-"));
    writeC5Fixtures(cwd);
    fs.writeFileSync(
      path.join(cwd, "ios/App/App/capacitor.config.json"),
      '{\n  "webDir": "dist"\n}\n',
    );
    const r = runCapacitorC5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /webDir|I5/);
  });
});
