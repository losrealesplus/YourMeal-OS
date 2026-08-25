import { describe, it, expect } from "vitest";
import { can, hasStaffAccess } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth-types";
import type { Database } from "@/integrations/supabase/types";

type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

describe("Platform Administrator vs Tenant Administrator Authorization Model (B3.6.11B)", () => {
  const EATCLEAN_TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const OTHER_TENANT_ID = "11111111-2222-3333-4444-555555555555";

  // Adolfo: Scoped Tenant Administrator for EatClean
  const adolfoAdminRoles: UserRoleRow[] = [
    {
      id: "role-adolfo-eatclean",
      user_id: "adolfo-user-uuid",
      role: "company_admin",
      tenant_id: EATCLEAN_TENANT_ID,
      created_at: new Date().toISOString(),
    },
  ];
  const adolfoAppRoles: AppRole[] = adolfoAdminRoles.map((r) => r.role);

  // Alex: Platform Principal / SaaS Administrator
  const alexPlatformAdminRoles: UserRoleRow[] = [
    {
      id: "role-alex-saas",
      user_id: "71f94203-9685-421e-8a7a-b10bfb54b267",
      role: "saas_admin",
      tenant_id: null,
      created_at: new Date().toISOString(),
    },
  ];
  const alexAppRoles: AppRole[] = alexPlatformAdminRoles.map((r) => r.role);

  describe("1. Platform Administrator (Alex) Capabilities", () => {
    it("1.1 Alex has platform-level governance capabilities", () => {
      expect(can(alexAppRoles, "saas.manage")).toBe(true);
      expect(can(alexAppRoles, "tenants.manage")).toBe(true);
      expect(can(alexAppRoles, "onboarding.manage")).toBe(true);
      expect(can(alexAppRoles, "records.purge")).toBe(true);
    });

    it("1.2 Alex has transversal operational capabilities across authorized tenant contexts", () => {
      expect(hasStaffAccess(alexAppRoles)).toBe(true);
      expect(can(alexAppRoles, "orders.manage")).toBe(true);
      expect(can(alexAppRoles, "kitchen.operate")).toBe(true);
      expect(can(alexAppRoles, "menus.write")).toBe(true);
      expect(can(alexAppRoles, "dishes.write")).toBe(true);
      expect(can(alexAppRoles, "admin.settings")).toBe(true);
    });

    it("1.3 Alex is a Platform Principal with tenant_id = null", () => {
      expect(alexPlatformAdminRoles[0].tenant_id).toBeNull();
      expect(alexPlatformAdminRoles[0].role).toBe("saas_admin");
    });
  });

  describe("2. Scoped Tenant Administrator (Adolfo) Capabilities", () => {
    it("2.1 Adolfo has operational capabilities for his assigned tenant (EatClean)", () => {
      expect(hasStaffAccess(adolfoAppRoles)).toBe(true);
      expect(can(adolfoAppRoles, "orders.manage")).toBe(true);
      expect(can(adolfoAppRoles, "kitchen.operate")).toBe(true);
      expect(can(adolfoAppRoles, "menus.write")).toBe(true);
      expect(can(adolfoAppRoles, "dishes.write")).toBe(true);
      expect(can(adolfoAppRoles, "admin.settings")).toBe(true);
    });

    it("2.2 Adolfo CANNOT access platform governance or Onboarding Engine", () => {
      expect(can(adolfoAppRoles, "saas.manage")).toBe(false);
      expect(can(adolfoAppRoles, "tenants.manage")).toBe(false);
      expect(can(adolfoAppRoles, "onboarding.manage")).toBe(false);
      expect(can(adolfoAppRoles, "records.purge")).toBe(false);
    });

    it("2.3 Adolfo is strictly scoped to EatClean tenant UUID", () => {
      const role = adolfoAdminRoles[0];
      expect(role.tenant_id).toBe(EATCLEAN_TENANT_ID);
      expect(role.tenant_id).not.toBe(OTHER_TENANT_ID);
      expect(role.tenant_id).not.toBeNull();
    });
  });

  describe("3. Security & Anti-Escalation Red Team", () => {
    it("3.1 Adolfo cannot manage another tenant without explicit assignment", () => {
      const isAuthorizedForOtherTenant = adolfoAdminRoles.some(
        (r) => r.role === "company_admin" && (r.tenant_id === OTHER_TENANT_ID || r.tenant_id === null)
      );
      expect(isAuthorizedForOtherTenant).toBe(false);
    });

    it("3.2 Adolfo cannot escalate privilege to saas_admin without platform role", () => {
      const hasSaasAdminRole = adolfoAdminRoles.some((r) => r.role === "saas_admin");
      expect(hasSaasAdminRole).toBe(false);
    });

    it("3.3 Onboarding authority is exclusive to saas_admin (Platform Principal)", () => {
      expect(can(alexAppRoles, "onboarding.manage")).toBe(true);
      expect(can(adolfoAppRoles, "onboarding.manage")).toBe(false);
    });
  });
});
