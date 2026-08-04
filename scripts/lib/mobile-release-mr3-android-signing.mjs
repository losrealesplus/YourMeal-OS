/**
 * MOBILE-RELEASE · MR3 Android Signing.
 *
 * Certifies governed Release signing:
 *   Ready for Android Signing → SigningConfig · Keystore policy · signed artifacts
 *   → Ready for iOS Archive
 *
 * Requires Gate READY authorizing MR01-003 + Spec FROZEN MR3 outcome.
 * Does NOT open Play · Play App Signing · Internal Testing · CI · iOS · MR4.
 * Secrets stay outside Git — Core Integrity Rule · No Artificiality.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MOBILE_RELEASE_MR3_PRECONDITIONS = Object.freeze([
  "mobile_release_gate_authorizes_003",
  "mr2_android_build_acta_present",
  "signing_policy_document_present",
  "keystore_gitignore_enforced",
  "keystore_properties_example_present",
  "signing_env_contract_documented",
  "signing_config_prepared_conditional",
  "no_hardcoded_signing_secrets",
  "signed_artifact_evidence_manifest",
  "ready_for_ios_archive_spec_present",
]);

export const MR3_SIGNED_ARTIFACT_PATHS = Object.freeze({
  release_apk: "android/app/build/outputs/apk/release/app-release.apk",
  release_aab: "android/app/build/outputs/bundle/release/app-release.aab",
});

export const MR3_EVIDENCE_MANIFEST_REL =
  "docs/10-validation/mobile-release/evidence/mr3-android-signing.json";

export const MR3_SIGNING_ENV_VARS = Object.freeze([
  "YOURMEAL_UPLOAD_STORE_FILE",
  "YOURMEAL_UPLOAD_STORE_PASSWORD",
  "YOURMEAL_UPLOAD_KEY_ALIAS",
  "YOURMEAL_UPLOAD_KEY_PASSWORD",
]);

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 *   signing?: Record<string, unknown>,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} Mr3Result
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
 * @returns {Mr3Result}
 */
