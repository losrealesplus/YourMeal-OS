import { describe, expect, it } from "vitest";
import type { AppRole } from "@/hooks/use-auth";
import { departmentsForRoles } from "@/lib/operations-departments";
import { PILOT_ADMIN_MODULE_FLAGS } from "@/lib/pilot-feature-flags";

describe("operations departments (RBAC + flags)", () => {
  it("hides inventory and finance when module flags are off", () => {
    const roles: AppRole[] = ["company_admin"];
    const ids = departmentsForRoles(roles, {}).map((d) => d.id);
    expect(ids).not.toContain("stock");
    expect(ids).not.toContain("finance");
    expect(ids).toContain("kitchen");
    expect(ids).toContain("delivery");
    expect(ids).toContain("audit");
    expect(ids).toContain("settings");
  });

  it("shows finance only when accounting flag is enabled", () => {
    const ids = departmentsForRoles(["company_admin"], {
      [PILOT_ADMIN_MODULE_FLAGS.accounting]: true,
    }).map((d) => d.id);
    expect(ids).toContain("finance");
  });

  it("kitchen-only staff sees kitchen (and dashboard), not delivery", () => {
    const ids = departmentsForRoles(["kitchen"], {}).map((d) => d.id);
    expect(ids).toEqual(["dashboard", "kitchen"]);
  });

  it("support sees customers and support, not kitchen", () => {
    const ids = departmentsForRoles(["support"], {}).map((d) => d.id);
    expect(ids).toContain("customers");
    expect(ids).toContain("support");
    expect(ids).not.toContain("kitchen");
    expect(ids).not.toContain("audit");
  });
});
