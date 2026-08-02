/**
 * FLOW-01 live domain driver (T1 + T2 as certified).
 * Invoked by scripts/lib/flow01-domain-driver.mjs
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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
  id: "order-flow01",
  status: orderStatus,
  tenant_id: "tenant-flow01",
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
    userId: "flow01-driver",
    tenantId: "tenant-flow01",
    roles: ["kitchen"],
    capabilities: new Set(["kitchen.operate"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW-01 live domain driver", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    __resetPackagingBatchesForTests();
    orderStatus = "confirmed";
    vi.clearAllMocks();
  });

  it("drives certified transitions up to FLOW01_LIVE_THROUGH (default T2)", async () => {
    const through = Number(process.env.FLOW01_LIVE_THROUGH || "2");

    await OperationsService.startProduction(ctx(), "order-flow01");
    if (through < 2) {
      expect(getObservedFlow01Steps()).toEqual([
        "FLOW01_T1_STARTED",
        "FLOW01_T1_COMPLETED",
      ]);
      return;
    }

    await OperationsService.completeProduction(ctx(), "order-flow01");
    const pkg = await OperationsService.startPackaging(ctx(), "order-flow01");

    expect(pkg.batch.status).toBe("IN_PROGRESS");
    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
      "FLOW01_T2_STARTED",
      "FLOW01_T2_COMPLETED",
    ]);
  });
});
