import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { ProductionReportService } from "./production-report-service";

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn<(filters: { statuses: string[] }) => Promise<never[]>>(async () => []),
}));
vi.mock("../infrastructure/operations-repository", () => ({
  createOperationsRepository: () => ({ listOrders: mocks.listOrders }),
}));
const ctx = { roles: ["kitchen"], tenantId: "tenant", supabase: {} } as unknown as ServiceContext;
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe("A5 actual enum values in production SQL filters", () => {
  it.each(["2026-10-05", "2026-10-07", "2026-10-10"])(
    "%s selects production demand and never submits reporting aliases",
    async (deliveryDate) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
      await ProductionReportService.buildOperationalSuiteForDay(ctx, { deliveryDate });
      const filters = mocks.listOrders.mock.calls[0][0];
      expect(filters.statuses).toContain("in_production");
      for (const forbidden of [
        "kitchen_pending",
        "in_preparation",
        "in_transit",
        "completed",
        "packed",
        "cancelled",
      ])
        expect(filters.statuses).not.toContain(forbidden);
    },
  );
});
