/**
 * CX001 Phase 1 — Experience only (no Facade / Capability diffs).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CUSTOMER_CREATION_ORIGINS,
  CUSTOMER_CREATION_ORIGIN_LABEL,
  recordCustomerCreationOrigin,
} from "@/customer-experience/creation-origin";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 001 · Phase 1", () => {
  it("documents Experience Card Operational KPIs · NBA · origin · OTS", () => {
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
    expect(phase).toContain("Next Best Action");
    expect(phase).toContain("Creation origin");
    expect(phase).toContain("CUSTOMER EXPERIENCE 002");

    expect(cards).toContain("Primary KPI");
    expect(cards).toContain("Secondary KPIs");
    expect(cards).toContain("Time-to-Create Customer <30 s");
    expect(cards).toContain("Time-to-Find Customer <10 s");
    expect(cards).toContain("Time-to-Resume Operation <5 s");
    expect(cards).toContain("Time-to-Edit Customer <20 s");
    expect(cards).toContain("Operational Time Saved");
    expect(cards).toContain("003 Edit");
    expect(cards).toContain("In Progress · Phase 003");

    expect(ui).toContain("Phase 003");
    expect(ui).toContain("Cliente creado");
    expect(ui).toContain("¿Qué quieres hacer ahora?");
    expect(ui).toContain("Crear pedido");
    expect(ui).toContain("Abrir cliente");
    expect(ui).toContain("Crear otro cliente");
    expect(ui).toContain("recordCustomerCreationOrigin");
    expect(ui).toContain("customer_workspace");
    expect(ui).toContain("staff_create");
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

  it("creation origin registry is silent and workspace-ready", () => {
    expect(CUSTOMER_CREATION_ORIGINS).toContain("customer_workspace");
    expect(CUSTOMER_CREATION_ORIGINS).toContain("quick_capture");
    expect(CUSTOMER_CREATION_ORIGIN_LABEL.customer_workspace).toBe(
      "Customer Workspace",
    );
    const event = recordCustomerCreationOrigin({
      origin: "customer_workspace",
      partyKind: "individual",
      partyId: "test-party",
    });
    expect(event.origin).toBe("customer_workspace");
    expect(event.partyId).toBe("test-party");
  });
});
