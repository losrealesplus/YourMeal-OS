/**
 * MOBILE-RELEASE · MR4 iOS Archive.
 *
 * Certifies reproducible Xcode Archive contract:
 *   Ready for iOS Archive → Release project · signing prepared · archive recipe
 *   → Ready for Internal Testing Acceptance
 *
 * Requires Gate READY authorizing MR01-004 + Spec FROZEN MR4 outcome.
 * Does NOT export IPA · TestFlight · App Store · CI · MR5.
 *
 * Host note: `.xcarchive` binaries require macOS + Xcode. This driver certifies
 * the archive-ready project + evidence fingerprint; when a live archive exists,
 * it is verified. Core Integrity Rule · No Artificiality.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MOBILE_RELEASE_MR4_PRECONDITIONS = Object.freeze([
  "mobile_release_gate_authorizes_004",
  "mr3_android_signing_acta_present",
  "ios_xcode_project_valid",
  "ios_release_configuration_present",
  "ios_versioning_intact",
  "ios_signing_identity_prepared",
  "ios_archive_secrets_out_of_git",
  "ios_archive_policy_present",
  "ios_archive_evidence_manifest",
  "ready_for_internal_testing_acceptance_spec_present",
]);

export const MR4_EVIDENCE_MANIFEST_REL =
  "docs/10-validation/mobile-release/evidence/mr4-ios-archive.json";

export const MR4_ARCHIVE_RECIPE = Object.freeze({
  scheme: "App",
  configuration: "Release",
  workspace_or_project: "ios/App/App.xcodeproj",
  xcodebuild: [
    "xcodebuild",
    "-project",
    "ios/App/App.xcodeproj",
    "-scheme",
    "App",
    "-configuration",
    "Release",
    "-archivePath",
    "ios/build/App.xcarchive",
    "archive",
  ],
});

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 *   archive?: Record<string, unknown>,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} Mr4Result
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
 * Recursively hash a directory (stable path order) for .xcarchive fingerprints.
 * @param {string} dir
 */
