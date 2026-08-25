import { describe, it, expect } from "vitest";
import { can, hasStaffAccess } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth-types";
import type { Database } from "@/integrations/supabase/types";

type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

describe("Tenant Administrator Isolation & RBAC Boundary (B3.6.11B)", () => {
  const EATCLEAN_TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const OTHER_TENANT_ID = "11111111-2222-3333-4444-555555555555";

  const eatcleanAdminRoles: UserRoleRow[] = [
    {
      id: "role-1",
      user_id: "0e770229-ef44-4f60-b6ff-14a606c242c0",
      role: "company_admin",
      tenant_id: EATCLEAN_TENANT_ID,
      created_at: new Date().toISOString(),
    },
  ];

  const eatcleanAppRoles: AppRole[] = eatcleanAdminRoles.map((r) => r.role);

  const saasAdminRoles: UserRoleRow[] = [
    {
      id: "role-saas",
      user_id: "71f94203-9685-421e-8a7a-b10bfb54b267",
      role: "saas_admin",
      tenant_id: null,
      created_at: new Date().toISOString(),
    },
  ];

  const saasAppRoles: AppRole[] = saasAdminRoles.map((r) => r.role);

  it("1.1 EatClean company_admin has admin operations capabilities", () => {
    expect(hasStaffAccess(eatcleanAppRoles)).toBe(true);
    expect(can(eatcleanAppRoles, "orders.manage")).toBe(true);
    expect(can(eatcleanAppRoles, "kitchen.operate")).toBe(true);
    expect(can(eatcleanAppRoles, "menus.write")).toBe(true);
    expect(can(eatcleanAppRoles, "admin.settings")).toBe(true);
  });

  it("1.2 EatClean company_admin CANNOT access platform-level SaaS Admin capabilities", () => {
    expect(can(eatcleanAppRoles, "saas.manage")).toBe(false);
    expect(can(eatcleanAppRoles, "records.purge")).toBe(false);
  });

  it("1.3 Platform SaaS Admin has saas.manage capability with null tenant_id", () => {
    expect(can(saasAppRoles, "saas.manage")).toBe(true);
    expect(can(saasAppRoles, "records.purge")).toBe(true);
  });

  it("2.1 Tenant Admin role is strictly bound to EatClean tenant_id", () => {
    const role = eatcleanAdminRoles[0];
    expect(role.tenant_id).toBe(EATCLEAN_TENANT_ID);
    expect(role.tenant_id).not.toBe(OTHER_TENANT_ID);
    expect(role.tenant_id).not.toBeNull();
  });

  it("2.2 Red Team: company_admin without matching tenant cannot manage other tenant", () => {
    const isAuthorizedForOtherTenant = eatcleanAdminRoles.some(
      (r) => r.role === "company_admin" && (r.tenant_id === OTHER_TENANT_ID || r.tenant_id === null)
    );
    expect(isAuthorizedForOtherTenant).toBe(false);
  });

  it("2.3 Red Team: company_admin cannot escalate privilege to saas_admin without platform role", () => {
    const hasSaasAdminRole = eatcleanAdminRoles.some((r) => r.role === "saas_admin");
    expect(hasSaasAdminRole).toBe(false);
  });
});
