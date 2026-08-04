#!/usr/bin/env node
/**
 * MOBILE-RELEASE · MR3 — record signed Android artifact evidence.
 *
 * Prerequisites: keystore available via env or android/keystore.properties
 *   cd android && ./gradlew :app:assembleRelease :app:bundleRelease
 *
 * Writes docs/10-validation/mobile-release/evidence/mr3-android-signing.json
 * Does NOT commit keystore or APK/AAB binaries.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MR3_EVIDENCE_MANIFEST_REL,
  MR3_SIGNED_ARTIFACT_PATHS,
} from "./lib/mobile-release-mr3-android-signing.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function findApksigner() {
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    path.join(ROOT, ".android-sdk");
  const buildTools = path.join(sdk, "build-tools");
  if (!fs.existsSync(buildTools)) return null;
  const versions = fs
    .readdirSync(buildTools)
    .filter((d) => fs.existsSync(path.join(buildTools, d, "apksigner")))
    .sort()
    .reverse();
  return versions.length
    ? path.join(buildTools, versions[0], "apksigner")
    : null;
}

function readCertFromApk(apkPath) {
  const apksigner = findApksigner();
  if (!apksigner) {
    throw new Error("apksigner not found — set ANDROID_HOME or install build-tools");
  }
  const out = execFileSync(apksigner, ["verify", "--print-certs", apkPath], {
    encoding: "utf8",
  });
  const dn = out.match(/Signer #1 certificate DN:\s*(.+)/)?.[1]?.trim();
  const sha256 = out
    .match(/Signer #1 certificate SHA-256 digest:\s*([a-f0-9]+)/i)?.[1]
    ?.toLowerCase();
  if (!dn || !sha256) {
    throw new Error("Could not parse certificate from apksigner output");
  }
  return { dn, sha256 };
}

function readVersioning() {
  const gradle = fs.readFileSync(
    path.join(ROOT, "android/app/build.gradle"),
    "utf8",
  );
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
  const applicationId = gradle.match(/applicationId\s+"([^"]+)"/)?.[1];
  if (!versionCode || !versionName || !applicationId) {
    throw new Error("Cannot read versionCode / versionName / applicationId");
  }
  return { versionCode, versionName, applicationId };
}

function main() {
  const { versionCode, versionName, applicationId } = readVersioning();
  /** @type {Record<string, unknown>} */
  const artifacts = {};

  for (const [key, rel] of Object.entries(MR3_SIGNED_ARTIFACT_PATHS)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`Missing signed artifact: ${rel}`);
      console.error(
        "Run with signing secrets: cd android && ./gradlew :app:assembleRelease :app:bundleRelease",
      );
      process.exit(1);
    }
    // Reject unsigned filename for APK
    if (key === "release_apk" && /unsigned/i.test(rel)) {
      console.error("Release APK path must be signed (app-release.apk)");
      process.exit(1);
    }
    const st = fs.statSync(abs);
    artifacts[key] = {
      relative_path: rel,
      bytes: st.size,
      sha256: sha256File(abs),
      variant: "release",
      kind: key.includes("aab") ? "aab" : "apk",
      signed: true,
    };
  }

  const apkAbs = path.join(ROOT, MR3_SIGNED_ARTIFACT_PATHS.release_apk);
  const cert = readCertFromApk(apkAbs);

  const alias =
    process.env.YOURMEAL_UPLOAD_KEY_ALIAS ||
    (() => {
      const propsPath = path.join(ROOT, "android/keystore.properties");
      if (!fs.existsSync(propsPath)) return "yourmeal_upload";
      const text = fs.readFileSync(propsPath, "utf8");
      return text.match(/^keyAlias=(.+)$/m)?.[1]?.trim() || "yourmeal_upload";
    })();

  const manifest = {
    delivery: "MR01-003",
    segment: "android_signing",
    applicationId,
    versionCode,
    versionName,
    signing: "release_signed",
    key_alias: alias,
    certificate_dn: cert.dn,
    certificate_sha256: cert.sha256,
    certifies: [
      "signing_config_prepared",
      "keystore_policy",
      "secrets_outside_git",
      "release_signing_validation",
      "signed_artifact_verification",
    ],
    does_not_certify: [
      "google_play",
      "play_console",
      "play_app_signing",
      "internal_testing_publish",
      "ios",
      "ci_cd",
    ],
    note:
      "Keystore and passwords are NOT in Git. Binaries are gitignored. Evidence JSON is the certified fingerprint. Certification keystore ≠ production tenant keystore.",
    recorded_at: new Date().toISOString(),
    artifacts,
  };

  const out = path.join(ROOT, MR3_EVIDENCE_MANIFEST_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, out)}`);
  console.log(`  alias=${alias}`);
  console.log(`  cert_sha256=${cert.sha256}`);
  console.log(`  dn=${cert.dn}`);
  for (const [key, meta] of Object.entries(artifacts)) {
    const m = /** @type {{ relative_path: string, bytes: number, sha256: string }} */ (
      meta
    );
    console.log(
      `  ${key}: ${m.bytes} bytes · sha256=${m.sha256.slice(0, 12)}… · ${m.relative_path}`,
    );
  }
}

main();