function sha256Tree(dir) {
  const hash = crypto.createHash("sha256");
  /** @type {string[]} */
  const files = [];
  function walk(current) {
    for (const name of fs.readdirSync(current).sort()) {
      const p = path.join(current, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else files.push(p);
    }
  }
  walk(dir);
  for (const f of files) {
    hash.update(path.relative(dir, f));
    hash.update("\0");
    hash.update(fs.readFileSync(f));
  }
  return { sha256: hash.digest("hex"), file_count: files.length };
}

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {Mr4Result}
 */
export function runMobileReleaseMr4IosArchive(opts = {}) {
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
        "Missing MOBILE_RELEASE_01_GATE.md — MR4 requires Gate authorizing MR01-004.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/MR01-004/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "MOBILE_RELEASE_01_GATE.md does not authorize MR01-004 — Land Check Runner/Gate first.",
    };
  }
  checks.push("mobile_release_gate_authorizes_004");

  const mr3Acta = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_003_MR3_ACTA.md",
  );
  if (!fs.existsSync(mr3Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MR01_003_MR3_ACTA.md — MR4 requires Ready for iOS Archive (MR3).",
    };
  }
  const mr3Text = fs.readFileSync(mr3Acta, "utf8");
  if (!/Ready for iOS Archive/i.test(mr3Text)) {
    return {
      ok: false,
      checks,
      reason: "MR3 acta missing Ready for iOS Archive outcome.",
    };
  }
  checks.push("mr3_android_signing_acta_present");

  const pbxPath = path.join(cwd, "ios/App/App.xcodeproj/project.pbxproj");
  const infoPath = path.join(cwd, "ios/App/App/Info.plist");
  if (!fs.existsSync(pbxPath) || !fs.existsSync(infoPath)) {
    return {
      ok: false,
      checks,
      reason: "iOS Xcode project incomplete — missing pbxproj or Info.plist.",
    };
  }
  const pbxText = fs.readFileSync(pbxPath, "utf8");
  if (!/PBXNativeTarget/.test(pbxText) || !/App/.test(pbxText)) {
    return {
      ok: false,
      checks,
      reason: "iOS Xcode project does not look like a valid App target.",
    };
  }
  checks.push("ios_xcode_project_valid");

  if (
    !/name = Release;/.test(pbxText) ||
    !/defaultConfigurationName = Release;/.test(pbxText)
  ) {
    return {
      ok: false,
      checks,
      reason: "iOS Release configuration missing — Archive requires Release.",
    };
  }
  checks.push("ios_release_configuration_present");

  const marketing = pbxText.match(/MARKETING_VERSION = ([^;]+);/);
  const current = pbxText.match(/CURRENT_PROJECT_VERSION = ([^;]+);/);
  const bundleId = pbxText.match(
    /PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/,
  );
  if (!marketing || !current || !bundleId) {
    return {
      ok: false,
      checks,
      reason:
        "iOS MARKETING_VERSION / CURRENT_PROJECT_VERSION / bundle id missing.",
    };
  }
  const marketingVersion = marketing[1].trim();
  const currentProjectVersion = current[1].trim();
  const productBundleId = bundleId[1].trim();
  checks.push("ios_versioning_intact");

  // Signing identity prepared: Automatic style, no committed mobileprovision secrets.
  if (!/CODE_SIGN_STYLE = Automatic;/.test(pbxText)) {
    return {
      ok: false,
      checks,
      reason:
        "CODE_SIGN_STYLE Automatic missing — MR4 requires signing identity prepared (not Production store).",
    };
  }
  checks.push("ios_signing_identity_prepared");

  const iosGitignore = path.join(cwd, "ios/.gitignore");
  const rootGitignore = path.join(cwd, ".gitignore");
  const ignoreBlob = [
    fs.existsSync(iosGitignore) ? fs.readFileSync(iosGitignore, "utf8") : "",
    fs.existsSync(rootGitignore) ? fs.readFileSync(rootGitignore, "utf8") : "",
  ].join("\n");

  // Fail if provisioning / AuthKey secrets appear under ios/
  const iosRoot = path.join(cwd, "ios");
  /** @type {string[]} */
  const forbidden = [];
  function scanSecrets(dir, depth = 0) {
    if (depth > 4) return;
    for (const name of fs.readdirSync(dir)) {
      if (name === "node_modules" || name === "Pods" || name === "build") continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) scanSecrets(p, depth + 1);
      else if (/\.p8$/i.test(name) || /\.mobileprovision$/i.test(name)) {
        forbidden.push(path.relative(cwd, p));
      }
    }
  }
  scanSecrets(iosRoot);
  if (forbidden.length) {
    return {
      ok: false,
      checks,
      reason: `iOS signing secrets in tree: ${forbidden.join(", ")} — must stay outside Git.`,
    };
  }
  if (!/\*\.xcarchive|\.xcarchive/i.test(ignoreBlob)) {
    return {
      ok: false,
      checks,
      reason:
        "gitignore must exclude *.xcarchive — Native Tool Artifacts stay out of Git.",
    };
  }
  checks.push("ios_archive_secrets_out_of_git");

  const policyPath = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_IOS_ARCHIVE_POLICY.md",
  );
  if (!fs.existsSync(policyPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MR01_IOS_ARCHIVE_POLICY.md — MR4 requires Archive policy.",
    };
  }
  const policyText = fs.readFileSync(policyPath, "utf8");
  if (
    !/xcarchive/i.test(policyText) ||
    !/xcodebuild/i.test(policyText) ||
    !/never|NUNCA|must not/i.test(policyText)
  ) {
    return {
      ok: false,
      checks,
      reason:
        "iOS Archive policy incomplete — must document .xcarchive, xcodebuild, secrets out of Git.",
    };
  }
  checks.push("ios_archive_policy_present");

  const manifestPath = path.join(cwd, MR4_EVIDENCE_MANIFEST_REL);
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      checks,
      reason: `Missing ${MR4_EVIDENCE_MANIFEST_REL} — MR4 requires archive evidence.`,
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
      reason: "mr4-ios-archive.json is not valid JSON.",
    };
  }

  if (manifest.segment !== "ios_archive") {
    return {
      ok: false,
      checks,
      reason: 'Evidence must declare segment: "ios_archive".',
    };
  }
  if (
    String(manifest.marketing_version) !== marketingVersion ||
    String(manifest.current_project_version) !== currentProjectVersion ||
    String(manifest.product_bundle_identifier) !== productBundleId
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Evidence versioning/bundle mismatch vs project.pbxproj — re-run mobile-release:mr4:record-archive.",
    };
  }
  if (
    typeof manifest.project_pbxproj_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/i.test(manifest.project_pbxproj_sha256)
  ) {
    return {
      ok: false,
      checks,
      reason: "Evidence missing project_pbxproj_sha256.",
    };
  }
  const livePbxSha = sha256File(pbxPath);
  if (livePbxSha !== manifest.project_pbxproj_sha256) {
    return {
      ok: false,
      checks,
      reason:
        "Live project.pbxproj sha256 differs from evidence — re-record MR4 evidence.",
    };
  }
  if (
    !manifest.archive_recipe ||
    typeof manifest.archive_recipe !== "object" ||
    !Array.isArray(
      /** @type {{ xcodebuild?: unknown }} */ (manifest.archive_recipe)
        .xcodebuild,
    )
  ) {
    return {
      ok: false,
      checks,
      reason: "Evidence missing archive_recipe.xcodebuild command list.",
    };
  }

  /** @type {Record<string, unknown> | null} */
  let liveArchive = null;
  const archiveRel =
    typeof manifest.xcarchive_relative_path === "string"
      ? manifest.xcarchive_relative_path
      : "ios/build/App.xcarchive";
  const archiveAbs = path.join(cwd, archiveRel);
  if (fs.existsSync(archiveAbs) && fs.statSync(archiveAbs).isDirectory()) {
    const infoPlist = path.join(archiveAbs, "Info.plist");
    const products = path.join(archiveAbs, "Products");
    if (!fs.existsSync(infoPlist) || !fs.existsSync(products)) {
      return {
        ok: false,
        checks,
        reason:
          "Live .xcarchive incomplete — need Info.plist and Products/ (Xcode Archive layout).",
      };
    }
    const tree = sha256Tree(archiveAbs);
    const bytes = (() => {
      let total = 0;
      function walk(d) {
        for (const name of fs.readdirSync(d)) {
          const p = path.join(d, name);
          const st = fs.statSync(p);
          if (st.isDirectory()) walk(p);
          else total += st.size;
        }
      }
      walk(archiveAbs);
      return total;
    })();
    if (
      manifest.xcarchive &&
      typeof manifest.xcarchive === "object" &&
      /** @type {Record<string, unknown>} */ (manifest.xcarchive).sha256 &&
      /** @type {Record<string, unknown>} */ (manifest.xcarchive).sha256 !==
        tree.sha256
    ) {
      return {
        ok: false,
        checks,
        reason:
          "Live .xcarchive hash mismatch vs evidence — re-run record on macOS.",
      };
    }
    liveArchive = {
      present: true,
      relative_path: archiveRel,
      bytes,
      sha256: tree.sha256,
      file_count: tree.file_count,
    };
  } else {
    // Contract mode: archive binary produced on macOS; evidence must declare host requirement.
    if (manifest.xcarchive_status !== "contract_ready_pending_macos") {
      return {
        ok: false,
        checks,
        reason:
          'No live .xcarchive — evidence must set xcarchive_status: "contract_ready_pending_macos" (or produce archive on macOS).',
      };
    }
    liveArchive = {
      present: false,
      note: "Archive binary requires macOS + Xcode; recipe + project fingerprint certified",
    };
  }
  checks.push("ios_archive_evidence_manifest");

  const specPath = path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_SPEC.md — MR4 requires Spec FROZEN.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (
    !/MR4 · iOS Archive[\s\S]*Ready for Internal Testing Acceptance/.test(
      specText,
    )
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Spec MR4 block missing Ready for Internal Testing Acceptance — iOS Archive incomplete.",
    };
  }
  checks.push("ready_for_internal_testing_acceptance_spec_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "MOBILE_RELEASE_MR4_STARTED",
      "MOBILE_RELEASE_MR4_COMPLETED",
    ],
    source:
      "iOS Release project · CODE_SIGN Automatic · archive recipe · pbxproj fingerprint · secrets out of Git · Ready for Internal Testing Acceptance · Gate READY (no IPA · no TestFlight · no CI · Core Integrity)",
    archive: {
      marketing_version: marketingVersion,
      current_project_version: currentProjectVersion,
      product_bundle_identifier: productBundleId,
      project_pbxproj_sha256: livePbxSha,
      recipe: MR4_ARCHIVE_RECIPE,
      evidence_manifest: MR4_EVIDENCE_MANIFEST_REL,
      live: liveArchive,
      xcarchive_status: manifest.xcarchive_status ?? null,
    },
  };
}
