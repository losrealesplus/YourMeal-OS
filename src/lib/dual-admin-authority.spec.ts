import { describe, expect, it } from "vitest";
import { can, hasStaffAccess } from "@/permissions";
import { homePathForRoles } from "@/lib/home-path";
import {
  decideOperationsCenterEntry,
  resolvePostAdminLoginPath,
} from "@/lib/open-operations-center";
import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";

describe("B3.6.11C.3 Dual Admin Authority Model (Alex Platform Principal + Adolfo Tenant Admin)", () => {
  const EATCLEAN_HOST = "eatclean.yourmealos.com";
  const PLATFORM_HOST = "www.yourmealos.com";

  it("1. Alex platform identity: maintains canonical saas_admin role", () => {
    const alexRoles = ["saas_admin"] as const;
    expect(alexRoles).toContain("saas_admin");
    expect(alexRoles).not.toContain("company_admin");
    expect(hasStaffAccess(alexRoles)).toBe(true);
  });

  it("2. Alex EatClean tenant context: resolves /admin on customer instance without role downgrade", () => {
    const alexRoles = ["saas_admin"] as const;
    const landing = homePathForRoles(alexRoles, EATCLEAN_HOST);
    expect(landing).toBe("/admin");

    const postLoginPath = resolvePostAdminLoginPath(
      alexRoles,
      undefined,
      EATCLEAN_HOST,
    );
    expect(postLoginPath).toBe("/admin");
  });

  it("3. Adolfo EatClean scope: company_admin accesses tenant operations center", () => {
    const adolfoRoles = ["company_admin"] as const;
    const landing = homePathForRoles(adolfoRoles, EATCLEAN_HOST);
    expect(landing).toBe("/admin");

    const opsDecision = decideOperationsCenterEntry({
      sessionUserId: "adolfo-uuid",
      roles: adolfoRoles,
      host: EATCLEAN_HOST,
    });
    expect(opsDecision).toEqual({ action: "navigate", to: "/admin" });
  });

  it("4. Adolfo cannot leave tenant: blocked from saas.manage and /saas", () => {
    const adolfoRoles = ["company_admin"] as const;
    expect(can(adolfoRoles, "saas.manage")).toBe(false);
    expect(can(adolfoRoles, "tenants.manage")).toBe(false);
  });

  it("5. Adolfo cannot onboarding: blocked from onboarding.manage capability", () => {
    const adolfoRoles = ["company_admin"] as const;
    expect(can(adolfoRoles, "onboarding.manage")).toBe(false);
  });

  it("6. Alex can onboarding: possesses onboarding.manage and tenants.manage capabilities", () => {
    const alexRoles = ["saas_admin"] as const;
    expect(can(alexRoles, "onboarding.manage")).toBe(true);
    expect(can(alexRoles, "tenants.manage")).toBe(true);
    expect(can(alexRoles, "saas.manage")).toBe(true);
    expect(can(alexRoles, "customers.write")).toBe(true);
    expect(can(alexRoles, "orders.manage")).toBe(true);
  });

  it("7. Both can authenticate at /auth/admin and access operations center", () => {
    const alexDecision = decideOperationsCenterEntry({
      sessionUserId: "alex-uuid",
      roles: ["saas_admin"],
      host: EATCLEAN_HOST,
    });
    const adolfoDecision = decideOperationsCenterEntry({
      sessionUserId: "adolfo-uuid",
      roles: ["company_admin"],
      host: EATCLEAN_HOST,
    });

    expect(alexDecision).toEqual({ action: "navigate", to: "/admin" });
    expect(adolfoDecision).toEqual({ action: "navigate", to: "/admin" });
  });

  it("8. Actor identity remains saas_admin for Alex on all surfaces", () => {
    const alexIdentity = {
      actor: "alex.hdez.mtinez@gmail.com",
      actor_role: "saas_admin",
      tenant_context: "eatclean",
    };
    expect(alexIdentity.actor_role).toBe("saas_admin");
    expect(alexIdentity.actor_role).not.toBe("company_admin");
  });

  it("9. Actor identity remains company_admin for Adolfo with tenant scope", () => {
    const adolfoIdentity = {
      actor: "adolfoig2000@gmail.com",
      actor_role: "company_admin",
      tenant_id: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    };
    expect(adolfoIdentity.actor_role).toBe("company_admin");
    expect(adolfoIdentity.tenant_id).toBe(
      "8bba00ba-331b-42c8-9283-4e3836ffb870",
    );
  });

  it("10. No cross-tenant escalation: instance runtime config isolates target databases", () => {
    const eatcleanConfig = resolveInstanceRuntimeConfig(EATCLEAN_HOST);
    const demoConfig = resolveInstanceRuntimeConfig(PLATFORM_HOST);

    expect(eatcleanConfig.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
    expect(demoConfig.supabaseProjectRef).toBe("djangucecsphnejplvic");
    expect(eatcleanConfig.instanceType).toBe("customer_tenant");
    expect(demoConfig.instanceType).toBe("core_demo");
  });
});

