/**
 * FLOW-02 live domain driver (T1–T3 progressive).
 * Invoked by scripts/lib/flow02-domain-driver.mjs
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { DeliveryService } from "@/modules/delivery";
import { OperationsService } from "./operations-service";
import {
  __resetFlow02EvidenceForTests,
  getObservedFlow02Steps,
} from "./flow02-evidence";

let orderStatus = "out_for_delivery";
const transitionStatus = vi.fn(async (_id: string, to: string) => {
  orderStatus = to;
  return to;
});
const getOrder = vi.fn(async () => ({
  id: "order-flow02",
  status: orderStatus,
  tenant_id: "tenant-flow02",
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

describe("FLOW-02 live domain driver", () => {
  afterEach(() => {
    __resetFlow02EvidenceForTests();
    orderStatus = "out_for_delivery";
    vi.clearAllMocks();
  });

  it("drives certified transitions up to FLOW02_LIVE_THROUGH (default T3)", async () => {
    // Default = max certified transition (T3 after FLOW02-003).
    const through = Number(process.env.FLOW02_LIVE_THROUGH || "3");

    await DeliveryService.recordAttempt(ctx(), {
      orderId: "order-flow02",
      outcome: "issue",
      note: "customer not available",
    });
    if (through < 2) {
      expect(getObservedFlow02Steps()).toEqual([
        "FLOW02_T1_STARTED",
        "FLOW02_T1_COMPLETED",
      ]);
      expect(orderStatus).toBe("delivery_issue");
      return;
    }

    await OperationsService.transitionDelivery(
      ctx(),
      "order-flow02",
      "out_for_delivery",
    );
    if (through < 3) {
      expect(getObservedFlow02Steps()).toEqual([
        "FLOW02_T1_STARTED",
        "FLOW02_T1_COMPLETED",
        "FLOW02_T2_STARTED",
        "FLOW02_T2_COMPLETED",
      ]);
      return;
    }

    const resolved = await DeliveryService.recordAttempt(ctx(), {
      orderId: "order-flow02",
      outcome: "delivered",
      note: "delivered on retry",
    });
    expect(resolved.status).toBe("delivered");
    expect(getObservedFlow02Steps()).toEqual([
      "FLOW02_T1_STARTED",
      "FLOW02_T1_COMPLETED",
      "FLOW02_T2_STARTED",
      "FLOW02_T2_COMPLETED",
      "FLOW02_T3_STARTED",
      "FLOW02_T3_COMPLETED",
    ]);
  });
});
