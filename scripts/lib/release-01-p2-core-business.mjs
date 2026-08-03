/**
 * RELEASE-01 · P2 Core Business Modules.
 *
 * Certifies SaaS core business modules exist and are integrated:
 *   Dish Library · Ingredients · Recipes · Customers · Orders
 *
 * Requires P1 CERTIFIED from main. Does NOT open P3–P5.
 * Does NOT validate operations / production / deliveries / inventory.
 */
import fs from "node:fs";
import path from "node:path";

export const RELEASE_01_P2_PRECONDITIONS = Object.freeze([
  "release_01_p1_acta_certified",
  "dish_library_present",
  "ingredients_present",
  "recipes_present",
  "customers_present",
  "orders_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string }>} */
const P2_MODULE_ANCHORS = Object.freeze([
  {
    id: "dish_library_present",
    rel: "src/modules/dish-library/domain/entities/dish.ts",
    label: "Dish Library",
  },
  {
    id: "ingredients_present",
    rel: "docs/12-domain-model/module-01/Ingredient.md",
    label: "Ingredients",
  },
  {
    id: "recipes_present",
    rel: "docs/12-domain-model/module-01/Recipe.md",
    label: "Recipes",
  },
  {
    id: "customers_present",
    rel: "src/modules/customer-directory/application/customer-directory-service.ts",
    label: "Customers",
  },
  {
    id: "orders_present",
    rel: "src/modules/orders/application/order-service.ts",
    label: "Orders",
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
 * }} P2Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {P2Result}
 */
export function runRelease01P2CoreBusiness(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const p1Acta = path.join(
    cwd,
    "docs/10-validation/release-01/RELEASE_01_001_P1_ACTA.md",
  );
  if (!fs.existsSync(p1Acta)) {
    return {
      ok: false,
      checks,
      reason: "Missing RELEASE_01_001_P1_ACTA.md — P2 requires P1 CERTIFIED.",
    };
  }
  if (!/CERTIFIED desde `main`/i.test(fs.readFileSync(p1Acta, "utf8"))) {
    return {
      ok: false,
      checks,
      reason:
        "RELEASE_01_001_P1_ACTA.md is not CERTIFIED from main — Land Check P1 first.",
    };
  }
  checks.push("release_01_p1_acta_certified");

  for (const anchor of P2_MODULE_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — P2 requires ${anchor.label}.`,
          "RELEASE-01-002 certifies core business modules only (no operations).",
        ].join("\n"),
      };
    }
    checks.push(anchor.id);
  }

  return {
    ok: true,
    checks,
    mapped_tokens: ["RELEASE_01_P2_STARTED", "RELEASE_01_P2_COMPLETED"],
    source:
      "Dish Library · Ingredients · Recipes · Customers · Orders · P1 CERTIFIED (no P3+ · no ops · no FLOW-05)",
  };
}
