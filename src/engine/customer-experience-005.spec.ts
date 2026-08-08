/**
 * CX005 — Zero Friction Customer Growth (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  livingProfileCompleteness,
  saveLivingProfileSection,
  getLivingProfile,
} from "@/customer-experience/living-profile";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 005 · Zero Friction Customer Growth", () => {
  it("documents Living Profile · KPIs · Review gate · Experience-only", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_005.md"),
      "utf8",
    );
    const review = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_REVIEW.md"),
      "utf8",
    );
    const cards = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_CARDS.md"),
      "utf8",
    );
    const missions = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MISSIONS.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/customer-experience/ProfileGrowthPanel.tsx"),
      "utf8",
    );
    const edit = readFileSync(
      resolve(ROOT, "src/customer-experience/CustomerEditPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Customer Growth");
    expect(doc).toContain("Living Customer Profile");
    expect(doc).toContain("grow with the relationship");
    expect(doc).toContain("Time-to-Complete Frequent Customer Information < 30 seconds");
    expect(doc).toContain("30–90 s");
    expect(doc).toContain("Experience Review");
    expect(doc).toContain("COMPLETE");
    expect(doc).toContain("ACCELERATOR-002");
    expect(doc).toContain("No Capability / Facade / Engine changes");

    expect(review).toContain("READY WITH IMPROVEMENTS");
    expect(review).toContain("ACCELERATOR-002");
    expect(review).toContain("ORDER EXPERIENCE");

    expect(cards).toContain("005 Growth");
    expect(cards).toContain("Frozen · READY WITH IMPROVEMENTS");
    expect(cards).toContain("ORDER EXPERIENCE");

    expect(missions).toContain("CUSTOMER_EXPERIENCE_005");
    expect(missions).toContain("Frozen");
    expect(missions).toContain("Order Experience");
    expect(missions).toContain("CUSTOMER_EXPERIENCE_REVIEW");
    expect(missions).toContain("ACCELERATOR-002");

    expect(ui).toContain("CUSTOMER EXPERIENCE 005");
    expect(ui).toContain("Zero Friction Customer Growth");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(ui).not.toMatch(/from ["']@\/customer\/CustomerFacade/);

    expect(panel).toContain("Living Customer Profile");
    expect(panel).toContain("crecimiento");
    expect(panel).toContain("cuando haga falta");
    expect(edit).toContain("ProfileGrowthPanel");
  });

  it("tracks living profile completeness without punishing empty", () => {
    const ref = { kind: "individual" as const, id: "growth-1" };
    expect(livingProfileCompleteness(null).percent).toBe(0);
    saveLivingProfileSection(ref, "preferences", "sin cebolla");
    const g = getLivingProfile(ref);
    expect(g?.preferences).toBe("sin cebolla");
    expect(livingProfileCompleteness(g).filled).toBe(1);
    expect(livingProfileCompleteness(g).percent).toBeGreaterThan(0);
  });
});
