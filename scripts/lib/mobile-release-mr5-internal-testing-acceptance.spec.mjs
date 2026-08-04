/**
 * Unit tests for MOBILE-RELEASE MR5 Internal Testing Acceptance.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MOBILE_RELEASE_MR5_PRECONDITIONS,
  runMobileReleaseMr5InternalTestingAcceptance,
} from "./mobile-release-mr5-internal-testing-acceptance.mjs";

function writeMr5Fixtures(cwd, { gateOk = true } = {}) {
  const files = {
    "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md": gateOk
      ? "# Gate\n**Estado:** ✅ **CLOSED**\nMR01-005 · Internal Testing Acceptance\n"
      : "# Gate\n**Estado:** READY\nMR01-004 only\n",
    "docs/10-validation/mobile-release/MR01_004_MR4_ACTA.md":
      "# MR4\nReady for Internal Testing Acceptance\n",
    "docs/10-validation/mobile-release/MR01_INTERNAL_TESTING_ACCEPTANCE_CHECKLIST.md":
      `# Acceptance
☑ Android puede entregarse para pruebas privadas
☑ iOS puede archivarse correctamente para pruebas privadas
☑ Core SaaS permanece intacto
☑ Todos los artefactos poseen evidencia
☑ Ready for Internal Testing
`,
    "docs/10-validation/mobile-release/MOBILE_RELEASE_01_PASS_ACTA.md":
      "# MOBILE-RELEASE PASS\nFULL PASS\nReady for Internal Testing\n",
    "docs/10-validation/capacitor/CAPACITOR_PASS_ACTA.md": "# CAPACITOR PASS\n",
    "FOUNDATION.md": "# Foundation\nCore Integrity Rule\nNative Tool Artifacts\n",
    "docs/00-status/MOBILE_RELEASE_01_SPEC.md":
      "### MR5 · Internal Testing Acceptance\n\n| | Contrato |\n|---|----------|\n| **Salida** | **Ready for Internal Testing** · END |\n",
    "docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json":
      JSON.stringify({
        artifacts: {
          debug_apk: { sha256: "a".repeat(64), bytes: 1 },
          release_apk: { sha256: "b".repeat(64), bytes: 1 },
        },
      }),
    "docs/10-validation/mobile-release/evidence/mr3-android-signing.json":
      JSON.stringify({
        signing: "release_signed",
        certificate_sha256: "c".repeat(64),
      }),
    "docs/10-validation/mobile-release/evidence/mr4-ios-archive.json":
      JSON.stringify({
        segment: "ios_archive",
        project_pbxproj_sha256: "d".repeat(64),
        archive_recipe: { xcodebuild: ["xcodebuild", "archive"] },
      }),
    "docs/10-validation/mobile-release/evidence/mr5-internal-testing-acceptance.json":
      JSON.stringify({
        status: "READY_FOR_INTERNAL_TESTING",
        android_private_ready: true,
        ios_archive_ready: true,
        core_integrity: true,
      }),
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(
      p,
      typeof body === "string" ? body : JSON.stringify(body),
    );
  }
}

describe("mobile-release-mr5-internal-testing-acceptance", () => {
  it("lists expected MR5 check ids", () => {
    assert.equal(MOBILE_RELEASE_MR5_PRECONDITIONS.length, 10);
    assert.ok(MOBILE_RELEASE_MR5_PRECONDITIONS.includes("pass_acta_present"));
  });

  it("PASS when acceptance anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr5-"));
    writeMr5Fixtures(cwd);
    const r = runMobileReleaseMr5InternalTestingAcceptance({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...MOBILE_RELEASE_MR5_PRECONDITIONS]);
  });

  it("FAIL when Gate does not authorize MR01-005", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr5-"));
    writeMr5Fixtures(cwd, { gateOk: false });
    const r = runMobileReleaseMr5InternalTestingAcceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /MR01-005/);
  });

  it("FAIL when MR3 signing evidence missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr5-"));
    writeMr5Fixtures(cwd);
    fs.unlinkSync(
      path.join(
        cwd,
        "docs/10-validation/mobile-release/evidence/mr3-android-signing.json",
      ),
    );
    const r = runMobileReleaseMr5InternalTestingAcceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /mr3|Signing/i);
  });
});
