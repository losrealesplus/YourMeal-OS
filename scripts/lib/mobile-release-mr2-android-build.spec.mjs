/**
 * Unit tests for MOBILE-RELEASE MR2 Android Build.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MOBILE_RELEASE_MR2_PRECONDITIONS,
  MR2_ARTIFACT_PATHS,
  runMobileReleaseMr2AndroidBuild,
} from "./mobile-release-mr2-android-build.mjs";

function writeBlob(cwd, rel, content) {
  const p = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return {
    relative_path: rel,
    bytes: Buffer.byteLength(content),
    sha256: crypto.createHash("sha256").update(content).digest("hex"),
  };
}

function writeMr2Fixtures(cwd, { gateOk = true, withLive = true } = {}) {
  fs.mkdirSync(path.join(cwd, "android/app"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "android/app/build.gradle"),
    `android {
  defaultConfig {
    applicationId "com.yourmealos.eatclean"
    versionCode 1
    versionName "1.0"
  }
  buildTypes {
    release {
      minifyEnabled false
    }
  }
}
`,
  );

  fs.mkdirSync(
    path.join(cwd, "docs/10-validation/mobile-release"),
    { recursive: true },
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nMR01-002 · Android Build\n"
      : "# Gate\n**Estado:** READY\nMR01-001 only\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MR01_001_MR1_ACTA.md"),
    "# MR1\nReady for Android Build\n",
  );
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md"),
    "### MR2 · Android Build\n\n| | Contrato |\n|---|----------|\n| **Salida** | Ready for Android Signing |\n",
  );

  const debugMeta = withLive
    ? writeBlob(cwd, MR2_ARTIFACT_PATHS.debug_apk, "DEBUG-APK")
    : {
        relative_path: MR2_ARTIFACT_PATHS.debug_apk,
        bytes: 9,
        sha256: crypto.createHash("sha256").update("DEBUG-APK").digest("hex"),
      };
  const releaseMeta = withLive
    ? writeBlob(cwd, MR2_ARTIFACT_PATHS.release_apk, "RELEASE-UNSIGNED")
    : {
        relative_path: MR2_ARTIFACT_PATHS.release_apk,
        bytes: 16,
        sha256: crypto
          .createHash("sha256")
          .update("RELEASE-UNSIGNED")
          .digest("hex"),
      };
  const aabMeta = withLive
    ? writeBlob(cwd, MR2_ARTIFACT_PATHS.release_aab, "AAB-RELEASE")
    : {
        relative_path: MR2_ARTIFACT_PATHS.release_aab,
        bytes: 11,
        sha256: crypto.createHash("sha256").update("AAB-RELEASE").digest("hex"),
      };

  if (!withLive) {
    // Ensure paths do not exist
    for (const rel of Object.values(MR2_ARTIFACT_PATHS)) {
      const p = path.join(cwd, rel);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }

  const manifest = {
    delivery: "MR01-002",
    applicationId: "com.yourmealos.eatclean",
    versionCode: 1,
    versionName: "1.0",
    signing: "unsigned",
    gradle_tasks: [
      ":app:assembleDebug",
      ":app:assembleRelease",
      ":app:bundleRelease",
    ],
    artifacts: {
      debug_apk: { ...debugMeta, variant: "debug", kind: "apk" },
      release_apk: { ...releaseMeta, variant: "release", kind: "apk" },
      release_aab: { ...aabMeta, variant: "release", kind: "aab" },
    },
  };
  const evidenceDir = path.join(
    cwd,
    "docs/10-validation/mobile-release/evidence",
  );
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(
    path.join(evidenceDir, "mr2-android-artifacts.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}

describe("mobile-release-mr2-android-build", () => {
  it("lists expected MR2 check ids", () => {
    assert.equal(MOBILE_RELEASE_MR2_PRECONDITIONS.length, 10);
    assert.ok(
      MOBILE_RELEASE_MR2_PRECONDITIONS.includes(
        "mobile_release_gate_authorizes_002",
      ),
    );
    assert.ok(
      MOBILE_RELEASE_MR2_PRECONDITIONS.includes("release_apk_unsigned_contract"),
    );
  });

  it("PASS when Gate READY and artifact evidence + live files match", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr2-"));
    writeMr2Fixtures(cwd, { withLive: true });
    const r = runMobileReleaseMr2AndroidBuild({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...MOBILE_RELEASE_MR2_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "MOBILE_RELEASE_MR2_STARTED",
      "MOBILE_RELEASE_MR2_COMPLETED",
    ]);
  });

  it("PASS when live APKs absent but evidence manifest is complete", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr2-"));
    writeMr2Fixtures(cwd, { withLive: false });
    const r = runMobileReleaseMr2AndroidBuild({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL when Gate does not authorize MR01-002", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr2-"));
    writeMr2Fixtures(cwd, { gateOk: false });
    const r = runMobileReleaseMr2AndroidBuild({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /MR01-002/);
  });

  it("FAIL when release buildType has signingConfig", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr2-"));
    writeMr2Fixtures(cwd);
    fs.writeFileSync(
      path.join(cwd, "android/app/build.gradle"),
      `android {
  defaultConfig {
    versionCode 1
    versionName "1.0"
  }
  buildTypes {
    release {
      minifyEnabled false
      signingConfig signingConfigs.release
    }
  }
}
`,
    );
    const r = runMobileReleaseMr2AndroidBuild({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /signingConfig|unsigned/i);
  });

  it("FAIL when live artifact hash mismatches evidence", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr2-"));
    writeMr2Fixtures(cwd, { withLive: true });
    fs.writeFileSync(
      path.join(cwd, MR2_ARTIFACT_PATHS.debug_apk),
      "TAMPERED",
    );
    const r = runMobileReleaseMr2AndroidBuild({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /mismatch|size/i);
  });
});
