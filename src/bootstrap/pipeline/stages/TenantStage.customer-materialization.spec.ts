import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resetBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";
import { resetSessionIdentityInflight } from "../services/SessionBootstrapService";

const { ensureCustomerForActiveTenant } = vi.hoisted(() => ({
  ensureCustomerForActiveTenant: vi.fn(
    async (_input: {
      userId: string;
      tenantId: string;
      displayName?: string | null;
      email?: string | null;
    }) => ({ customerId: "cust-1" }),
  ),
}));

vi.mock("../services/CustomerMaterializationService", () => ({
  ensureCustomerForActiveTenant,
}));

vi.mock("../services/SessionBootstrapService", async () => {
  const actual = await vi.importActual<
    typeof import("../services/SessionBootstrapService")
  >("../services/SessionBootstrapService");
  return {
    ...actual,
    loadSessionIdentity: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            email: "e2e@example.com",
            user_metadata: { full_name: "E2E" },
          },
        },
        error: null,
      })),
    },
  },
}));

describe("TenantStage customer materialization", () => {
  afterEach(() => {
    resetBootstrapIdentitySnapshot();
    resetSessionIdentityInflight();
    ensureCustomerForActiveTenant.mockClear();
    vi.clearAllMocks();
  });

  it("T1: ActiveTenant bound → ensureCustomerForActiveTenant runs", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["customer"],
      profile: {
        id: "u1",
        fullName: "E2E",
        avatarUrl: null,
        locale: "es",
        phone: null,
      },
      tenant: {
        id: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
        name: "EatClean",
        slug: "eatclean",
      },
      homePath: null,
      status: "loading",
    });

    const { TenantStage } = await import("./TenantStage");
    const { createBootstrapContext } = await import("../BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await TenantStage.run(ctx);
    expect(outcome.status).toBe("ok");
    expect(ensureCustomerForActiveTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        tenantId: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
      }),
    );
    expect(outcome.notes).toContain("customer:materialized");
    expect(outcome.evidence?.customerId).toBe("cust-1");
  });

  it("T6: no ActiveTenant → skip materialization (pending path)", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: [],
      profile: null,
      tenant: null,
      homePath: null,
      status: "loading",
    });

    const { TenantStage } = await import("./TenantStage");
    const { createBootstrapContext } = await import("../BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await TenantStage.run(ctx);
    expect(outcome.status).toBe("ok");
    expect(ensureCustomerForActiveTenant).not.toHaveBeenCalled();
    expect(outcome.notes).toContain("customer:skipped_no_active_tenant");
  });

  it("materialization failure does not fail TenantStage", async () => {
    ensureCustomerForActiveTenant.mockRejectedValueOnce(
      new Error("ensure_individual_customer boom"),
    );
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["customer"],
      profile: null,
      tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
      homePath: null,
      status: "loading",
    });

    const { TenantStage } = await import("./TenantStage");
    const { createBootstrapContext } = await import("../BootstrapContext");
    const ctx = createBootstrapContext("r1", "cold");
    ctx.hasSession = true;
    ctx.userId = "u1";

    const outcome = await TenantStage.run(ctx);
    expect(outcome.status).toBe("ok");
    expect(outcome.notes).toContain("customer:materialization_failed");
    expect(outcome.patch?.tenantId).toBe("t1");
  });
});
