import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OperationsService } from "./operations-service";
import {
  __resetFlow01EvidenceForTests,
  getObservedFlow01Steps,
} from "./flow01-evidence";

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
    roles: ["kitchen"],
    capabilities: new Set(["kitchen.operate"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

describe("FLOW01-001 · OperationsService.startProduction", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits T1_STARTED then T1_COMPLETED exactly once on confirmed → in_production", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "confirmed",
    });
    transitionStatus.mockResolvedValue("in_production");

    const next = await OperationsService.startProduction(ctx(), "order-1");
    expect(next).toBe("in_production");
    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW01_T"));
    expect(flowTokens).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW01_T2"))).toBe(false);
  });

  it("does not emit T1 for non-T1 kitchen transitions", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "in_production",
    });
    transitionStatus.mockResolvedValue("prepared");

    await OperationsService.transitionKitchen(ctx(), "order-1", "prepared");
    expect(getObservedFlow01Steps()).toEqual([]);
  });

  it("stops T1 without COMPLETED when RPC fails", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "confirmed",
    });
    transitionStatus.mockRejectedValue(new Error("rpc down"));

    await expect(
      OperationsService.startProduction(ctx(), "order-1"),
    ).rejects.toBeTruthy();

    expect(getObservedFlow01Steps()).toEqual(["FLOW01_T1_STARTED"]);
    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => c[1]);
    expect(tokens).toContain("STOP");
    expect(tokens).not.toContain("FLOW01_T1_COMPLETED");
  });

  it("rejects illegal transition", async () => {
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-1",
      status: "confirmed",
    });

    await expect(
      OperationsService.transitionKitchen(ctx(), "order-1", "delivered"),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow01Steps()).toEqual([]);
  });
});
