/**
 * Unit tests for MOBILE-RELEASE MR4 iOS Archive.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MOBILE_RELEASE_MR4_PRECONDITIONS,
  runMobileReleaseMr4IosArchive,
} from "./mobile-release-mr4-ios-archive.mjs";

function writeMr4Fixtures(cwd, { gateOk = true, withArchive = false } = {}) {
  const pbx = `
/* Begin PBXNativeTarget section */
App target
/* End PBXNativeTarget section */
504EC315 /* Release */ = { name = Release; };
defaultConfigurationName = Release;
CODE_SIGN_STYLE = Automatic;
CURRENT_PROJECT_VERSION = 1;
MARKETING_VERSION = 1.0;
PRODUCT_BUNDLE_IDENTIFIER = com.yourmealos.eatclean;
`;
  fs.mkdirSync(path.join(cwd, "ios/App/App.xcodeproj"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "ios/App/App"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "ios/App/App.xcodeproj/project.pbxproj"),
    pbx,
  );
  fs.writeFileSync(path.join(cwd, "ios/App/App/Info.plist"), "<plist/>\n");
  fs.writeFileSync(
    path.join(cwd, "ios/.gitignore"),
    "DerivedData\n*.xcarchive\n",
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/mobile-release/evidence"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nMR01-004 · iOS Archive\n"
      : "# Gate\n**Estado:** READY\nMR01-003 only\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MR01_003_MR3_ACTA.md"),
    "# MR3\nReady for iOS Archive\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MR01_IOS_ARCHIVE_POLICY.md"),
    `# Policy
.xcarchive NUNCA in Git.
xcodebuild archive recipe documented.
`,
  );
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md"),
    "### MR4 · iOS Archive\n\n| | Contrato |\n|---|----------|\n| **Salida** | Ready for Internal Testing Acceptance |\n",
  );

  const pbxSha = crypto.createHash("sha256").update(pbx).digest("hex");
  /** @type {Record<string, unknown>} */
  const manifest = {
    delivery: "MR01-004",
    segment: "ios_archive",
    marketing_version: "1.0",
    current_project_version: "1",
    product_bundle_identifier: "com.yourmealos.eatclean",
    project_pbxproj_sha256: pbxSha,
    archive_recipe: {
      xcodebuild: ["xcodebuild", "archive"],
    },
    xcarchive_relative_path: "ios/build/App.xcarchive",
    xcarchive_status: withArchive ? "produced" : "contract_ready_pending_macos",
  };

  if (withArchive) {
    const arch = path.join(cwd, "ios/build/App.xcarchive");
    fs.mkdirSync(path.join(arch, "Products"), { recursive: true });
    fs.writeFileSync(path.join(arch, "Info.plist"), "<plist/>\n");
    fs.writeFileSync(path.join(arch, "Products/App.app"), "APP\n");
    // tree hash computed by driver only for mismatch check if xcarchive.sha256 set
  }

  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/mobile-release/evidence/mr4-ios-archive.json",
    ),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}

describe("mobile-release-mr4-ios-archive", () => {
  it("lists expected MR4 check ids", () => {
    assert.equal(MOBILE_RELEASE_MR4_PRECONDITIONS.length, 10);
    assert.ok(
      MOBILE_RELEASE_MR4_PRECONDITIONS.includes("ios_archive_evidence_manifest"),
    );
  });

  it("PASS on archive contract without live .xcarchive", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr4-"));
    writeMr4Fixtures(cwd, { withArchive: false });
    const r = runMobileReleaseMr4IosArchive({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...MOBILE_RELEASE_MR4_PRECONDITIONS]);
  });

  it("PASS when live .xcarchive layout is present", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr4-"));
    writeMr4Fixtures(cwd, { withArchive: true });
    const r = runMobileReleaseMr4IosArchive({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL when Gate does not authorize MR01-004", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr4-"));
    writeMr4Fixtures(cwd, { gateOk: false });
    const r = runMobileReleaseMr4IosArchive({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /MR01-004/);
  });

  it("FAIL when Release configuration missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr4-"));
    writeMr4Fixtures(cwd);
    fs.writeFileSync(
      path.join(cwd, "ios/App/App.xcodeproj/project.pbxproj"),
      "PBXNativeTarget App\nCODE_SIGN_STYLE = Automatic;\nMARKETING_VERSION = 1.0;\nCURRENT_PROJECT_VERSION = 1;\nPRODUCT_BUNDLE_IDENTIFIER = com.yourmealos.eatclean;\n",
    );
    // evidence sha will mismatch — expect fail
    const r = runMobileReleaseMr4IosArchive({ cwd });
    assert.equal(r.ok, false);
  });
});
