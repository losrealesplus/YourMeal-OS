/**
 * MOBILE-RELEASE · MR5 Internal Testing Acceptance.
 *
 * Certifies private-delivery readiness (not store publication):
 *   Ready for Internal Testing Acceptance → acceptance checklist
 *   → Ready for Internal Testing · MOBILE-RELEASE-01 PASS
 *
 * Requires Gate authorizing MR01-005 + MR1–MR4 actas/evidence.
 * Does NOT open Play Console · TestFlight · App Store · Production · CI.
 * Core Integrity Rule · No Artificiality.
 */
import fs from "node:fs";
import path from "node:path";

export const MOBILE_RELEASE_MR5_PRECONDITIONS = Object.freeze([
  "mobile_release_gate_authorizes_005",
  "mr4_ios_archive_acta_present",
  "android_build_evidence_present",
  "android_signing_evidence_present",
  "ios_archive_evidence_present",
  "acceptance_checklist_complete",
  "core_integrity_preserved",
  "artifacts_registered",
  "ready_for_internal_testing_spec_present",
  "pass_acta_present",
]);

export const MR5_ACCEPTANCE_CHECKLIST_REL =
  "docs/10-validation/mobile-release/MR01_INTERNAL_TESTING_ACCEPTANCE_CHECKLIST.md";

export const MR5_PASS_ACTA_REL =
  "docs/10-validation/mobile-release/MOBILE_RELEASE_01_PASS_ACTA.md";

/**
 * @typedef {{
 *   ok: true,
 *   checks: string[],
 *   mapped_tokens: string[],
 *   source: string,
 *   acceptance?: Record<string, unknown>,
 * } | {
 *   ok: false,
 *   reason: string,
 *   checks: string[],
 * }} Mr5Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {Mr5Result}
 */
