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
    roles: ["kitchen"],
    capabilities: new Set(["kitchen.operate"]),
    localization: null,
    ip: null,
  };
}

async function driveToT2() {
  await OperationsService.startProduction(ctx(), "order-1");
  await OperationsService.completeProduction(ctx(), "order-1");
  await OperationsService.startPackaging(ctx(), "order-1");
}

describe("FLOW01-003 · Packaging → Delivery handoff", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    __resetPackagingBatchesForTests();
    __resetDeliveryAssignmentsForTests();
    orderStatus = "confirmed";
    vi.clearAllMocks();
  });

  it("emits T1–T3 once-only; no T4; ends at ready_for_delivery", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await driveToT2();

    const batch = await OperationsService.completePackaging(ctx(), "order-1");
    expect(batch.status).toBe("CLOSED");

    const handoff = await OperationsService.assignDelivery(ctx(), "order-1");
    expect(handoff.status).toBe("ready_for_delivery");
    expect(handoff.assignment.status).toBe("ASSIGNED");

    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
      "FLOW01_T2_STARTED",
      "FLOW01_T2_COMPLETED",
      "FLOW01_T3_STARTED",
      "FLOW01_T3_COMPLETED",
    ]);

    const tokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-01]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW01_T"));
    expect(tokens.filter((t) => t === "FLOW01_T3_STARTED")).toHaveLength(1);
    expect(tokens.filter((t) => t === "FLOW01_T3_COMPLETED")).toHaveLength(1);
    expect(tokens.some((t) => t.startsWith("FLOW01_T4"))).toBe(false);
  });

  it("rejects completePackaging without T2", async () => {
    await expect(
      OperationsService.completePackaging(ctx(), "order-1"),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
