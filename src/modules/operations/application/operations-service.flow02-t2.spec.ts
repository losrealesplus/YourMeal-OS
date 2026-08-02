import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
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

function seedT1Complete() {
  beginFlow02Pipeline({ orderId: "order-1" });
  logFlow02Step("FLOW02_T1_STARTED");
  logFlow02Step("FLOW02_T1_COMPLETED");
}

describe("FLOW02-002 · OperationsService.transitionDelivery T2", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T2_STARTED then T2_COMPLETED on delivery_issue → out_for_delivery", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1Complete();
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "delivery_issue",
    });
    transitionStatus.mockResolvedValue("out_for_delivery");

    const next = await OperationsService.transitionDelivery(
      ctx(),
      "order-1",
      "out_for_delivery",
    );
    expect(next).toBe("out_for_delivery");
    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
      "FLOW02_T2_STARTED",
      "FLOW02_T2_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-02]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW02_T"));
    expect(flowTokens).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
      "FLOW02_T2_STARTED",
      "FLOW02_T2_COMPLETED",
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW02_T3"))).toBe(false);
  });

  it("rejects T2 without T1 COMPLETED", async () => {
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "delivery_issue",
    });

    await expect(
      OperationsService.transitionDelivery(
        ctx(),
        "order-1",
        "out_for_delivery",
      ),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow02Steps()).toEqual([]);
  });

  it("does not emit T3 tokens", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1Complete();
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "delivery_issue",
    });
    transitionStatus.mockResolvedValue("out_for_delivery");

    await OperationsService.transitionDelivery(
      ctx(),
      "order-1",
      "out_for_delivery",
    );
    expect(
      getObservedFlow02Steps().some((s) => s.startsWith("FLOW02_T3")),
    ).toBe(false);
  });
});
