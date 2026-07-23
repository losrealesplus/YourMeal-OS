import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import { OrderService } from "./order-service";
import type { ServiceContext } from "@/services/types";

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

function ctx(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-1",
    tenantId: "tenant-1",
    roles: ["customer"],
    capabilities: new Set(["orders.write"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

describe("OrderService.programDraft", () => {
  it("rejects empty dish selection", async () => {
    await expect(
      OrderService.programDraft(ctx(), {
        weekStart: "2026-07-20",
        dayDate: "2026-07-22",
        dishIds: [],
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects when orders.write is missing", async () => {
    await expect(
      OrderService.programDraft(ctx({ roles: [] }), {
        weekStart: "2026-07-20",
        dayDate: "2026-07-22",
        dishIds: ["d1"],
      }),
    ).rejects.toBeTruthy();
  });

  it("rejects confirm without orderId", async () => {
    await expect(OrderService.confirm(ctx(), "")).rejects.toBeInstanceOf(DomainError);
  });
});

describe("OrderService feature flags", () => {
  it("rejects programDraft when order_programming is off", async () => {
    const { FeatureFlagService } = await import("@/services/feature-flag-service");
    vi.mocked(FeatureFlagService.isEnabled).mockResolvedValueOnce(false);

    await expect(
      OrderService.programDraft(ctx(), {
        weekStart: "2026-07-20",
        dayDate: "2026-07-22",
        dishIds: ["d1"],
      }),
    ).rejects.toMatchObject({ code: "UNIMPLEMENTED" });
  });

  it("rejects confirm when order_confirmation is off", async () => {
    const { FeatureFlagService } = await import("@/services/feature-flag-service");
    vi.mocked(FeatureFlagService.isEnabled).mockResolvedValueOnce(false);

    await expect(OrderService.confirm(ctx(), "order-1")).rejects.toMatchObject({
      code: "UNIMPLEMENTED",
    });
  });
});
