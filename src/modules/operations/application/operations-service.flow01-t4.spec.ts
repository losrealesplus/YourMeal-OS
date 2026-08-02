import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { OperationsService } from "./operations-service";
import {
  __resetFlow01EvidenceForTests,
  getObservedFlow01Steps,
} from "./flow01-evidence";
import { __resetPackagingBatchesForTests } from "../domain/packaging-batch";
import { __resetDeliveryAssignmentsForTests } from "../domain/delivery-assignment";

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
    roles: ["kitchen", "delivery"],
    capabilities: new Set(["kitchen.operate", "logistics.operate"]),
    localization: null,
    ip: null,
  };
}

async function driveToT3() {
  await OperationsService.startProduction(ctx(), "order-1");
  await OperationsService.completeProduction(ctx(), "order-1");
  await OperationsService.startPackaging(ctx(), "order-1");
  await OperationsService.completePackaging(ctx(), "order-1");
  await OperationsService.assignDelivery(ctx(), "order-1");
}

describe("FLOW01-004 · Delivery confirmation", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    __resetPackagingBatchesForTests();
    __resetDeliveryAssignmentsForTests();
    orderStatus = "confirmed";
    vi.clearAllMocks();
  });

  it("emits full FLOW01_T1–T4 once-only; terminal delivered", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await driveToT3();

    await OperationsService.startOutForDelivery(ctx(), "order-1");
    const status = await OperationsService.completeDelivery(ctx(), "order-1");
    expect(status).toBe("delivered");

    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
      "FLOW01_T2_STARTED",
      "FLOW01_T2_COMPLETED",
      "FLOW01_T3_STARTED",
      "FLOW01_T3_COMPLETED",
      "FLOW01_T4_STARTED",
      "FLOW01_T4_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW01_T"));
    expect(tokens.filter((t) => t === "FLOW01_T4_STARTED")).toHaveLength(1);
    expect(tokens.filter((t) => t === "FLOW01_T4_COMPLETED")).toHaveLength(1);
  });

  it("rejects completeDelivery without T4_STARTED", async () => {
    await expect(
      OperationsService.completeDelivery(ctx(), "order-1"),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
