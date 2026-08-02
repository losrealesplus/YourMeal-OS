/**
 * FLOW01-001 live domain driver (invoked by scripts/lib/flow01-t1-domain-driver.mjs).
 * Exercises startProduction with a mocked repository and emits [FLOW-01] console evidence.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("FLOW01-001 live domain driver", () => {
  afterEach(() => {
    __resetFlow01EvidenceForTests();
    vi.clearAllMocks();
  });

  it("drives Kitchen → Production and emits T1 evidence", async () => {
    // Real console so the parent runner can extract [FLOW-01] tokens from vitest output.
    countByStatuses.mockResolvedValue(1);
    getOrder.mockResolvedValue({
      id: "order-flow01-t1",
      status: "confirmed",
      tenant_id: "tenant-flow01",
    });
    transitionStatus.mockResolvedValue("in_production");

    const status = await OperationsService.startProduction(
      ctx(),
      "order-flow01-t1",
    );
    expect(status).toBe("in_production");
    expect(getObservedFlow01Steps()).toEqual([
      "FLOW01_T1_STARTED",
      "FLOW01_T1_COMPLETED",
    ]);
  });
});
