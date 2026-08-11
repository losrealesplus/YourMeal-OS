import { describe, expect, it, vi } from "vitest";
import { TenantDeploymentService } from "./tenant-deployment-service";
import { tryConsumeDeploymentAssociation } from "./consume-deployment-association";

describe("TenantDeploymentService", () => {
  it("requests pending association via deployment without client tenant_id", async () => {
    const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
      expect(fn).toBe("request_tenant_association_for_deployment");
      expect(args).toEqual({
        p_platform: "android",
        p_identifier: "com.yourmealos.eatclean",
      });
      expect(args).not.toHaveProperty("p_tenant_id");
      expect(args).not.toHaveProperty("tenant_id");
      return {
        data: {
          tenant_id: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
          display_name: "EatClean Tenerife",
          membership_id: "m1",
          status: "pending",
          created: true,
        },
        error: null,
      };
    });
    const supabase = { rpc } as never;
    const result = await TenantDeploymentService.requestAssociation(supabase, {
      platform: "android",
      identifier: "com.yourmealos.eatclean",
    });
    expect(result.status).toBe("pending");
    expect(result.created).toBe(true);
    expect(result.tenantId).toBe("7823e85a-986f-401f-9bbe-e4e431ff3be1");
  });
});

describe("tryConsumeDeploymentAssociation", () => {
  it("returns ok:false when RPC fails without throwing", async () => {
    const supabase = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "deployment not found" },
      })),
    } as never;
    const result = await tryConsumeDeploymentAssociation(supabase);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/deployment not found/i);
    }
  });
});
