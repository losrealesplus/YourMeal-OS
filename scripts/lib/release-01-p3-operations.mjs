/**
 * RELEASE-01 · P3 Operations.
 *
 * Certifies SaaS operational modules exist and are integrated:
 *   Production · Calendar · Routes · Deliveries · Inventory
 *
 * Requires P2 CERTIFIED from main. Does NOT open P4–P5.
 * Does NOT execute production, generate routes, or optimize deliveries.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_P3_PRECONDITIONS = Object.freeze([
  "release_01_p2_acta_certified",
  "production_present",
  "calendar_present",
  "routes_present",
  "deliveries_present",
  "inventory_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string }>} */
const P3_MODULE_ANCHORS = Object.freeze([
  {
    id: "production_present",
    rel: "src/routes/_authenticated/admin.production.tsx",
    label: "Production",
  },
  {
    id: "calendar_present",
    rel: "src/modules/weekly-menu/application/weekly-menu-service.ts",
    label: "Calendar",
  },
  {
    id: "routes_present",
    rel: "src/modules/delivery/application/route-service.ts",
    label: "Routes",
  },
  {
    id: "deliveries_present",
    rel: "src/routes/_authenticated/admin.routes.deliveries.tsx",
    label: "Deliveries",
  },
  {
    id: "inventory_present",
    rel: "src/modules/inventory/application/inventory-service.ts",
    label: "Inventory",
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
 * }} P3Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {P3Result}
 */
export function runRelease01P3Operations(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const p2Acta = path.join(
    cwd,
    "docs/10-validation/release-01/RELEASE_01_002_P2_ACTA.md",
  );
  if (!fs.existsSync(p2Acta)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_002_P2_ACTA.md — P3 requires P2 CERTIFIED.",
    };
  }
  if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(p2Acta, "utf8"))) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_002_P2_ACTA.md is not CERTIFIED from main — Land Check P2 first.",
    };
  }
  checks.push("release_01_p2_acta_certified");

  for (const anchor of P3_MODULE_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — P3 requires ${anchor.label}.`,
          "RELEASE-01-003 certifies operations modules only (no execution).",
        ].join("\n"),
      };
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["RELEASE_01_P3_STARTED", "RELEASE_01_P3_COMPLETED"],
    source:
      "Production · Calendar · Routes · Deliveries · Inventory · P2 CERTIFIED (no P4+ · no exec · no FLOW-05)",
  };
}
