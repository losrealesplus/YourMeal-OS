/**
 * RELEASE-01 · P4 Administration.
 *
 * Certifies SaaS administrative modules exist and are integrated:
 *   Billing · Reports · Notifications · Audit · Configuration
 *
 * Requires P3 CERTIFIED from main. Does NOT open P5.
 * Does NOT implement billing, generate reports, or send notifications.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_P4_PRECONDITIONS = Object.freeze([
  "release_01_p3_acta_certified",
  "billing_present",
  "reports_present",
  "notifications_present",
  "audit_present",
  "configuration_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string }>} */
const P4_MODULE_ANCHORS = Object.freeze([
  {
    id: "billing_present",
    rel: "src/modules/accounting/application/accounting-service.ts",
    label: "Billing",
  },
  {
    id: "reports_present",
    rel: "src/routes/_authenticated/admin.reports.tsx",
    label: "Reports",
  },
  {
    id: "notifications_present",
    rel: "src/routes/_authenticated/app.notifications.tsx",
    label: "Notifications",
  },
  {
    id: "audit_present",
    rel: "src/services/audit-service.ts",
    label: "Audit",
  },
  {
    id: "configuration_present",
    rel: "src/routes/_authenticated/admin.settings.tsx",
    label: "Configuration",
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
 * }} P4Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {P4Result}
 */
export function runRelease01P4Administration(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const p3Acta = path.join(
    cwd,
    "docs/10-validation/release-01/RELEASE_01_003_P3_ACTA.md",
  );
  if (!fs.existsSync(p3Acta)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_003_P3_ACTA.md — P4 requires P3 CERTIFIED.",
    };
  }
  if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(p3Acta, "utf8"))) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_003_P3_ACTA.md is not CERTIFIED from main — Land Check P3 first.",
    };
  }
  checks.push("release_01_p3_acta_certified");

  for (const anchor of P4_MODULE_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — P4 requires ${anchor.label}.`,
          "RELEASE-01-004 certifies administration modules only (no execution).",
        ].join("\n"),
      };
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["RELEASE_01_P4_STARTED", "RELEASE_01_P4_COMPLETED"],
    source:
      "Billing · Reports · Notifications · Audit · Configuration · P3 CERTIFIED (no P5 · no exec · no FLOW-05)",
  };
}
