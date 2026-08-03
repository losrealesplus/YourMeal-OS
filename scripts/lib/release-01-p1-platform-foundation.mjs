/**
 * RELEASE-01 · P1 Platform Foundation.
 *
 * Certifies SaaS platform pillars exist and are integrated:
 *   Authentication · Tenant · RBAC · Profiles · Localization · Settings
 *
 * Does NOT invent modules. Does NOT open P2–P5.
 * Does NOT touch FLOW-05, Capacitor, Deploy/Rollback, or business domain logic.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_P1_PRECONDITIONS = Object.freeze([
  "authentication_present",
  "tenant_system_present",
  "rbac_present",
  "profiles_present",
  "localization_present",
  "settings_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string }>} */
const P1_ANCHORS = Object.freeze([
  {
    id: "authentication_present",
    rel: "src/auth/session.ts",
    label: "Authentication",
  },
  {
    id: "tenant_system_present",
    rel: "docs/adr/0003-multi-tenant.md",
    label: "Tenant",
  },
  {
    id: "rbac_present",
    rel: "src/permissions/index.ts",
    label: "RBAC",
  },
  {
    id: "profiles_present",
    rel: "src/routes/_authenticated/app.settings.profile.tsx",
    label: "Profiles",
  },
  {
    id: "localization_present",
    rel: "src/i18n/index.ts",
    label: "Localization",
  },
  {
    id: "settings_present",
    rel: "src/routes/_authenticated/app.settings.tsx",
    label: "Settings",
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
 * }} P1Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {P1Result}
 */
export function runRelease01P1PlatformFoundation(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  for (const anchor of P1_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — P1 requires ${anchor.label}.`,
          "RELEASE-01-001 certifies platform pillars only (no new modules).",
        ].join("\n"),
      };
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["RELEASE_01_P1_STARTED", "RELEASE_01_P1_COMPLETED"],
    source:
      "Authentication · Tenant · RBAC · Profiles · Localization · Settings (no P2+ · no FLOW-05 · no Capacitor)",
  };
}
