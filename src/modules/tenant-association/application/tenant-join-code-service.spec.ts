import { describe, expect, it, vi } from "vitest";
import { TenantJoinCodeService } from "./tenant-join-code-service";

function mockRpc(impl: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>) {
  return {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => impl(fn, args)),
  };
}

describe("TenantJoinCodeService", () => {
  it("resolves valid join code via RPC and ignores client tenant_id", async () => {
    const supabase = mockRpc(async (fn, args) => {
      expect(fn).toBe("resolve_tenant_join_code");
      expect(args).toEqual({ p_code: "TJ-A1B2C3D4" });
      // Client must never pass tenant_id into this RPC.
      expect("p_tenant_id" in args).toBe(false);
      expect("tenant_id" in args).toBe(false);
      return {
        data: {
          tenant_id: "11111111-1111-4111-8111-111111111111",
          display_name: "Phase2 Test Tenant",
        },
        error: null,
      };
    });

    const resolved = await TenantJoinCodeService.resolve(
      supabase as never,
      " tj-a1b2c3d4 ",
    );
    expect(resolved).toEqual({
      tenantId: "11111111-1111-4111-8111-111111111111",
      displayName: "Phase2 Test Tenant",
    });
  });

  it("fails on invalid / company-code shaped input without calling RPC", async () => {
    const supabase = mockRpc(async () => {
      throw new Error("rpc must not be called");
    });
    await expect(
      TenantJoinCodeService.resolve(supabase as never, "EC-0431"),
    ).rejects.toThrow(/Invalid join code format/);
    await expect(
      TenantJoinCodeService.resolve(supabase as never, ""),
    ).rejects.toThrow(/Invalid join code format/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("surfaces server rejection for unknown codes", async () => {
    const supabase = mockRpc(async () => ({
      data: null,
      error: { message: "join code not found" },
    }));
    await expect(
      TenantJoinCodeService.resolve(supabase as never, "TJ-DEADBEEF"),
    ).rejects.toThrow(/join code not found/i);
  });

  it("generates join code for a tenant via staff RPC", async () => {
    const supabase = mockRpc(async (fn, args) => {
      expect(fn).toBe("generate_tenant_join_code");
      expect(args).toEqual({
        p_tenant_id: "22222222-2222-4222-8222-222222222222",
      });
      return { data: "TJ-ABCDEF12", error: null };
    });
    const code = await TenantJoinCodeService.generate(
      supabase as never,
      "22222222-2222-4222-8222-222222222222",
    );
    expect(code).toBe("TJ-ABCDEF12");
  });

  it("requests pending association via join code without client tenant_id", async () => {
    const supabase = mockRpc(async (fn, args) => {
      expect(fn).toBe("request_tenant_association_by_join_code");
      expect(args).toEqual({ p_code: "TJ-A1B2C3D4" });
      expect("p_tenant_id" in args).toBe(false);
      expect("tenant_id" in args).toBe(false);
      return {
        data: {
          tenant_id: "11111111-1111-4111-8111-111111111111",
          display_name: "EatClean",
          membership_id: "33333333-3333-4333-8333-333333333333",
          status: "pending",
          created: true,
        },
        error: null,
      };
    });
    const result = await TenantJoinCodeService.requestAssociation(
      supabase as never,
      "tj-a1b2c3d4",
    );
    expect(result.status).toBe("pending");
    expect(result.created).toBe(true);
    expect(result.tenantId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rejects invalid join code for association without RPC", async () => {
    const supabase = mockRpc(async () => {
      throw new Error("rpc must not be called");
    });
    await expect(
      TenantJoinCodeService.requestAssociation(supabase as never, "EC-0431"),
    ).rejects.toThrow(/Invalid join code format/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
