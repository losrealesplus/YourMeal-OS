/**
 * OPERATIONAL-007 Phase 1 — Billing Architecture Freeze integrity.
 * Contracts only. No Facade / Commands / Queries / Services / UI.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const BILLING = resolve(ROOT, "src/billing");
const CONTRACTS = resolve(BILLING, "contracts");

const REQUIRED_CONTRACTS = [
  "BillingContext.ts",
  "BillingSummary.ts",
  "BillingStatus.ts",
  "BillingDocument.ts",
  "InvoiceReference.ts",
  "PaymentStatus.ts",
  "BillingResult.ts",
] as const;

describe("OPERATIONAL-007 Billing Architecture Freeze", () => {
  it("exposes required public contracts under src/billing/contracts/", () => {
    for (const file of REQUIRED_CONTRACTS) {
      expect(existsSync(resolve(CONTRACTS, file)), file).toBe(true);
    }
  });

  it("barrel exports types only — no Facade / Services / Commands / Queries yet", () => {
    const files = readdirSync(BILLING);
    expect(files).toContain("contracts");
    expect(files).toContain("index.ts");
    expect(files).not.toContain("BillingFacade.ts");
    expect(files).not.toContain("BillingCommands.ts");
    expect(files).not.toContain("BillingQueries.ts");
    expect(files).not.toContain("useBilling.ts");

    const index = readFileSync(resolve(BILLING, "index.ts"), "utf8");
    expect(index).toContain("contracts/BillingContext");
    expect(index).not.toMatch(/BillingFacade|useBilling|createClient|supabase/i);
  });

  it("ADR-0087 and BILLING_CAPABILITY freeze Outcome question + Engine-closing role", () => {
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0087-billing-capability.md"),
      "utf8",
    );
    expect(adr).toContain("Operational Outcome");
    expect(adr).toContain("financial outcome");
    expect(adr).toContain("OPERATIONAL-ENGINE-001");

    const cap = readFileSync(
      resolve(ROOT, "docs/05-architecture/BILLING_CAPABILITY.md"),
      "utf8",
    );
    expect(cap).toContain("Final Capability");
    expect(cap).toContain("Architecture Freeze");
    expect(cap).toContain("Billing never creates demand");
    expect(cap).toContain("OPERATIONAL-ENGINE-001");
    expect(cap).not.toMatch(/Facade implemented|useBilling\(\)/);
  });

  it("lifecycle statuses are frozen on BillingStatus", () => {
    const src = readFileSync(resolve(CONTRACTS, "BillingStatus.ts"), "utf8");
    for (const status of [
      "Pending",
      "ReadyToBill",
      "Invoiced",
      "PartiallyPaid",
      "Paid",
      "Cancelled",
    ]) {
      expect(src).toContain(`"${status}"`);
    }
  });
});
