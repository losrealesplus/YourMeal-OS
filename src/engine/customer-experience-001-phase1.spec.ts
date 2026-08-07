/**
 * CX001 Phase 1 — Experience only (no Facade / Capability diffs).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 001 · Phase 1", () => {
  it("documents Experience Card · OTS · and Experience-only surface", () => {
    const phase = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_001_PHASE1.md"),
      "utf8",
    );
    const cards = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_CARDS.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );

    expect(phase).toContain("Phase 1");
    expect(phase).toContain("Operational Time Saved");
    expect(phase).toContain("Do **not** modify Customer Facade");
    expect(phase).toContain("60–150 s");

    expect(cards).toContain("EXPERIENCE CARD");
    expect(cards).toContain("Zero Friction Customer Management");
    expect(cards).toContain("Order Experience");
    expect(cards).toContain("Kitchen Experience");
    expect(cards).toContain("In Progress · Phase 1");

    expect(ui).toContain("Phase 1");
    expect(ui).toContain("Crear pedido");
    expect(ui).toContain("Llamar");
    expect(ui).toContain("¿Qué tipo de cliente vas a crear?");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
  });

  it("Experience surface stays Facade-only (LAW 003)", () => {
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(ui).not.toMatch(/from ["']@\/modules\/company-account/);
    expect(ui).not.toMatch(/from ["']@\/customer\/CustomerFacade/);
  });
});
