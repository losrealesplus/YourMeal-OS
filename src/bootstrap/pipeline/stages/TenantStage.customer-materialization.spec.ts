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

describe("TenantStage tenant binding (AUTH USER != CUSTOMER)", () => {
  afterEach(() => {
    resetBootstrapIdentitySnapshot();
    resetSessionIdentityInflight();
    ensureCustomerForActiveTenant.mockClear();
    vi.clearAllMocks();
  });

  it("T1: ActiveTenant bound → binds tenant without auto-materializing customer", async () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["company_admin"],
      profile: {
        id: "u1",
        fullName: "Adolfo Alvarez",
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
    expect(ensureCustomerForActiveTenant).not.toHaveBeenCalled();
    expect(outcome.notes).toContain("customer:independent_domain_model");
    expect(outcome.patch?.tenantId).toBe("7823e85a-986f-401f-9bbe-e4e431ff3be1");
  });

  it("T2: no ActiveTenant → skip tenant binding (pending path)", async () => {
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
});
