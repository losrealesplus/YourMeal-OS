/**
 * CUSTOMER EXPERIENCE 001 + TENANT SUCCESS LAW 001-A integrity.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("CUSTOMER EXPERIENCE 001 · LAW 001-A", () => {
  it("defers Isabella observation and opens Customer Experience with <30s metric", () => {
    const cx = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_001.md"),
      "utf8",
    );
    const law = readFileSync(
      resolve(ROOT, "docs/adr/0096-tenant-success-law-001a.md"),
      "utf8",
    );
    const sprint = readFileSync(
      resolve(ROOT, "docs/00-status/SPRINT_001_TENANT_SUCCESS.md"),
      "utf8",
    );
    const framework = readFileSync(
      resolve(ROOT, "docs/tenant-success/OBSERVATION_FRAMEWORK.md"),
      "utf8",
    );
    const playbook = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_SUCCESS_PLAYBOOK.md"),
      "utf8",
    );
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );

    expect(cx).toContain("CUSTOMER EXPERIENCE 001");
    expect(cx).toContain("30 segundos");
    expect(cx).toContain("Experience Sprint");
    expect(cx).toContain("not** Observation Sprint");
    expect(cx).toContain("under 30 seconds");

    expect(law).toContain("Never observe unfinished workflows");
    expect(law).toContain("Accepted");
    expect(law).toContain("001-A");

    expect(sprint).toContain("Experience Sprint = build");
    expect(sprint).toContain("Observation Sprint = learn");
    expect(sprint).toContain("Never mixed");
    expect(sprint).toContain("Isabella Observation");
    expect(sprint).toContain("Internal Dogfooding");

    expect(framework).toContain("LAW 001-A");
    expect(framework).toContain("CUSTOMER_EXPERIENCE_001");
    expect(playbook).toContain("TENANT SUCCESS LAW 001-A");

    expect(ui).toContain("30 segundos");
    expect(ui).toContain("CUSTOMER EXPERIENCE 001");
    expect(ui).toContain("from \"@/customer/useCustomer\"");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
  });
});
