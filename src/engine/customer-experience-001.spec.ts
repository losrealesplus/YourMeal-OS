/**
 * CUSTOMER EXPERIENCE 001 · Zero Friction · EXPERIENCE LAW 001
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 001 · Zero Friction TTA", () => {
  it("defines mission KPIs · EXPERIENCE LAW 001 · staff_create path", () => {
    const cx = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_001.md"),
      "utf8",
    );
    const missions = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MISSIONS.md"),
      "utf8",
    );
    const law = readFileSync(
      resolve(ROOT, "docs/adr/0098-experience-law-001.md"),
      "utf8",
    );
    const prompt = readFileSync(
      resolve(ROOT, "docs/00-status/ERA2_EXPERIENCE_PROMPT.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    const commands = readFileSync(
      resolve(ROOT, "src/customer/CustomerCommands.ts"),
      "utf8",
    );
    const facade = readFileSync(
      resolve(ROOT, "src/customer/CustomerFacade.ts"),
      "utf8",
    );

    expect(cx).toContain("Zero Friction Customer Management");
    expect(cx).toContain("Time-to-Create Customer");
    expect(cx).toContain("30 seconds");
    expect(cx).toContain("EXPERIENCE LAW 001");
    expect(cx).toContain("EXPERIENCE MANIFESTO 001");
    expect(cx).toContain("Progressive Completion");
    expect(cx).toContain("Operational Time Saved");

    expect(missions).toContain("Time-to-Action");
    expect(missions).toContain("Create an operational commitment");
    expect(missions).toContain("Know what to execute");

    expect(law).toContain("minimum information");
    expect(law).toContain("Accepted");

    expect(prompt).toContain("Mission Success is measured in seconds");
    expect(prompt).toContain("Cognitive load");
    expect(prompt).toContain("EXPERIENCE MANIFESTO 001");

    expect(ui).toContain("Zero Friction Customer Management");
    expect(ui).toContain("staff_create");
    expect(ui).toContain("Nuevo cliente");
    expect(ui).toContain("Particular");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);

    expect(commands).toContain('mode: "staff_create"');
    expect(facade).toContain("createIndividualStaff");
  });
});
