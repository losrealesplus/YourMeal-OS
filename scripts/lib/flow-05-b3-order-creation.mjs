/**
 * FLOW-05 · B3 Order Creation.
 *
 * Certifies SaaS order-creation state transition exists and integrates:
 *   Ready for Order Creation → menu → products → address/slot → validate
 *   → persist → customer · tenant · initial status → Ready for Production
 *
 * Requires B2 CERTIFIED + Gate authorizing FLOW05-003.
 * Does NOT open B4 (Production). No kitchen/routes/stock/billing.
 * Presence/integration only — state transition, not UX polish, not EatClean-only.
 */
import fs from "node:fs";
import path from "node:path";

export const FLOW05_B3_PRECONDITIONS = Object.freeze([
  "flow_05_b2_certified",
  "flow_05_gate_authorizes_003",
  "order_creation_entry_present",
  "weekly_menu_selection_present",
  "order_intake_present",
  "order_validation_present",
  "order_persist_present",
  "customer_tenant_status_present",
  "ready_for_production_present",
]);

/** @type {ReadonlyArray<{ id: string, rel: string, label: string, needle?: RegExp }>} */
const B3_ANCHORS = Object.freeze([
  {
    id: "order_creation_entry_present",
    rel: "src/routes/_authenticated/app.schedule.tsx",
    label:
      "Order creation entry (schedule · menu · day · dishes · address)",
    needle: /useProgramDraftOrder|useWeeklyMenu|deliveryDay|deliveryAddress/,
  },
  {
    id: "weekly_menu_selection_present",
    rel: "src/modules/weekly-menu/infrastructure/weekly-menu-repository.ts",
    label: "Select current/weekly published menu",
    needle: /findPublishedByWeekStart/,
  },
  {
    id: "order_intake_present",
    rel: "src/modules/order-intake/application/order-intake-service.ts",
    label: "Order Intake (products/dishes → draft builder)",
    needle: /\bintakeDraft\b/,
  },
  {
    id: "order_validation_present",
    rel: "src/modules/orders/application/order-service.ts",
    label: "Order validation · customer association",
    needle: /findPublishedByWeekStart|insertDraft|findCustomerIdForUser/,
  },
  {
    id: "order_persist_present",
    rel: "src/modules/orders/infrastructure/order-repository.ts",
    label: "Order persisted (insertDraft · tenant scoped)",
    needle: /\binsertDraft\b|_tenant_id/,
  },
  {
    id: "customer_tenant_status_present",
    rel: "supabase/migrations/20260723120000_program_draft_order_atomic.sql",
    label: "customer_id · tenant_id · initial status draft",
    needle: /_customer_id|_tenant_id|'draft'/,
  },
  {
    id: "ready_for_production_present",
    rel: "src/hooks/use-confirm-order.ts",
    label: "Ready for Production (confirm Draft → Confirmed for B4)",
    needle: /useConfirmOrder|OrderService\.confirm/,
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
 * }} B3Result
 */

/**
 * @param {{ cwd?: string }} [opts]
 * @returns {B3Result}
 */
export function runFlow05B3OrderCreation(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  /** @type {string[]} */
  const checks = [];

  const b2Acta = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW05_002_B2_ACTA.md",
  );
  if (!fs.existsSync(b2Acta)) {
    return {
      ok: false,
      checks,
      reason:
        "Missing FLOW05_002_B2_ACTA.md — B3 requires B2 Authentication CERTIFIED.",
    };
  }
  checks.push("flow_05_b2_certified");

  const gatePath = path.join(
    cwd,
    "docs/10-validation/flow-05/FLOW_05_GATE.md",
  );
  if (!fs.existsSync(gatePath)) {
    return {
      ok: false,
      checks,
      reason: "Missing FLOW_05_GATE.md — B3 requires Gate authorizing FLOW05-003.",
    };
  }
  const gateText = fs.readFileSync(gatePath, "utf8");
  if (!/READY/i.test(gateText) || !/FLOW05-003/i.test(gateText)) {
    return {
      ok: false,
      checks,
      reason:
        "FLOW_05_GATE.md does not authorize FLOW05-003 — Land Check B2 first.",
    };
  }
  checks.push("flow_05_gate_authorizes_003");

  for (const anchor of B3_ANCHORS) {
    const p = path.join(cwd, anchor.rel);
    if (!fs.existsSync(p)) {
      return {
        ok: false,
        checks,
        reason: [
          `Missing ${anchor.rel} — B3 requires ${anchor.label}.`,
          "FLOW05-003 certifies Order Creation only (Ready for Production · no B4).",
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
    mapped_tokens: ["FLOW05_B3_STARTED", "FLOW05_B3_COMPLETED"],
    source:
      "Schedule · weekly menu · intake · validate · persist · customer/tenant/draft · ready for production · B2 CERTIFIED (no B4+ · no kitchen · no Capacitor)",
  };
}
