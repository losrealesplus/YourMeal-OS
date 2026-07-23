import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import { OrderService } from "./order-service";
import type { ServiceContext } from "@/services/types";

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
        total: 0,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects when orders.write is missing", async () => {
    await expect(
      OrderService.programDraft(ctx({ roles: [] }), {
        weekStart: "2026-07-20",
        dayDate: "2026-07-22",
        dishIds: ["d1"],
        total: 9.9,
      }),
    ).rejects.toBeTruthy();
  });

  it("rejects confirm without orderId", async () => {
    await expect(OrderService.confirm(ctx(), "")).rejects.toBeInstanceOf(DomainError);
  });
});