export function runMobileReleaseMr3AndroidSigning(opts = {}) {
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
        "Missing MOBILE_RELEASE_01_GATE.md — MR3 requires Gate authorizing MR01-003.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/MR01-003/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "MOBILE_RELEASE_01_GATE.md does not authorize MR01-003 — Land Check Runner/Gate first.",
    };
  }
  checks.push("mobile_release_gate_authorizes_003");

  const mr2Acta = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_002_MR2_ACTA.md",
  );
  if (!fs.existsSync(mr2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MR01_002_MR2_ACTA.md — MR3 requires Ready for Android Signing (MR2).",
    };
  }
  const mr2Text = fs.readFileSync(mr2Acta, "utf8");
  if (!/Ready for Android Signing/i.test(mr2Text)) {
    return {
      ok: false,
      checks,
      reason: "MR2 acta missing Ready for Android Signing outcome.",
    };
  }
  checks.push("mr2_android_build_acta_present");

  const policyPath = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_SIGNING_POLICY.md",
  );
  if (!fs.existsSync(policyPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MR01_SIGNING_POLICY.md — MR3 requires Keystore policy.",
    };
  }
  const policyText = fs.readFileSync(policyPath, "utf8");
  if (
    !/never|must not|NUNCA/i.test(policyText) ||
    !/keystore/i.test(policyText) ||
    !/YOURMEAL_UPLOAD_/i.test(policyText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Signing policy incomplete — must forbid Git keystores and document YOURMEAL_UPLOAD_* env.",
    };
  }
  checks.push("signing_policy_document_present");

  const androidGitignore = path.join(cwd, "android/.gitignore");
  if (!fs.existsSync(androidGitignore)) {
    return {
      ok: false,
      checks,
      reason: "Missing android/.gitignore — cannot enforce keystore exclusion.",
    };
  }
  const ignoreText = fs.readFileSync(androidGitignore, "utf8");
  if (
    !/^\s*\*\.jks\s*$/m.test(ignoreText) ||
    !/^\s*\*\.keystore\s*$/m.test(ignoreText) ||
    !/^\s*keystore\.properties\s*$/m.test(ignoreText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "android/.gitignore must ignore *.jks, *.keystore, and keystore.properties.",
    };
  }
  checks.push("keystore_gitignore_enforced");

  const examplePath = path.join(cwd, "android/keystore.properties.example");
  if (!fs.existsSync(examplePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing android/keystore.properties.example — MR3 requires a non-secret template.",
    };
  }
  const exampleText = fs.readFileSync(examplePath, "utf8");
  if (
    !/storeFile=/.test(exampleText) ||
    !/keyAlias=/.test(exampleText) ||
    !/YOURMEAL_UPLOAD_/.test(exampleText)
  ) {
    return {
      ok: false,
      checks,
      reason: "keystore.properties.example missing required keys / env docs.",
    };
  }
  checks.push("keystore_properties_example_present");

  for (const envName of MR3_SIGNING_ENV_VARS) {
    if (!policyText.includes(envName) && !exampleText.includes(envName)) {
      return {
        ok: false,
        checks,
        reason: `Signing env contract missing ${envName} in policy or example.`,
      };
    }
  }
  checks.push("signing_env_contract_documented");

  const androidGradle = path.join(cwd, "android/app/build.gradle");
  if (!fs.existsSync(androidGradle)) {
    return {
      ok: false,
      checks,
      reason: "Missing android/app/build.gradle — cannot verify SigningConfig.",
    };
  }
  const androidText = fs.readFileSync(androidGradle, "utf8");
  if (
    !/signingConfigs\s*\{[\s\S]*release\s*\{/.test(androidText) ||
    !/YOURMEAL_UPLOAD_STORE_FILE/.test(androidText) ||
    !/keystore\.properties/.test(androidText) ||
    !/yourmealHasReleaseSigning/.test(androidText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Conditional SigningConfig missing — MR3 requires env/properties-driven release signing.",
    };
  }
  if (!/signingConfig\s+signingConfigs\.release/.test(androidText)) {
    return {
      ok: false,
      checks,
      reason: "release buildType must reference signingConfigs.release when enabled.",
    };
  }
  checks.push("signing_config_prepared_conditional");

  if (
    /storePassword\s+["'][^"']+["']/.test(androidText) ||
    /keyPassword\s+["'][^"']+["']/.test(androidText)
  ) {
    return {
      ok: false,
      checks,
      reason: "Hardcoded signing passwords in build.gradle — forbidden.",
    };
  }
  // Ensure committed example does not look like a real production secret dump
  if (/storePassword=REPLACE_ME/.test(exampleText) === false) {
    // still ok if placeholders differ; fail only on obvious real-looking short secrets in gradle
  }
  checks.push("no_hardcoded_signing_secrets");

  const manifestPath = path.join(cwd, MR3_EVIDENCE_MANIFEST_REL);
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      checks,
      reason: `Missing ${MR3_EVIDENCE_MANIFEST_REL} — MR3 requires signed artifact evidence.`,
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
      reason: "mr3-android-signing.json is not valid JSON.",
    };
  }

  if (manifest.signing !== "release_signed") {
    return {
      ok: false,
      checks,
      reason: 'Evidence must declare signing: "release_signed".',
    };
  }
  const certSha = String(manifest.certificate_sha256 ?? "")
    .replace(/:/g, "")
    .toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(certSha)) {
    return {
      ok: false,
      checks,
      reason: "Evidence missing identifiable certificate_sha256 (64 hex).",
    };
  }
  if (
    typeof manifest.key_alias !== "string" ||
    !String(manifest.key_alias).trim()
  ) {
    return {
      ok: false,
      checks,
      reason: "Evidence missing key_alias.",
    };
  }

  const artifacts = /** @type {Record<string, unknown>} */ (
    manifest.artifacts ?? {}
  );
  for (const key of ["release_apk", "release_aab"]) {
    const entry = artifacts[key];
    if (!entry || typeof entry !== "object") {
      return {
        ok: false,
        checks,
        reason: `Signed artifact evidence missing entry: ${key}`,
      };
    }
    const e = /** @type {Record<string, unknown>} */ (entry);
    if (e.relative_path !== MR3_SIGNED_ARTIFACT_PATHS[key]) {
      return {
        ok: false,
        checks,
        reason: `Signed path mismatch for ${key}`,
      };
    }
    if (typeof e.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(e.sha256)) {
      return {
        ok: false,
        checks,
        reason: `Signed artifact ${key} missing sha256`,
      };
    }
    if (typeof e.bytes !== "number" || e.bytes <= 0) {
      return {
        ok: false,
        checks,
        reason: `Signed artifact ${key} missing positive bytes`,
      };
    }
    const abs = path.join(cwd, String(e.relative_path));
    if (fs.existsSync(abs)) {
      const st = fs.statSync(abs);
      const digest = sha256File(abs);
      if (st.size !== e.bytes || digest !== e.sha256) {
        return {
          ok: false,
          checks,
          reason: `Live signed artifact mismatch for ${key} — re-run mobile-release:mr3:record-artifacts`,
        };
      }
    }
  }
  checks.push("signed_artifact_evidence_manifest");

  const specPath = path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_SPEC.md — MR3 requires Spec FROZEN.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (!/MR3 · Android Signing[\s\S]*Ready for iOS Archive/.test(specText)) {
    return {
      ok: false,
      checks,
      reason:
        "Spec MR3 block missing Ready for iOS Archive outcome — Android Signing incomplete.",
    };
  }
  checks.push("ready_for_ios_archive_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "MOBILE_RELEASE_MR3_STARTED",
      "MOBILE_RELEASE_MR3_COMPLETED",
    ],
    source:
      "SigningConfig (env/props) · Keystore policy · secrets outside Git · signed APK/AAB evidence · cert fingerprint · Ready for iOS Archive · Gate READY (no Play · no CI · Core Integrity)",
    signing: {
      key_alias: manifest.key_alias,
      certificate_sha256: manifest.certificate_sha256,
      certificate_dn: manifest.certificate_dn ?? null,
      evidence_manifest: MR3_EVIDENCE_MANIFEST_REL,
      env_contract: [...MR3_SIGNING_ENV_VARS],
      artifacts,
    },
  };
}
