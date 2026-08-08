/**
 * CX003 — Zero Friction Customer Edit (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyOperationalCorrection,
  saveOperationalCorrection,
} from "@/customer-experience/operational-corrections";
import type { CustomerContext } from "@/customer/CustomerContext";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 003 · Zero Friction Edit", () => {
  it("documents TTE · OTS · Experience-only · sequence · OCC still Reserved", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_003.md"),
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
      resolve(ROOT, "src/customer-experience/CustomerEditPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Customer Edit");
    expect(doc).toContain("Time-to-Edit Customer (TTE) < 20 seconds");
    expect(doc).toContain("Time-to-Resume Operation < 5 seconds");
    expect(doc).toContain("25–70 s");
    expect(doc).toContain("No Facade changes");
    expect(doc).toContain("UNIMPLEMENTED");
    expect(doc).toContain("operational corrections");

    expect(cards).toContain("005 Growth");
    expect(cards).toContain("Time-to-Complete Frequent Customer Information <30 s");
    expect(cards).toContain("Frozen · READY WITH IMPROVEMENTS");

    expect(missions).toContain("CUSTOMER_EXPERIENCE_005");
    expect(missions).toContain("Frozen");
    expect(missions).toContain("enriquecer < 30s");

    expect(ui).toContain("CUSTOMER EXPERIENCE 005");
    expect(ui).toContain("Zero Friction Customer Growth");
    expect(ui).toContain("CustomerEditPanel");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(ui).not.toMatch(/from ["']@\/customer\/CustomerFacade/);

    expect(panel).toContain("updateCustomerCommand");
    expect(panel).toContain("saveOperationalCorrection");
    expect(panel).toContain("Información básica");
    expect(panel).toContain("Entrega");
    expect(panel).toContain("Notas operativas");
    expect(panel).toContain("Copiar teléfono");
    expect(panel).toContain("cambios sin guardar");
  });

  it("applies session operational corrections without Facade writes", () => {
    const base: CustomerContext = {
      summary: {
        partyKind: "individual",
        id: "c1",
        displayName: "Juan",
        status: "active",
        demandChannelDefault: "individual",
        tenantId: "t1",
        tags: [],
        userId: null,
      },
      profile: {
        id: "c1",
        kind: "individual",
        fullName: "Juan",
        email: null,
        phones: [{ id: "p1", e164: "600111222" }],
        addresses: [],
        allergens: [],
        preferences: {},
        communicationPreferences: { channels: {} },
        status: "active",
        userId: null,
        tenantId: "t1",
        tags: [],
      },
      companyAccountId: null,
      deliveryLocation: null,
      identityUserId: null,
      permissions: {
        canRead: true,
        canWrite: true,
        canSupport: false,
        canSelf: false,
      },
    };

    saveOperationalCorrection(
      { kind: "individual", id: "c1" },
      { displayName: "Juan Pérez", phone: "622000111" },
    );
    const next = applyOperationalCorrection(base);
    expect(next.summary.displayName).toBe("Juan Pérez");
    expect(next.profile?.phones[0]?.e164).toBe("622000111");
  });
});
