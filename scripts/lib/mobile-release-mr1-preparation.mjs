/**
 * MOBILE-RELEASE · MR1 Preparation.
 *
 * Certifies private delivery preparation state transition:
 *   Distribution Certified → versioning · checklist · signing policy → Ready for Android Build
 *
 * Requires Gate READY authorizing MR01-001 + Spec FROZEN.
 * Does NOT produce APK/AAB · does NOT sign · does NOT open Play/CI · no MR2.
 * Presence/integration only — Core Integrity Rule · No Artificiality.
 */
import fs from "node:fs";
import path from "node:path";

export const MOBILE_RELEASE_MR1_PRECONDITIONS = Object.freeze([
  "mobile_release_gate_authorizes_001",
  "capacitor_pass_precondition_present",
  "android_versioning_defined",
  "android_release_build_type_present",
  "ios_versioning_defined",
  "mobile_build_pipeline_present",
  "release_checklist_present",
  "signing_policy_present",
  "ready_for_android_build_spec_present",
]);

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} Mr1Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {Mr1Result}
 */
export function runMobileReleaseMr1Preparation(opts = {}) {
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
        "Missing MOBILE_RELEASE_01_GATE.md — MR1 requires Gate authorizing MR01-001.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/MR01-001/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "MOBILE_RELEASE_01_GATE.md does not authorize MR01-001 — Land Check Runner/Gate first.",
    };
  }
  checks.push("mobile_release_gate_authorizes_001");

  const passActa = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_PASS_ACTA.md",
  );
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing CAPACITOR_PASS_ACTA.md — MR1 requires Distribution Certified (capacitor-pass).",
    };
  }
  checks.push("capacitor_pass_precondition_present");

  const androidGradle = path.join(cwd, "android/app/build.gradle");
  if (!fs.existsSync(androidGradle)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing android/app/build.gradle — MR1 requires Android versioning defined.",
    };
  }
  const androidText = fs.readFileSync(androidGradle, "utf8");
  if (!/versionCode\s+\d+/.test(androidText) || !/versionName\s+"[^"]+"/.test(androidText)) {
    return {
      ok: false,
      checks,
      reason:
        "Android versionCode / versionName missing — MR1 requires consistent versioning.",
    };
  }
  checks.push("android_versioning_defined");

  if (!/buildTypes\s*\{[\s\S]*release\s*\{/.test(androidText)) {
    return {
      ok: false,
      checks,
      reason:
        "Android release buildType missing — MR1 requires Release configuration prepared.",
    };
  }
  checks.push("android_release_build_type_present");

  const iosPbx = path.join(cwd, "ios/App/App.xcodeproj/project.pbxproj");
  if (!fs.existsSync(iosPbx)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing iOS Xcodeproj — MR1 requires iOS versioning defined.",
    };
  }
  const iosText = fs.readFileSync(iosPbx, "utf8");
  if (
    !/MARKETING_VERSION\s*=/.test(iosText) ||
    !/CURRENT_PROJECT_VERSION\s*=/.test(iosText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "iOS MARKETING_VERSION / CURRENT_PROJECT_VERSION missing — MR1 requires consistent versioning.",
    };
  }
  checks.push("ios_versioning_defined");

  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing package.json — MR1 requires mobile build pipeline.",
    };
  }
  const pkgText = fs.readFileSync(pkgPath, "utf8");
  if (
    !/"build:mobile"\s*:\s*"CAPACITOR_BUILD=1 vite build"/.test(pkgText) ||
    !/"cap:sync"\s*:\s*"npx cap sync"/.test(pkgText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Mobile build/sync scripts missing — MR1 requires environment ready for reproducible builds.",
    };
  }
  checks.push("mobile_build_pipeline_present");

  const checklistPath = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_PREPARATION_CHECKLIST.md",
  );
  if (!fs.existsSync(checklistPath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MR01_PREPARATION_CHECKLIST.md — MR1 requires Release Checklist.",
    };
  }
  const checklistText = fs.readFileSync(checklistPath, "utf8");
  if (!/Release Checklist|versionCode|Debug|Release/i.test(checklistText)) {
    return {
      ok: false,
      checks,
      reason: "Preparation checklist exists but lacks Release Checklist markers.",
    };
  }
  checks.push("release_checklist_present");

  if (
    !/keystore|signing|secret/i.test(checklistText) ||
    !/must not|no commit|no git|never commit/i.test(checklistText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Signing policy missing — MR1 requires signing prep without secrets in git.",
    };
  }
  checks.push("signing_policy_present");

  const specPath = path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_SPEC.md — MR1 requires Spec FROZEN.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (!/MR1 · Preparation[\s\S]*Ready for Android Build/.test(specText)) {
    return {
      ok: false,
      checks,
      reason:
        "Spec MR1 block missing Ready for Android Build outcome — Preparation incomplete.",
    };
  }
  checks.push("ready_for_android_build_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "MOBILE_RELEASE_MR1_STARTED",
      "MOBILE_RELEASE_MR1_COMPLETED",
    ],
    source:
      "versioning Android/iOS · release buildType · build:mobile · checklist · signing policy (no secrets) · Ready for Android Build · Gate READY (no APK · no signing · no CI · Core Integrity)",
  };
}
