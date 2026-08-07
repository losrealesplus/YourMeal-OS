/**
 * CX002 — Zero Friction Customer Search (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  customerTypeLabel,
  rankSearchHits,
} from "@/customer-experience/search-rank";
import type { CustomerSummary } from "@/customer/CustomerContext";

const ROOT = process.cwd();

function summary(
  partial: Partial<CustomerSummary> & Pick<CustomerSummary, "id" | "displayName">,
): CustomerSummary {
  return {
    partyKind: "individual",
    status: "active",
    demandChannelDefault: "individual",
    tenantId: "t1",
    tags: [],
    userId: null,
    ...partial,
  };
}

describe("CUSTOMER EXPERIENCE 002 · Zero Friction Search", () => {
  it("documents mission · TTF · OTS · Experience-only · sequence", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_002.md"),
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
    const backlog = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_TIME_SAVINGS_BACKLOG.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Customer Search");
    expect(doc).toContain("Time-to-Find Customer (TTF) < 10 seconds");
    expect(doc).toContain("Operational Time Saved");
    expect(doc).toContain("10–35 s");
    expect(doc).toContain("No Facade changes");
    expect(doc).toContain("ACCELERATOR-001");
    expect(doc).toContain("Operational Command Center");
    expect(doc).toContain("Recientes");

    expect(cards).toContain("Phase");
    expect(cards).toContain("003 Edit");
    expect(cards).toContain("Time-to-Edit Customer <20 s");
    expect(cards).toContain("In Progress · Phase 003");

    expect(missions).toContain("CUSTOMER_EXPERIENCE_003");
    expect(missions).toContain("003 Edit");
    expect(missions).toContain("editar frecuente < 20s");

    expect(backlog).toContain("Operational Command Center");
    expect(backlog).toContain("ACCELERATOR-001");

    expect(ui).toContain("CUSTOMER EXPERIENCE 003");
    expect(ui).toContain("Zero Friction Customer Edit");
    expect(ui).toContain("sin botón");
    expect(ui).toContain("No se encontró el cliente");
    expect(ui).toContain("Crear cliente");
    expect(ui).toContain("rankSearchHits");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(ui).not.toMatch(/from ["']@\/customer\/CustomerFacade/);
  });

  it("ranks exact and phone-fragment hits above weak matches", () => {
    const hits = [
      {
        summary: summary({ id: "1", displayName: "Empresa Juan" }),
        phone: null,
      },
      {
        summary: summary({ id: "2", displayName: "Juan Pérez" }),
        phone: "+34622111222",
      },
      {
        summary: summary({ id: "3", displayName: "María" }),
        phone: "622999",
      },
    ];
    const byName = rankSearchHits(hits, "Juan Pérez");
    expect(byName[0]?.summary.id).toBe("2");

    const byPhone = rankSearchHits(hits, "622111");
    expect(byPhone[0]?.summary.id).toBe("2");

    expect(customerTypeLabel(summary({ id: "e", displayName: "X", tags: ["company_employee"] }))).toBe(
      "Empleado",
    );
  });
});
