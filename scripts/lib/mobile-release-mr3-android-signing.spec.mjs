/**
 * Unit tests for MOBILE-RELEASE MR3 Android Signing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  MOBILE_RELEASE_MR3_PRECONDITIONS,
  MR3_SIGNED_ARTIFACT_PATHS,
  runMobileReleaseMr3AndroidSigning,
} from "./mobile-release-mr3-android-signing.mjs";

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

function writeMr3Fixtures(cwd, { gateOk = true, withLive = true } = {}) {
  fs.mkdirSync(path.join(cwd, "android/app"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "android/app/build.gradle"),
    `
def yourmealHasReleaseSigning = true
android {
  defaultConfig {
    applicationId "com.yourmealos.eatclean"
    versionCode 1
    versionName "1.0"
  }
  if (yourmealHasReleaseSigning) {
    signingConfigs {
      release {
        storeFile file(System.getenv("YOURMEAL_UPLOAD_STORE_FILE"))
        storePassword System.getenv("YOURMEAL_UPLOAD_STORE_PASSWORD")
        keyAlias System.getenv("YOURMEAL_UPLOAD_KEY_ALIAS")
        keyPassword System.getenv("YOURMEAL_UPLOAD_KEY_PASSWORD")
      }
    }
  }
  buildTypes {
    release {
      if (yourmealHasReleaseSigning) {
        signingConfig signingConfigs.release
      }
    }
  }
}
// keystore.properties fallback documented in script header
`,
  );
  fs.writeFileSync(
    path.join(cwd, "android/.gitignore"),
    "*.jks\n*.keystore\nkeystore.properties\n",
  );
  fs.writeFileSync(
    path.join(cwd, "android/keystore.properties.example"),
    `# Prefer YOURMEAL_UPLOAD_STORE_FILE YOURMEAL_UPLOAD_STORE_PASSWORD YOURMEAL_UPLOAD_KEY_ALIAS YOURMEAL_UPLOAD_KEY_PASSWORD
storeFile=/path/to.jks
storePassword=REPLACE_ME_STORE_PASSWORD
keyAlias=yourmeal_upload
keyPassword=REPLACE_ME_KEY_PASSWORD
`,
  );

  fs.mkdirSync(path.join(cwd, "docs/10-validation/mobile-release/evidence"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nMR01-003 · Android Signing\n"
      : "# Gate\n**Estado:** READY\nMR01-002 only\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MR01_002_MR2_ACTA.md"),
    "# MR2\nReady for Android Signing\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/mobile-release/MR01_SIGNING_POLICY.md"),
    `# Policy
Keystore NUNCA in Git.
Env:
YOURMEAL_UPLOAD_STORE_FILE
YOURMEAL_UPLOAD_STORE_PASSWORD
YOURMEAL_UPLOAD_KEY_ALIAS
YOURMEAL_UPLOAD_KEY_PASSWORD
`,
  );
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md"),
    "### MR3 · Android Signing\n\n| | Contrato |\n|---|----------|\n| **Salida** | Ready for iOS Archive |\n",
  );

  const apkMeta = withLive
    ? writeBlob(cwd, MR3_SIGNED_ARTIFACT_PATHS.release_apk, "SIGNED-APK")
    : {
        relative_path: MR3_SIGNED_ARTIFACT_PATHS.release_apk,
        bytes: 10,
        sha256: crypto.createHash("sha256").update("SIGNED-APK").digest("hex"),
      };
  const aabMeta = withLive
    ? writeBlob(cwd, MR3_SIGNED_ARTIFACT_PATHS.release_aab, "SIGNED-AAB")
    : {
        relative_path: MR3_SIGNED_ARTIFACT_PATHS.release_aab,
        bytes: 10,
        sha256: crypto.createHash("sha256").update("SIGNED-AAB").digest("hex"),
      };

  if (!withLive) {
    for (const rel of Object.values(MR3_SIGNED_ARTIFACT_PATHS)) {
      const p = path.join(cwd, rel);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }

  const manifest = {
    delivery: "MR01-003",
    signing: "release_signed",
    key_alias: "yourmeal_upload",
    certificate_sha256: "a".repeat(64),
    certificate_dn: "CN=Test",
    artifacts: {
      release_apk: { ...apkMeta, signed: true },
      release_aab: { ...aabMeta, signed: true },
    },
  };
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/mobile-release/evidence/mr3-android-signing.json",
    ),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}

describe("mobile-release-mr3-android-signing", () => {
  it("lists expected MR3 check ids", () => {
    assert.equal(MOBILE_RELEASE_MR3_PRECONDITIONS.length, 10);
    assert.ok(
      MOBILE_RELEASE_MR3_PRECONDITIONS.includes(
        "signing_config_prepared_conditional",
      ),
    );
  });

  it("PASS when Gate READY and signing anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr3-"));
    writeMr3Fixtures(cwd, { withLive: true });
    const r = runMobileReleaseMr3AndroidSigning({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...MOBILE_RELEASE_MR3_PRECONDITIONS]);
  });

  it("PASS when live signed APKs absent but evidence complete", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr3-"));
    writeMr3Fixtures(cwd, { withLive: false });
    const r = runMobileReleaseMr3AndroidSigning({ cwd });
    assert.equal(r.ok, true);
  });

  it("FAIL when Gate does not authorize MR01-003", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr3-"));
    writeMr3Fixtures(cwd, { gateOk: false });
    const r = runMobileReleaseMr3AndroidSigning({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /MR01-003/);
  });

  it("FAIL when hardcoded passwords appear in gradle", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mr3-"));
    writeMr3Fixtures(cwd);
    const gradle = path.join(cwd, "android/app/build.gradle");
    fs.appendFileSync(gradle, '\nstorePassword "oops"\nkeyPassword "oops"\n');
    const r = runMobileReleaseMr3AndroidSigning({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /Hardcoded/i);
  });
});
