/**
 * MOBILE-RELEASE · MR2 Android Build.
 *
 * Certifies reproducible Android artifacts (unsigned):
 *   Ready for Android Build → Debug APK · Release APK · AAB → Ready for Android Signing
 *
 * Requires Gate READY authorizing MR01-002 + Spec FROZEN MR2 outcome.
 * Does NOT sign · does NOT open Play/CI · no keystore · no MR3.
 * Presence + evidence integrity — Core Integrity Rule · No Artificiality.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MOBILE_RELEASE_MR2_PRECONDITIONS = Object.freeze([
  "mobile_release_gate_authorizes_002",
  "mr1_preparation_acta_present",
  "android_versioning_intact",
  "release_build_unsigned",
  "debug_apk_contract",
  "release_apk_unsigned_contract",
  "aab_contract",
  "artifact_evidence_manifest",
  "artifact_hashes_identifiable",
  "ready_for_android_signing_spec_present",
]);

/** Canonical relative paths under the Android module. */
export const MR2_ARTIFACT_PATHS = Object.freeze({
  debug_apk: "android/app/build/outputs/apk/debug/app-debug.apk",
  release_apk: "android/app/build/outputs/apk/release/app-release-unsigned.apk",
  release_aab: "android/app/build/outputs/bundle/release/app-release.aab",
});

export const MR2_EVIDENCE_MANIFEST_REL =
  "docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json";

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 *   artifacts?: Record<string, unknown>,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} Mr2Result
 */

/**
 * @param {string} filePath
 */
function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {Mr2Result}
 */
