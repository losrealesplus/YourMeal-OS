import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { OperationsService } from "./operations-service";
import {
  __resetFlow02EvidenceForTests,
  beginFlow02Pipeline,
  getObservedFlow02Steps,
  logFlow02Step,
} from "./flow02-evidence";

const transitionStatus = vi.fn();
const getOrder = vi.fn();
const countByStatuses = vi.fn();

vi.mock("../infrastructure/operations-repository", () => ({
  createOperationsRepository: () => ({
    transitionStatus,
    getOrder,
    countByStatuses,
    listOrders: vi.fn(),
  }),
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
    roles: ["logistics"],
    capabilities: new Set(["logistics.operate"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

function seedT2Complete() {
  beginFlow02Pipeline({ orderId: "order-1" });
  logFlow02Step("FLOW02_T1_STARTED");
  logFlow02Step("FLOW02_T1_COMPLETED");
  logFlow02Step("FLOW02_T2_STARTED");
  logFlow02Step("FLOW02_T2_COMPLETED");
}

describe("FLOW02-003 · OperationsService.transitionDelivery T3", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T3_STARTED then T3_COMPLETED on post-retry delivered", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    seedT2Complete();
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "out_for_delivery",
    });
    transitionStatus.mockResolvedValue("delivered");

    const next = await OperationsService.transitionDelivery(
      ctx(),
      "order-1",
      "delivered",
    );
    expect(next).toBe("delivered");
    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
      "FLOW02_T2_STARTED",
      "FLOW02_T2_COMPLETED",
      "FLOW02_T3_STARTED",
      "FLOW02_T3_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-02]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW02_T"));
    expect(flowTokens.filter((t) => t.startsWith("FLOW02_T3"))).toEqual([
      "FLOW02_T3_STARTED",
      "FLOW02_T3_COMPLETED",
    ]);
  });

  it("does not emit FLOW02_T3 without T2 COMPLETED (happy-path delivery)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "out_for_delivery",
    });
    transitionStatus.mockResolvedValue("delivered");

    await OperationsService.transitionDelivery(ctx(), "order-1", "delivered");
    expect(getObservedFlow02Steps()).toEqual([]);
  });
});
