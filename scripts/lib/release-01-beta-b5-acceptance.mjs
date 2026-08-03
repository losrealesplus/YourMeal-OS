/**
 * RELEASE-01-BETA · B5 Beta Acceptance.
 *
 * Certifies the product-as-a-whole for first beta acceptance:
 *   Outcomes B1–B4 CERTIFIED · acceptance checklist · Gate/Runner present
 *
 * Does NOT invent product. Does NOT open FLOW-05.
 * Does NOT create tag `release-01-beta` (tag only after Land Check from main).
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_BETA_B5_PRECONDITIONS = Object.freeze([
  "release_01_beta_b4_acta_certified",
  "release_01_beta_b1_acta_certified",
  "release_01_beta_b2_acta_certified",
  "release_01_beta_b3_acta_certified",
  "release_01_beta_acceptance_checklist_present",
  "release_01_beta_gate_present",
  "release_01_beta_runner_present",
]);

const SEGMENT_ACTAS = Object.freeze([
  {
    id: "release_01_beta_b1_acta_certified",
    rel: "docs/10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md",
    label: "B1",
  },
  {
    id: "release_01_beta_b2_acta_certified",
    rel: "docs/10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md",
    label: "B2",
  },
  {
    id: "release_01_beta_b3_acta_certified",
    rel: "docs/10-validation/release-01-beta/RELEASE_01_BETA_003_B3_ACTA.md",
    label: "B3",
  },
  {
    id: "release_01_beta_b4_acta_certified",
    rel: "docs/10-validation/release-01-beta/RELEASE_01_BETA_004_B4_ACTA.md",
    label: "B4",
  },
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
 * }} B5Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B5Result}
 */
export function runRelease01BetaB5Acceptance(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  // B4 first — immediate predecessor (Land Check discipline).
  const b4 = SEGMENT_ACTAS[3];
  const b4Path = path.join(cwd, b4.rel);
  if (!fs.existsSync(b4Path)) {
    return {
      ok: false,
      checks,
      reason: `Missing ${b4.rel} — B5 requires B4 CERTIFIED.`,
    };
  }
  if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(b4Path, "utf8"))) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_BETA_004_B4_ACTA.md is not CERTIFIED from main — Land Check B4 first.",
    };
  }
  checks.push("release_01_beta_b4_acta_certified");

  for (const seg of SEGMENT_ACTAS.slice(0, 3)) {
    const p = path.join(cwd, seg.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: `Missing ${seg.rel} — B5 acceptance requires ${seg.label} outcome.`,
      };
    }
    if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(p, "utf8"))) {
      return {
        ok: false,
        checks,
        reason: `${path.basename(seg.rel)} is not CERTIFIED from main — acceptance incomplete.`,
      };
    }
    checks.push(seg.id);
  }

  const acceptancePath = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_ACCEPTANCE.md",
  );
  if (!fs.existsSync(acceptancePath)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing RELEASE_01_BETA_ACCEPTANCE.md (canonical acceptance checklist).",
    };
  }
  const acceptanceText = fs.readFileSync(acceptancePath, "utf8");
  if (
    !/B1 Foundation/i.test(acceptanceText) ||
    !/B2 Canonical Flows/i.test(acceptanceText) ||
    !/B3 Platform Capabilities/i.test(acceptanceText) ||
    !/B4 Release Stack/i.test(acceptanceText) ||
    !/RELEASE_01_BETA_B5_/i.test(acceptanceText)
  ) {
    return {
      ok: false,
      checks,
      reason: [
        "RELEASE_01_BETA_ACCEPTANCE.md is incomplete.",
        "Expected B1–B4 segment labels and RELEASE_01_BETA_B5_ markers.",
      ].join("\n"),
    };
  }
  checks.push("release_01_beta_acceptance_checklist_present");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_BETA_GATE.md.",
    };
  }
  checks.push("release_01_beta_gate_present");

  const runnerPath = path.join(
    cwd,
    "docs/10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md",
  );
  if (!fs.existsSync(runnerPath)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_BETA_RUNNER.md.",
    };
  }
  checks.push("release_01_beta_runner_present");

  return {
    ok: true,
    checks,
    mapped_tokens: [
      "RELEASE_01_BETA_B5_STARTED",
      "RELEASE_01_BETA_B5_COMPLETED",
    ],
    source:
      "B1–B4 CERTIFIED · acceptance checklist · Gate/Runner (no FLOW-05 · no tag in this PR)",
  };
}
