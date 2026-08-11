import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resetBootstrapIdentitySnapshot,
  getBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
} from "./BootstrapIdentityStore";
import { resetOwnedIdentityStagesInflight } from "./runOwnedIdentityStages";
import { resetSessionIdentityInflight } from "./services/SessionBootstrapService";

vi.mock("./services/SessionBootstrapService", async () => {
  const actual = await vi.importActual<
    typeof import("./services/SessionBootstrapService")
  >("./services/SessionBootstrapService");
  return {
    ...actual,
    loadSessionIdentity: vi.fn(async (userId: string) => ({
      userId,
      roles: ["company_admin"] as const,
      profile: {
        id: userId,
        fullName: "Test",
        avatarUrl: null,
        locale: "es",
        phone: null,
      },
      tenant: { id: "t1", name: "EatClean", slug: "eatclean-tenerife" },
      membershipStatus: "approved" as const,
    })),
  };
});

vi.mock("./services/BrandingBootstrapService", () => ({
  resolveBootstrapBranding: vi.fn(async () => ({
    provenance: "static" as const,
    slug: "eatclean",
    remoteOk: false,
  })),
}));

vi.mock("./services/CustomerMaterializationService", () => ({
  ensureCustomerForActiveTenant: vi.fn(async () => ({
    customerId: "cust-1",
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { email: "t@example.com", user_metadata: {} } },
        error: null,
      })),
    },
  },
}));

describe("Stage ownership (PRODUCT-CORE-003)", () => {
  afterEach(() => {
    resetBootstrapIdentitySnapshot();
    resetOwnedIdentityStagesInflight();
    resetSessionIdentityInflight();
    vi.clearAllMocks();
  });

  it("SessionStage publishes identity snapshot via service", async () => {
    const { SessionStage } = await import("./stages/SessionStage");
    const { createBootstrapContext } = await import("./BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await SessionStage.run(ctx);
    expect(outcome.status).toBe("ok");
    const snap = getBootstrapIdentitySnapshot();
    expect(snap.userId).toBe("u1");
    expect(snap.roles).toContain("company_admin");
    expect(snap.tenant?.id).toBe("t1");
  });

  it("TenantStage binds tenantId from session identity", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["company_admin"],
      profile: null,
      tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
      homePath: null,
      status: "loading",
    });
    const { TenantStage } = await import("./stages/TenantStage");
    const { ensureCustomerForActiveTenant } = await import(
      "./services/CustomerMaterializationService"
    );
    const { createBootstrapContext } = await import("./BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await TenantStage.run(ctx);
    expect(outcome.status).toBe("ok");
    expect(outcome.patch?.tenantId).toBe("t1");
    expect(ensureCustomerForActiveTenant).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", tenantId: "t1" }),
    );
  });

  it("NavigationStage owns homePath and marks snapshot ready", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["company_admin"],
      profile: null,
      tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
      homePath: null,
      status: "loading",
    });
    const { NavigationStage } = await import("./stages/NavigationStage");
    const { createBootstrapContext } = await import("./BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await NavigationStage.run(ctx);
    expect(outcome.status).toBe("ok");
    expect(outcome.patch?.homePath).toBe("/admin");
    expect(getBootstrapIdentitySnapshot().status).toBe("ready");
  });

  it("runOwnedIdentityStages coordinates Session→Navigation ownership", async () => {
    const { runOwnedIdentityStages } = await import("./runOwnedIdentityStages");
    const snap = await runOwnedIdentityStages({ userId: "u1" });
    expect(snap.status).toBe("ready");
    expect(snap.tenant?.id).toBe("t1");
    expect(snap.homePath).toBe("/admin");
  });
});
