import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { resetBootstrapOrchestrator, getBootstrapOrchestrator } from "@/bootstrap/pipeline/BootstrapOrchestrator";
import {
  resetBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
  getBootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";
import { ensureApplicationReady, ApplicationReadyFailedError } from "@/bootstrap/ready/ensureApplicationReady";
import { deriveApplicationReadySnapshot } from "@/bootstrap/ready/deriveApplicationReady";
import { homePathForRoles } from "@/lib/home-path";
import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";

describe("Core Auth Session Bootstrap & Hydration Race Hardening", () => {
  beforeEach(() => {
    resetBootstrapOrchestrator();
    resetBootstrapIdentitySnapshot();
  });

  afterEach(() => {
    resetBootstrapOrchestrator();
    resetBootstrapIdentitySnapshot();
  });

  it("1. Alex saas_admin resolves to /admin on customer tenant without ErrorBoundary", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "alex-saas-admin-uuid",
      roles: ["saas_admin"],
      profile: {
        id: "alex-saas-admin-uuid",
        fullName: "Alex Platform Principal",
        avatarUrl: null,
        locale: "es",
        phone: null,
      },
      tenant: null,
      homePath: "/admin",
      status: "ready",
    });

    const snap = await ensureApplicationReady({ timeoutMs: 2000 });
    expect(snap.isReady).toBe(true);
    expect(snap.state).toBe("READY");

    const homePath = homePathForRoles(["saas_admin"], "eatclean.yourmealos.com");
    expect(homePath).toBe("/admin");
  });

  it("2. Adolfo company_admin resolves to /admin on EatClean tenant", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "adolfo-company-admin-uuid",
      roles: ["company_admin"],
      profile: {
        id: "adolfo-company-admin-uuid",
        fullName: "Adolfo Tenant Admin",
        avatarUrl: null,
        locale: "es",
        phone: null,
      },
      tenant: {
        id: "8bba00ba-331b-42c8-9283-4e3836ffb870",
        name: "EatClean Tenerife",
        slug: "eatclean",
      },
      homePath: "/admin",
      status: "ready",
    });

    const snap = await ensureApplicationReady({ timeoutMs: 2000 });
    expect(snap.isReady).toBe(true);
    expect(snap.state).toBe("READY");

    const homePath = homePathForRoles(["company_admin"], "eatclean.yourmealos.com");
    expect(homePath).toBe("/admin");
  });

  it("3. Valid persisted session survives simulated cold start with artificial delays (+500ms)", async () => {
    // Pipeline starts idle / bootstrapping
    publishBootstrapIdentitySnapshot({
      userId: "adolfo-company-admin-uuid",
      roles: [],
      profile: null,
      tenant: null,
      homePath: null,
      status: "loading",
    });

    const preSnap = deriveApplicationReadySnapshot(null, getBootstrapIdentitySnapshot());
    expect(preSnap.isReady).toBe(false);
    expect(preSnap.state).toBe("BOOTSTRAPPING");

    // Simulate 500ms stage ladder progression
    setTimeout(() => {
      // 1. Session Stage complete
      publishBootstrapIdentitySnapshot({
        userId: "adolfo-company-admin-uuid",
        roles: ["company_admin"],
        profile: {
          id: "adolfo-company-admin-uuid",
          fullName: "Adolfo Tenant Admin",
          avatarUrl: null,
          locale: "es",
          phone: null,
        },
        tenant: null,
        homePath: null,
        status: "loading",
      });
    }, 250);

    setTimeout(() => {
      // 2. Tenant + Navigation complete -> READY
      publishBootstrapIdentitySnapshot({
        userId: "adolfo-company-admin-uuid",
        roles: ["company_admin"],
        profile: {
          id: "adolfo-company-admin-uuid",
          fullName: "Adolfo Tenant Admin",
          avatarUrl: null,
          locale: "es",
          phone: null,
        },
        tenant: {
          id: "8bba00ba-331b-42c8-9283-4e3836ffb870",
          name: "EatClean Tenerife",
          slug: "eatclean",
        },
        homePath: "/admin",
        status: "ready",
      });
    }, 500);

    const snap = await ensureApplicationReady({ timeoutMs: 3000 });
    expect(snap.isReady).toBe(true);
    expect(snap.state).toBe("READY");
    expect(snap.identityUserId).toBe("adolfo-company-admin-uuid");
  });

  it("4. Expired or unauthenticated session throws ApplicationReadyFailedError on timeout for clean redirect to /auth", async () => {
    await expect(
      ensureApplicationReady({ timeoutMs: 100 }),
    ).rejects.toThrowError(ApplicationReadyFailedError);
  });

  it("5. Malformed/incomplete session without user ID does not produce READY state", () => {
    const snap = deriveApplicationReadySnapshot(null, {
      userId: null,
      roles: [],
      profile: null,
      tenant: null,
      homePath: null,
      status: "ready", // malformed: status ready but userId null
      updatedAt: Date.now(),
    });
    expect(snap.isReady).toBe(false);
  });

  it("6. Tenant runtime binding isolation is preserved", () => {
    const config = resolveInstanceRuntimeConfig("eatclean.yourmealos.com");
    expect(config.instanceType).toBe("customer_tenant");
    expect(config.tenantSlug).toBe("eatclean");
    expect(config.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
    expect(config.supabaseUrl).toBe("https://nhirlpkuvonggctdzzad.supabase.co");
    expect(config.supabaseUrl).not.toContain("djangucecsphnejplvic");
  });
});
