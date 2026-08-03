/**
 * Unit tests for MOBILE-RELEASE MR1 Preparation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MOBILE_RELEASE_MR1_PRECONDITIONS,
  runMobileReleaseMr1Preparation,
} from "./mobile-release-mr1-preparation.mjs";

function writeMr1Fixtures(cwd, { gateOk = true } = {}) {
  const files = {
    "android/app/build.gradle":
      'android {\n  defaultConfig {\n    versionCode 1\n    versionName "1.0"\n  }\n  buildTypes {\n    release {\n      minifyEnabled false\n    }\n  }\n}\n',
    "ios/App/App.xcodeproj/project.pbxproj":
      "MARKETING_VERSION = 1.0;\nCURRENT_PROJECT_VERSION = 1;\n",
    "package.json": JSON.stringify(
      {
        scripts: {
          "build:mobile": "CAPACITOR_BUILD=1 vite build",
          "cap:sync": "npx cap sync",
        },
      },
      null,
      2,
    ),
    "docs/00-status/MOBILE_RELEASE_01_SPEC.md":
      "### MR1 · Preparation\n\n| | Contrato |\n|---|----------|\n| **Salida** | Ready for Android Build |\n",
    "docs/10-validation/capacitor/CAPACITOR_PASS_ACTA.md":
      "# CAPACITOR PASS\n",
    "docs/10-validation/mobile-release/MR01_PREPARATION_CHECKLIST.md":
      "# Release Checklist\n\n- versionCode / versionName\n- Debug vs Release\n- Signing: keystore secrets must not be committed to git\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nMR01-001 · Preparation\n"
      : "# Gate\n**Estado:** READY\nno increment\n",
  );
}

describe("mobile-release-mr1-preparation", () => {
  it("lists expected MR1 check ids", () => {
    assert.equal(MOBILE_RELEASE_MR1_PRECONDITIONS.length, 9);
    assert.ok(
      MOBILE_RELEASE_MR1_PRECONDITIONS.includes(
        "mobile_release_gate_authorizes_001",
      ),
    );
    assert.ok(
      MOBILE_RELEASE_MR1_PRECONDITIONS.includes("android_versioning_defined"),
    );
  });

  it("PASS when Gate READY and preparation anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr1-"));
    writeMr1Fixtures(cwd);
    const r = runMobileReleaseMr1Preparation({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...MOBILE_RELEASE_MR1_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "MOBILE_RELEASE_MR1_STARTED",
      "MOBILE_RELEASE_MR1_COMPLETED",
    ]);
  });

  it("FAIL when Gate does not authorize MR01-001", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr1-"));
    writeMr1Fixtures(cwd, { gateOk: false });
    const r = runMobileReleaseMr1Preparation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /MR01-001/);
  });

  it("FAIL when Android versioning is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr1-"));
    writeMr1Fixtures(cwd);
    fs.writeFileSync(
      path.join(cwd, "android/app/build.gradle"),
      "android { buildTypes { release { } } }\n",
    );
    const r = runMobileReleaseMr1Preparation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /versionCode|versionName/);
  });
});
