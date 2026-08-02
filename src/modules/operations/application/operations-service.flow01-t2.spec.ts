import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OperationsService } from "./operations-service";
import {
  __resetFlow01EvidenceForTests,
  getObservedFlow01Steps,
} from "./flow01-evidence";
import { __resetPackagingBatchesForTests } from "../domain/packaging-batch";

let orderStatus = "confirmed";
const transitionStatus = vi.fn(async (_id: string, to: string) => {
  orderStatus = to;
  return to;
});
const getOrder = vi.fn(async () => ({
  id: "order-1",
  status: orderStatus,
}));
const countByStatuses = vi.fn(async () => 1);

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

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-1",
    tenantId: "tenant-1",
    roles: ["kitchen"],
    capabilities: new Set(["kitchen.operate"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW01-002 · Production → Packaging", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    __resetPackagingBatchesForTests();
    orderStatus = "confirmed";
    vi.clearAllMocks();
  });

  it("emits T1 then T2 once-only; no T3", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await OperationsService.startProduction(ctx(), "order-1");
    await OperationsService.completeProduction(ctx(), "order-1");
    const result = await OperationsService.startPackaging(ctx(), "order-1");

    expect(result.status).toBe("prepared");
    expect(result.batch.status).toBe("IN_PROGRESS");
    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
      "FLOW01_T2_STARTED",
      "FLOW01_T2_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW01_T"));
    expect(tokens.filter((t) => t === "FLOW01_T2_STARTED")).toHaveLength(1);
    expect(tokens.filter((t) => t === "FLOW01_T2_COMPLETED")).toHaveLength(1);
    expect(tokens.some((t) => t.startsWith("FLOW01_T3"))).toBe(false);
  });

  it("rejects startPackaging without T1", async () => {
    orderStatus = "prepared";
    await expect(
      OperationsService.startPackaging(ctx(), "order-1"),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects completeProduction without T1", async () => {
    orderStatus = "in_production";
    await expect(
      OperationsService.completeProduction(ctx(), "order-1"),
    ).rejects.toMatchObject({
      message: expect.stringContaining("T1 COMPLETED"),
    });
  });
});
