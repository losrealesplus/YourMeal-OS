/**
 * Unit tests for Capacitor C4 iOS Platform.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CAPACITOR_C4_PRECONDITIONS,
  runCapacitorC4IosPlatform,
} from "./capacitor-c4-ios-platform.mjs";

function writeC4Fixtures(cwd, { gateOk = true, c3Ok = true } = {}) {
  const files = {
    "ios/App/App.xcodeproj/project.pbxproj":
      "/* Begin PBXFileReference */\n\t50379B222058CBB4000EE86E /* capacitor.config.json */ = {isa = PBXFileReference; path = capacitor.config.json; };\n",
    "ios/App/App/capacitor.config.json":
      '{\n  "appId": "com.yourmealos.app",\n  "appName": "YourMealOS",\n  "webDir": ".output/public"\n}\n',
    "ios/App/CapApp-SPM/Package.swift":
      'let package = Package(\n  name: "CapApp-SPM",\n  dependencies: [\n    .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.2")\n  ],\n  targets: [\n    .target(name: "CapApp-SPM", dependencies: [\n      .product(name: "Capacitor", package: "capacitor-swift-pm")\n    ])\n  ]\n)\n',
    "package.json": JSON.stringify(
      {
        dependencies: { "@capacitor/ios": "^8.0.0" },
        scripts: {
          "cap:sync": "npx cap sync",
          "cap:open:ios": "npx cap open ios",
        },
      },
      null,
      2,
    ),
    "docs/00-status/CAPACITOR_SPEC.md":
      "### C4 · iOS Build\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Ready for Acceptance |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/capacitor");
  fs.mkdirSync(gateDir, { recursive: true });
  if (c3Ok) {
    fs.writeFileSync(
      path.join(gateDir, "CAPACITOR_003_C3_ACTA.md"),
      "# CAPACITOR-003 · C3 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "CAPACITOR_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nCAPACITOR-004 · C4 iOS Build\n"
      : "# Gate\n**Estado:** READY\nCAPACITOR-003 only\n",
  );
}

describe("capacitor-c4-ios-platform", () => {
  it("lists expected C4 check ids", () => {
    assert.equal(CAPACITOR_C4_PRECONDITIONS.length, 9);
    assert.ok(CAPACITOR_C4_PRECONDITIONS.includes("capacitor_c3_certified"));
    assert.ok(CAPACITOR_C4_PRECONDITIONS.includes("ios_platform_dir_present"));
  });

  it("PASS when C3 CERTIFIED and iOS platform anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c4-"));
    writeC4Fixtures(cwd);
    const r = runCapacitorC4IosPlatform({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...CAPACITOR_C4_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "CAPACITOR_C4_STARTED",
      "CAPACITOR_C4_COMPLETED",
    ]);
  });

  it("FAIL when C3 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c4-"));
    writeC4Fixtures(cwd, { c3Ok: false });
    const r = runCapacitorC4IosPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /C3|CAPACITOR_003/);
  });

  it("FAIL when Gate does not authorize CAPACITOR-004", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c4-"));
    writeC4Fixtures(cwd, { gateOk: false });
    const r = runCapacitorC4IosPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CAPACITOR-004/);
  });

  it("FAIL when ios/App is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cap-c4-"));
    writeC4Fixtures(cwd);
    fs.rmSync(path.join(cwd, "ios"), { recursive: true, force: true });
    const r = runCapacitorC4IosPlatform({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /ios/);
  });
});
