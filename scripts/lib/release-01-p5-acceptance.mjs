/**
 * RELEASE-01 · P5 Product Acceptance.
 *
 * Certifies the SaaS product as a whole for RELEASE-01:
 *   P1–P4 CERTIFIED from main · global consistency
 *
 * Requires P4 CERTIFIED from main. Does NOT open FLOW-05 / Capacitor.
 * Does NOT execute Deploy, Rollback, Flows, or change product behavior.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_P5_PRECONDITIONS = Object.freeze([
  "release_01_p4_acta_certified",
  "release_01_foundation_complete",
  "release_01_business_complete",
  "release_01_operations_complete",
  "release_01_administration_complete",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string }>} */
const P5_SEGMENT_ACTAS = Object.freeze([
  {
    id: "release_01_foundation_complete",
    rel: "docs/10-validation/release-01/RELEASE_01_001_P1_ACTA.md",
    label: "P1 Platform Foundation",
  },
  {
    id: "release_01_business_complete",
    rel: "docs/10-validation/release-01/RELEASE_01_002_P2_ACTA.md",
    label: "P2 Core Business",
  },
  {
    id: "release_01_operations_complete",
    rel: "docs/10-validation/release-01/RELEASE_01_003_P3_ACTA.md",
    label: "P3 Operations",
  },
  {
    id: "release_01_administration_complete",
    rel: "docs/10-validation/release-01/RELEASE_01_004_P4_ACTA.md",
    label: "P4 Administration",
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
 * }} P5Result
 */

/**
 * @param {string} cwd
 * @param {string} rel
 * @param {string} label
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
function assertActaCertified(cwd, rel, label) {
  const p = path.join(cwd, rel);
  if (!fs.existsSync(p)) {
    return {
      ok: false,
      reason: `Missing ${rel} — P5 requires ${label} CERTIFIED.`,
    };
  }
  if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(p, "utf8"))) {
    return {
      ok: false,
      reason: `${path.basename(rel)} is not CERTIFIED from main — acceptance incomplete.`,
    };
  }
  return { ok: true };
}

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {P5Result}
 */
export function runRelease01P5Acceptance(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  // P4 first — immediate predecessor (Land Check discipline).
  const p4 = P5_SEGMENT_ACTAS[3];
  const p4Check = assertActaCertified(cwd, p4.rel, p4.label);
  if (!p4Check.ok) {
    return {
      ok: false,
      checks,
      reason:
        p4Check.reason.includes("Missing")
          ? p4Check.reason
          : "RELEASE_01_004_P4_ACTA.md is not CERTIFIED from main — Land Check P4 first.",
    };
  }
  checks.push("release_01_p4_acta_certified");

  for (const seg of P5_SEGMENT_ACTAS) {
    const r = assertActaCertified(cwd, seg.rel, seg.label);
    if (!r.ok) {
      return { ok: false, checks, reason: r.reason };
    }
    checks.push(seg.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["RELEASE_01_P5_STARTED", "RELEASE_01_P5_COMPLETED"],
    source:
      "P1–P4 CERTIFIED · product acceptance (no FLOW-05 · no Capacitor · no Deploy · no functional change)",
  };
}
