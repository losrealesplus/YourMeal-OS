/**
 * OPERATIONAL-007 Phase 1+2 — Billing contracts + Facade integrity.
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

describe("OPERATIONAL-007 Billing Architecture + Facade", () => {
  it("exposes required public contracts under src/billing/contracts/", () => {
    for (const file of REQUIRED_CONTRACTS) {
      expect(existsSync(resolve(CONTRACTS, file)), file).toBe(true);
    }
  });

  it("Facade package exposes BillingFacade + useBilling + commands/queries", () => {
    const files = readdirSync(BILLING);
    expect(files).toContain("contracts");
    expect(files).toContain("commands");
    expect(files).toContain("queries");
    expect(files).toContain("BillingFacade.ts");
    expect(files).toContain("useBilling.ts");
    expect(files).toContain("index.ts");

    const index = readFileSync(resolve(BILLING, "index.ts"), "utf8");
    expect(index).toContain("BillingFacade");
    expect(index).toContain("useBilling");
    expect(index).not.toMatch(/createClient|supabase/i);

    const facade = readFileSync(resolve(BILLING, "BillingFacade.ts"), "utf8");
    expect(facade).not.toMatch(/integrations\/supabase/);
    expect(facade).not.toMatch(/from ["']@\/services\//);
  });

  it("ADR-0087/0088 and BILLING docs freeze Outcome role", () => {
    const adr87 = readFileSync(
      resolve(ROOT, "docs/adr/0087-billing-capability.md"),
      "utf8",
    );
    expect(adr87).toContain("Operational Outcome");
    expect(adr87).toContain("OPERATIONAL-ENGINE-001");

    const adr88 = readFileSync(
      resolve(ROOT, "docs/adr/0088-billing-facade.md"),
      "utf8",
    );
    expect(adr88).toContain("BillingFacade");
    expect(adr88).toContain("no inicia");

    const cap = readFileSync(
      resolve(ROOT, "docs/05-architecture/BILLING_CAPABILITY.md"),
      "utf8",
    );
    expect(cap).toContain("Final Capability");

    const facadeDoc = readFileSync(
      resolve(ROOT, "docs/05-architecture/BILLING_FACADE.md"),
      "utf8",
    );
    expect(facadeDoc).toContain("useBilling()");
    expect(facadeDoc).toContain("PrepareBilling");
  });

  it("lifecycle statuses remain frozen on BillingStatus", () => {
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