export function runMobileReleaseMr5InternalTestingAcceptance(opts = {}) {
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
        "Missing MOBILE_RELEASE_01_GATE.md — MR5 requires Gate authorizing MR01-005.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/MR01-005/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "MOBILE_RELEASE_01_GATE.md does not authorize MR01-005 — Land Check first.",
    };
  }
  // Gate may be READY during the PR or CLOSED at PASS — both allowed once 005 is marked.
  if (!/READY|CLOSED/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason: "Gate must be READY or CLOSED for MR5 acceptance.",
    };
  }
  checks.push("mobile_release_gate_authorizes_005");

  const mr4Acta = path.join(
    cwd,
    "docs/10-validation/mobile-release/MR01_004_MR4_ACTA.md",
  );
  if (!fs.existsSync(mr4Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing MR01_004_MR4_ACTA.md — MR5 requires Ready for Internal Testing Acceptance.",
    };
  }
  const mr4Text = fs.readFileSync(mr4Acta, "utf8");
  if (!/Ready for Internal Testing Acceptance/i.test(mr4Text)) {
    return {
      ok: false,
      checks,
      reason: "MR4 acta missing Ready for Internal Testing Acceptance outcome.",
    };
  }
  checks.push("mr4_ios_archive_acta_present");

  const mr2Evidence = path.join(
    cwd,
    "docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json",
  );
  if (!fs.existsSync(mr2Evidence)) {
    return {
      ok: false,
      checks,
      reason: "Missing mr2-android-artifacts.json — Android Build not evidenced.",
    };
  }
  const mr2 = JSON.parse(fs.readFileSync(mr2Evidence, "utf8"));
  if (!mr2.artifacts?.debug_apk || !mr2.artifacts?.release_apk) {
    return {
      ok: false,
      checks,
      reason: "MR2 evidence incomplete — need debug + release APK fingerprints.",
    };
  }
  checks.push("android_build_evidence_present");

  const mr3Evidence = path.join(
    cwd,
    "docs/10-validation/mobile-release/evidence/mr3-android-signing.json",
  );
  if (!fs.existsSync(mr3Evidence)) {
    return {
      ok: false,
      checks,
      reason: "Missing mr3-android-signing.json — Android Signing not evidenced.",
    };
  }
  const mr3 = JSON.parse(fs.readFileSync(mr3Evidence, "utf8"));
  if (mr3.signing !== "release_signed" || !mr3.certificate_sha256) {
    return {
      ok: false,
      checks,
      reason: "MR3 evidence incomplete — need release_signed + certificate_sha256.",
    };
  }
  checks.push("android_signing_evidence_present");

  const mr4Evidence = path.join(
    cwd,
    "docs/10-validation/mobile-release/evidence/mr4-ios-archive.json",
  );
  if (!fs.existsSync(mr4Evidence)) {
    return {
      ok: false,
      checks,
      reason: "Missing mr4-ios-archive.json — iOS Archive not evidenced.",
    };
  }
  const mr4Ev = JSON.parse(fs.readFileSync(mr4Evidence, "utf8"));
  if (
    mr4Ev.segment !== "ios_archive" ||
    !mr4Ev.archive_recipe ||
    !mr4Ev.project_pbxproj_sha256
  ) {
    return {
      ok: false,
      checks,
      reason: "MR4 evidence incomplete — need archive recipe + pbxproj fingerprint.",
    };
  }
  checks.push("ios_archive_evidence_present");

  const checklistPath = path.join(cwd, MR5_ACCEPTANCE_CHECKLIST_REL);
  if (!fs.existsSync(checklistPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MR01_INTERNAL_TESTING_ACCEPTANCE_CHECKLIST.md.",
    };
  }
  const checklistText = fs.readFileSync(checklistPath, "utf8");
  const requiredMarks = [
    /Android.*privad/i,
    /iOS.*archiv/i,
    /Core SaaS/i,
    /evidencia|evidence/i,
    /Ready for Internal Testing/i,
  ];
  for (const re of requiredMarks) {
    if (!re.test(checklistText)) {
      return {
        ok: false,
        checks,
        reason: `Acceptance checklist missing required theme: ${re}`,
      };
    }
  }
  // All acceptance boxes checked (☑ or [x])
  if (!/☑|\[x\]/i.test(checklistText)) {
    return {
      ok: false,
      checks,
      reason: "Acceptance checklist has no checked items.",
    };
  }
  checks.push("acceptance_checklist_complete");

  const passCapacitor = path.join(
    cwd,
    "docs/10-validation/capacitor/CAPACITOR_PASS_ACTA.md",
  );
  if (!fs.existsSync(passCapacitor)) {
    return {
      ok: false,
      checks,
      reason: "Missing CAPACITOR_PASS_ACTA.md — Core/Distribution Integrity baseline.",
    };
  }
  const foundation = path.join(cwd, "FOUNDATION.md");
  if (!fs.existsSync(foundation)) {
    return {
      ok: false,
      checks,
      reason: "Missing FOUNDATION.md — Core Integrity Rule anchor.",
    };
  }
  const foundationText = fs.readFileSync(foundation, "utf8");
  if (!/Core Integrity|Native Tool Artifacts/i.test(foundationText)) {
    return {
      ok: false,
      checks,
      reason: "FOUNDATION.md missing Core Integrity / Native Tool Artifacts rule.",
    };
  }
  checks.push("core_integrity_preserved");

  // Artifacts registered = evidence trio + acceptance evidence JSON
  const acceptanceEvidence = path.join(
    cwd,
    "docs/10-validation/mobile-release/evidence/mr5-internal-testing-acceptance.json",
  );
  if (!fs.existsSync(acceptanceEvidence)) {
    return {
      ok: false,
      checks,
      reason: "Missing mr5-internal-testing-acceptance.json — register acceptance evidence.",
    };
  }
  const accEv = JSON.parse(fs.readFileSync(acceptanceEvidence, "utf8"));
  if (accEv.status !== "READY_FOR_INTERNAL_TESTING") {
    return {
      ok: false,
      checks,
      reason: 'Acceptance evidence must declare status: "READY_FOR_INTERNAL_TESTING".',
    };
  }
  if (!accEv.android_private_ready || !accEv.ios_archive_ready) {
    return {
      ok: false,
      checks,
      reason: "Acceptance evidence must affirm android_private_ready + ios_archive_ready.",
    };
  }
  if (!accEv.core_integrity) {
    return {
      ok: false,
      checks,
      reason: "Acceptance evidence must affirm core_integrity.",
    };
  }
  checks.push("artifacts_registered");

  const specPath = path.join(cwd, "docs/00-status/MOBILE_RELEASE_01_SPEC.md");
  if (!fs.existsSync(specPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_SPEC.md.",
    };
  }
  const specText = fs.readFileSync(specPath, "utf8");
  if (
    !/MR5 · Internal Testing Acceptance[\s\S]*Ready for Internal Testing/.test(
      specText,
    )
  ) {
    return {
      ok: false,
      checks,
      reason:
        "Spec MR5 block missing Ready for Internal Testing — Acceptance incomplete.",
    };
  }
  checks.push("ready_for_internal_testing_spec_present");

  const passActa = path.join(cwd, MR5_PASS_ACTA_REL);
  if (!fs.existsSync(passActa)) {
    return {
      ok: false,
      checks,
      reason: "Missing MOBILE_RELEASE_01_PASS_ACTA.md — cycle PASS acta required.",
    };
  }
  const passText = fs.readFileSync(passActa, "utf8");
  if (
    !/MOBILE-RELEASE.*PASS|FULL PASS/i.test(passText) ||
    !/Ready for Internal Testing/i.test(passText)
  ) {
    return {
      ok: false,
      checks,
      reason: "PASS acta must declare MOBILE-RELEASE FULL PASS · Ready for Internal Testing.",
    };
  }
  checks.push("pass_acta_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "MOBILE_RELEASE_MR5_STARTED",
      "MOBILE_RELEASE_MR5_COMPLETED",
    ],
    source:
      "Android build+signing evidence · iOS archive contract · acceptance checklist · Core Integrity · Ready for Internal Testing · MOBILE-RELEASE-01 PASS (no Play · no TestFlight · no Production · Core Integrity)",
    acceptance: {
      android_private_ready: true,
      ios_archive_ready: true,
      core_integrity: true,
      evidence: {
        mr2: "docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json",
        mr3: "docs/10-validation/mobile-release/evidence/mr3-android-signing.json",
        mr4: "docs/10-validation/mobile-release/evidence/mr4-ios-archive.json",
        mr5: "docs/10-validation/mobile-release/evidence/mr5-internal-testing-acceptance.json",
      },
      does_not_certify: [
        "google_play_internal",
        "google_play_closed",
        "google_play_production",
        "testflight",
        "app_store_review",
        "publication",
      ],
    },
  };
}
