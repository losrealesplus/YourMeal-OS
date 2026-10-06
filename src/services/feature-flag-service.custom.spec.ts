import { describe, expect, it, vi } from "vitest";
import { FeatureFlagService } from "./feature-flag-service";
import type { ServiceContext } from "./types";
describe("tenant-only custom presentation flag", () => {
  it.each([null, { enabled: false }, { enabled: true }])(
    "reads only the exact tenant: %j",
    async (data) => {
      const chain = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      };
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      const ctx = {
        tenantId: "tenant-a",
        supabase: { from: () => chain },
      } as unknown as ServiceContext;
      expect(await FeatureFlagService.isTenantEnabled(ctx, "orders_custom_capture")).toBe(
        data?.enabled === true,
      );
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
      expect(chain.eq).toHaveBeenCalledWith("key", "orders_custom_capture");
    },
  );
  it.each(["error", "throw"])("fails closed on %s", async (failure) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () =>
        failure === "error"
          ? Promise.resolve({ data: { enabled: true }, error: {} })
          : Promise.reject(new Error("offline")),
    };
    expect(
      await FeatureFlagService.isTenantEnabled(
        { tenantId: "a", supabase: { from: () => chain } } as unknown as ServiceContext,
        "orders_custom_capture",
      ),
    ).toBe(false);
  });
});
