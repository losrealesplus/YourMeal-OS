/**
 * FLOW-05 · B1 Registration.
 *
 * Certifies SaaS registration handoff exists and integrates:
 *   anonymous → register surface → account → profile → tenant → ready for auth
 *
 * Requires Gate READY. Does NOT open B2 (Authentication / session / login).
 * Presence/integration only — not UX polish, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B1_PRECONDITIONS = Object.freeze([
  "flow_05_gate_ready",
  "registration_entry_present",
  "account_creation_present",
  "profile_bootstrap_present",
  "tenant_association_present",
  "ready_for_authentication_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B1_ANCHORS = Object.freeze([
  {
    id: "registration_entry_present",
    rel: "src/routes/auth.tsx",
    label: "Registration entry (public /auth signup)",
    needle: /\bsignup\b|\bsignUp\b/,
  },
  {
    id: "account_creation_present",
    rel: "src/auth/credentials.ts",
    label: "Account creation (signUp)",
    needle: /\bsignUp\b/,
  },
  {
    id: "profile_bootstrap_present",
    rel: "supabase/migrations/20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql",
    label: "Initial profile bootstrap (handle_new_user)",
    needle: /handle_new_user/,
  },
  {
    id: "tenant_association_present",
    rel: "supabase/migrations/20260723183000_b2b_b2c_customer_model.sql",
    label: "Tenant association (ensure_individual_customer)",
    needle: /ensure_individual_customer/,
  },
  {
    id: "ready_for_authentication_present",
    rel: "src/auth/urls.ts",
    label: "Ready for Authentication (confirm → /auth for B2)",
    needle: /AUTH_LOGIN_PATH|emailConfirmRedirectTo/,
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
 * }} B1Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B1Result}
 */
export function runFlow05B1Registration(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B1 requires Gate READY.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-001/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md is not READY for FLOW05-001 — Land Check Gate first.",
    };
  }
  checks.push("flow_05_gate_ready");

  for (const anchor of B1_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B1 requires ${anchor.label}.`,
          "FLOW05-001 certifies Registration only (Ready for Authentication · no B2 Login).",
        ].join("\n"),
      };
    }
    if (anchor.needle) {
      const text = fs.readFileSync(p, "utf8");
      if (!anchor.needle.test(text)) {
        return {
          ok: false,
          checks,
          reason: `Anchor ${anchor.rel} exists but lacks ${anchor.label} marker.`,
        };
      }
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["FLOW05_B1_STARTED", "FLOW05_B1_COMPLETED"],
    source:
      "Registration entry · account · profile · tenant · ready for auth · Gate READY (no B2+ · no session · no Capacitor)",
  };
}
