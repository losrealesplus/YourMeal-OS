/**
 * FLOW-05 · B2 Authentication.
 *
 * Certifies SaaS authentication handoff exists and integrates:
 *   Ready for Auth → credentials → identity → tenant → RBAC → session
 *   → Ready for Order Creation
 *
 * Requires B1 CERTIFIED + Gate authorizing FLOW05-002.
 * Does NOT open B3 (Order Creation). No dashboard as END.
 * Presence/integration only — not UX polish, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B2_PRECONDITIONS = Object.freeze([
  "flow_05_b1_certified",
  "flow_05_gate_authorizes_002",
  "login_entry_present",
  "credentials_validation_present",
  "identity_session_bootstrap_present",
  "tenant_resolution_present",
  "rbac_resolution_present",
  "session_availability_present",
  "ready_for_order_creation_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B2_ANCHORS = Object.freeze([
  {
    id: "login_entry_present",
    rel: "src/routes/auth.tsx",
    label: "Login entry (public /auth signin)",
    needle: /\bsignInWithPassword\b/,
  },
  {
    id: "credentials_validation_present",
    rel: "src/auth/credentials.ts",
    label: "Credentials validation (signInWithPassword)",
    needle: /\bsignInWithPassword\b/,
  },
  {
    id: "identity_session_bootstrap_present",
    rel: "src/auth/post-login-pipeline.ts",
    label: "Identity/session bootstrap (canonical session)",
    needle: /\bhasCanonicalSession\b|\bCANONICAL_SESSION\b/,
  },
  {
    id: "tenant_resolution_present",
    rel: "src/identity/supabase-identity-provider.tsx",
    label: "Tenant resolution (tenant_members)",
    needle: /\btenant_members\b/,
  },
  {
    id: "rbac_resolution_present",
    rel: "src/permissions/route-guards.ts",
    label: "RBAC resolution (requireAuthRoles)",
    needle: /\brequireAuthRoles\b/,
  },
  {
    id: "session_availability_present",
    rel: "src/routes/_authenticated/route.tsx",
    label: "Session availability (authenticated layout gate)",
    needle: /\brequireAuthenticatedUser\b/,
  },
  {
    id: "ready_for_order_creation_present",
    rel: "src/lib/home-path.ts",
    label: "Ready for Order Creation (customer → /app for B3)",
    needle: /return "\/app"/,
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
 * }} B2Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B2Result}
 */
export function runFlow05B2Authentication(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b1Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_001_B1_ACTA.md",
  );
  if (!fs.existsSync(b1Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_001_B1_ACTA.md — B2 requires B1 Registration CERTIFIED.",
    };
  }
  checks.push("flow_05_b1_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B2 requires Gate authorizing FLOW05-002.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-002/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-002 — Land Check B1 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_002");

  for (const anchor of B2_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B2 requires ${anchor.label}.`,
          "FLOW05-002 certifies Authentication only (Ready for Order Creation · no B3).",
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
    mapped_tokens: ["FLOW05_B2_STARTED", "FLOW05_B2_COMPLETED"],
    source:
      "Login · credentials · identity/session · tenant · RBAC · session gate · ready for order · B1 CERTIFIED (no B3+ · no dashboard END · no Capacitor)",
  };
}
