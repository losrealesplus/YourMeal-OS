/**
 * CX004 — Zero Friction Organization Management (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addWorkerToOrganization,
  ensureOrganizationRoster,
} from "@/customer-experience/organization-roster";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 004 · Zero Friction Organization", () => {
  it("documents TTO · Organization language · OTS · Experience-only · templates reserved", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_004.md"),
      "utf8",
    );
    const cards = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_CARDS.md"),
      "utf8",
    );
    const accelerators = readFileSync(
      resolve(ROOT, "docs/00-status/OPERATIONAL_ACCELERATORS.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/customer-experience/OrganizationPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Organization Management");
    expect(doc).toContain("Time-to-Organization (TTO) < 45 seconds");
    expect(doc).toContain("Time-to-Add Worker < 15 seconds");
    expect(doc).toContain("45–135 s");
    expect(doc).toContain("No Capability / Facade / Engine changes");
    expect(doc).toContain("Organization Templates");
    expect(doc).toContain("Organización → Trabajadores → Pedidos");
    expect(doc).toContain("COMPLETE");

    expect(cards).toContain("004 Organization");
    expect(cards).toContain("Time-to-Organization <45 s");
    expect(cards).toContain("005 Growth");

    expect(accelerators).toContain("Organization Templates");

    expect(ui).toContain("Nueva organización");
    expect(ui).toContain("OrganizationPanel");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(ui).not.toMatch(/from ["']@\/customer\/CustomerFacade/);

    expect(panel).toContain("Nueva organización");
    expect(panel).toContain("Añadir trabajador");
    expect(panel).toContain("provision");
    expect(panel).toContain("staff_create");
    expect(panel).toContain("addWorkerToOrganization");
  });

  it("keeps organization roster in Experience layer", () => {
    const roster = ensureOrganizationRoster({
      organizationId: "org-1",
      organizationName: "EatClean Adeje",
    });
    expect(roster.workers).toHaveLength(0);
    const withWorker = addWorkerToOrganization({
      organizationId: "org-1",
      organizationName: "EatClean Adeje",
      partyId: "w1",
      displayName: "María",
      phone: "622",
    });
    expect(withWorker.workers[0]?.displayName).toBe("María");
  });
});
