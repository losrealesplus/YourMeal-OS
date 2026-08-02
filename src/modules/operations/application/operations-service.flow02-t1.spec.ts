import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OperationsService } from "./operations-service";
import {
  __resetFlow02EvidenceForTests,
  getObservedFlow02Steps,
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

describe("FLOW02-001 · OperationsService.transitionDelivery T1", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T1_STARTED then T1_COMPLETED on out_for_delivery → delivery_issue", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "out_for_delivery",
    });
    transitionStatus.mockResolvedValue("delivery_issue");

    const next = await OperationsService.transitionDelivery(
      ctx(),
      "order-1",
      "delivery_issue",
    );
    expect(next).toBe("delivery_issue");
    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-02]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW02_T"));
    expect(flowTokens).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW02_T2"))).toBe(false);
    expect(flowTokens.some((t) => t.includes("T3"))).toBe(false);
  });

  it("does not emit FLOW02 tokens for delivered (happy path)", async () => {
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

  it("stops T1 without COMPLETED when RPC fails", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "out_for_delivery",
    });
    transitionStatus.mockRejectedValue(new Error("rpc down"));

    await expect(
      OperationsService.transitionDelivery(ctx(), "order-1", "delivery_issue"),
    ).rejects.toBeTruthy();

    expect(getObservedFlow02Steps()).toEqual(["FLOW02_T1_STARTED"]);
    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-02]")
      .map((c) => c[1]);
    expect(tokens).toContain("STOP");
    expect(tokens).not.toContain("FLOW02_T1_COMPLETED");
  });

  it("rejects illegal transition", async () => {
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "confirmed",
    });

    await expect(
      OperationsService.transitionDelivery(ctx(), "order-1", "delivery_issue"),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow02Steps()).toEqual([]);
  });
});