export function runMobileReleaseMr2AndroidBuild(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const gatePath = path.join(
    cwd,
    "docs/10-validation/mobile-release/MOBILE_RELEASE_01_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MOBILE_RELEASE_01_GATE.md — MR2 requires Gate authorizing MR01-002.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/MR01-002/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "MOBILE_RELEASE_01_GATE.md does not authorize MR01-002 — Land Check Runner/Gate first.",
    };
  }
  checks.push("mobile_release_gate_authorizes_002");

  const mr1Acta = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_001_MR1_ACTA.md",
  );
  if (!fs.existsSync(mr1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MR01_001_MR1_ACTA.md — MR2 requires Ready for Android Build (MR1).",
    };
  }
  const mr1Text = fs.readFileSync(mr1Acta, "utf8");
  if (!/Ready for Android Build/i.test(mr1Text)) {
    return {
      ok: false,
      checks,
      reason: "MR1 acta missing Ready for Android Build outcome.",
    };
  }
  checks.push("mr1_preparation_acta_present");

  const androidGradle = path.join(cwd, "android/app/build.gradle");
  if (!fs.existsSync(androidGradle)) {
    return {
      ok: false,
      checks,
      reason: "Missing android/app/build.gradle — cannot verify versioning.",
    };
  }
  const androidText = fs.readFileSync(androidGradle, "utf8");
  const versionCodeMatch = androidText.match(/versionCode\s+(\d+)/);
  const versionNameMatch = androidText.match(/versionName\s+"([^"]+)"/);
  if (!versionCodeMatch || !versionNameMatch) {
    return {
      ok: false,
      checks,
      reason:
        "Android versionCode / versionName missing — MR2 requires intact versioning.",
    };
  }
  const versionCode = Number(versionCodeMatch[1]);
  const versionName = versionNameMatch[1];
  checks.push("android_versioning_intact");

  // Unsigned release: no signingConfig on release buildType (MR3 owns signing).
  const releaseBlock = androidText.match(/release\s*\{([\s\S]*?)\n\s*\}/);
  if (!releaseBlock) {
    return {
      ok: false,
      checks,
      reason: "Android release buildType missing — cannot certify unsigned release.",
    };
  }
  if (/signingConfig\s+/.test(releaseBlock[1])) {
    return {
      ok: false,
      checks,
      reason:
        "Release buildType already has signingConfig — MR2 certifies unsigned only (signing = MR3).",
    };
  }
  checks.push("release_build_unsigned");

  const manifestPath = path.join(cwd, MR2_EVIDENCE_MANIFEST_REL);
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      checks,
      reason: `Missing ${MR2_EVIDENCE_MANIFEST_REL} — MR2 requires artifact evidence manifest.`,
    };
  }

  /** @type {Record<string, unknown>} */
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return {
      ok: false,
      checks,
      reason: "mr2-android-artifacts.json is not valid JSON.",
    };
  }

  const requiredKeys = ["debug_apk", "release_apk", "release_aab"];
  /** @type {Record<string, unknown>} */
  const artifacts = /** @type {Record<string, unknown>} */ (
    manifest.artifacts ?? {}
  );

  for (const key of requiredKeys) {
    const entry = artifacts[key];
    if (!entry || typeof entry !== "object") {
      return {
        ok: false,
        checks,
        reason: `Artifact evidence missing entry: ${key}`,
      };
    }
    const e = /** @type {Record<string, unknown>} */ (entry);
    if (typeof e.relative_path !== "string" || !e.relative_path) {
      return {
        ok: false,
        checks,
        reason: `Artifact ${key} missing relative_path`,
      };
    }
    if (typeof e.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(e.sha256)) {
      return {
        ok: false,
        checks,
        reason: `Artifact ${key} missing identifiable sha256`,
      };
    }
    if (typeof e.bytes !== "number" || e.bytes <= 0) {
      return {
        ok: false,
        checks,
        reason: `Artifact ${key} missing positive bytes`,
      };
    }
  }

  const debugEntry = /** @type {Record<string, unknown>} */ (artifacts.debug_apk);
  const releaseEntry = /** @type {Record<string, unknown>} */ (
    artifacts.release_apk
  );
  const aabEntry = /** @type {Record<string, unknown>} */ (artifacts.release_aab);

  if (debugEntry.relative_path !== MR2_ARTIFACT_PATHS.debug_apk) {
    return {
      ok: false,
      checks,
      reason: `Debug APK path mismatch — expected ${MR2_ARTIFACT_PATHS.debug_apk}`,
    };
  }
  if (!/debug/i.test(String(debugEntry.variant ?? "debug"))) {
    return {
      ok: false,
      checks,
      reason: "Debug APK evidence must declare debug variant.",
    };
  }
  checks.push("debug_apk_contract");

  if (releaseEntry.relative_path !== MR2_ARTIFACT_PATHS.release_apk) {
    return {
      ok: false,
      checks,
      reason: `Release APK path mismatch — expected ${MR2_ARTIFACT_PATHS.release_apk}`,
    };
  }
  if (!/unsigned/i.test(String(releaseEntry.relative_path))) {
    return {
      ok: false,
      checks,
      reason: "Release APK must be the unsigned artifact (app-release-unsigned.apk).",
    };
  }
  checks.push("release_apk_unsigned_contract");

  if (aabEntry.relative_path !== MR2_ARTIFACT_PATHS.release_aab) {
    return {
      ok: false,
      checks,
      reason: `AAB path mismatch — expected ${MR2_ARTIFACT_PATHS.release_aab}`,
    };
  }
  checks.push("aab_contract");

  if (
    Number(manifest.versionCode) !== versionCode ||
    String(manifest.versionName) !== versionName
  ) {
    return {
      ok: false,
      checks,
      reason: `Evidence versioning mismatch — gradle ${versionCode}/${versionName} vs manifest ${manifest.versionCode}/${manifest.versionName}`,
    };
  }
  checks.push("artifact_evidence_manifest");

  // If local build outputs exist, verify integrity against the committed evidence.
  /** @type {Record<string, unknown>} */
  const liveVerification = {};
  for (const key of requiredKeys) {
    const e = /** @type {Record<string, unknown>} */ (artifacts[key]);
    const abs = path.join(cwd, String(e.relative_path));
    if (fs.existsSync(abs)) {
      const st = fs.statSync(abs);
      const digest = sha256File(abs);
      if (st.size !== e.bytes) {
        return {
          ok: false,
          checks,
          reason: `Live artifact size mismatch for ${key}: ${st.size} vs evidence ${e.bytes}`,
        };
      }
      if (digest !== e.sha256) {
        return {
          ok: false,
          checks,
          reason: `Live artifact sha256 mismatch for ${key} — rebuild evidence with scripts/mobile-release-mr2-record-artifacts.mjs`,
        };
      }
      liveVerification[key] = { present: true, sha256_match: true };
    } else {
      liveVerification[key] = {
        present: false,
        note: "gitignored build output; evidence manifest is source of truth",
      };
    }
  }
  checks.push("artifact_hashes_identifiable");

  const specPath = path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_SPEC.md — MR2 requires Spec FROZEN.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (!/MR2 · Android Build[\s\S]*Ready for Android Signing/.test(specText)) {
    return {
      ok: false,
      checks,
      reason:
        "Spec MR2 block missing Ready for Android Signing outcome — Android Build incomplete.",
    };
  }
  checks.push("ready_for_android_signing_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "MOBILE_RELEASE_MR2_STARTED",
      "MOBILE_RELEASE_MR2_COMPLETED",
    ],
    source:
      "Debug APK · Release unsigned APK · AAB · versionCode/versionName · evidence hashes · Ready for Android Signing · Gate READY (no signing · no Play · no CI · Core Integrity)",
    artifacts: {
      versionCode,
      versionName,
      applicationId: manifest.applicationId ?? null,
      gradle_tasks: manifest.gradle_tasks ?? [
        ":app:assembleDebug",
        ":app:assembleRelease",
        ":app:bundleRelease",
      ],
      evidence_manifest: MR2_EVIDENCE_MANIFEST_REL,
      live_verification: liveVerification,
      entries: artifacts,
    },
  };
}
