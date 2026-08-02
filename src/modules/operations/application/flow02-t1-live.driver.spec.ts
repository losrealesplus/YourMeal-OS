/**
 * FLOW02-001 live domain driver (invoked by scripts/lib/flow02-domain-driver.mjs).
 * Exercises out_for_delivery → delivery_issue and emits [FLOW-02] console evidence.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { DeliveryService } from "@/modules/delivery";
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

vi.mock("@/modules/delivery/application/route-service", () => ({
  RouteService: {
    markOrderStopsDelivered: vi.fn(async () => undefined),
  },
}));

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "flow02-driver",
    tenantId: "tenant-flow02",
    roles: ["logistics"],
    capabilities: new Set(["logistics.operate"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW02-001 live domain driver", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    vi.clearAllMocks();
  });

  it("drives out_for_delivery → delivery_issue and emits T1 evidence", async () => {
    // Real console so the parent runner can extract [FLOW-02] tokens from vitest output.
    countByStatuses.mockResolvedValue(1);
    getOrder.mockImplementation(async () => {
      // Before RPC: still in route · after RPC: incident open
      if (transitionStatus.mock.calls.length === 0) {
        return {
          id: "order-flow02-t1",
          status: "out_for_delivery",
          tenant_id: "tenant-flow02",
        };
      }
      return {
        id: "order-flow02-t1",
        status: "delivery_issue",
        tenant_id: "tenant-flow02",
      };
    });
    transitionStatus.mockResolvedValue("delivery_issue");

    const next = await DeliveryService.recordAttempt(ctx(), {
      orderId: "order-flow02-t1",
      outcome: "issue",
      note: "customer not available",
    });
    expect(next.status).toBe("delivery_issue");
    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
    ]);
  });
});
