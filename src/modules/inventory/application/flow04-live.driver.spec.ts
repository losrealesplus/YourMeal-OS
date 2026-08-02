/**
 * FLOW-04 live domain driver (progressive T1–T3).
 * Invoked by scripts/lib/flow04-domain-driver.mjs
 *
 * FLOW04-001: through=1 → planConsumptionFromProduction
 * FLOW04-002: through=2 → + applyConsumption (default)
 * FLOW04-003: through=3 — not implemented yet
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceContext } from "@/services/types";
import { InventoryService } from "./inventory-service";
import {
  __resetFlow04EvidenceForTests,
  getObservedFlow04Steps,
} from "./flow04-evidence";
import {
  __resetInventoryStoreForTests,
  __seedProductionPlanInput,
  __seedStock,
} from "../infrastructure/inventory-repository";

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "flow04-driver",
    tenantId: "tenant-flow04",
    roles: ["inventory"],
    capabilities: new Set(["inventory.operate"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW-04 live domain driver", () => {
  afterEach(() => {
    __resetFlow04EvidenceForTests();
    __resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("drives certified transitions up to FLOW04_LIVE_THROUGH (default T2)", async () => {
    // FLOW04-002: default through=2 until T3 exists
    // Do NOT mock console.info — domain driver extracts [FLOW-04] tokens from stdout.
    const through = Number(process.env.FLOW04_LIVE_THROUGH || "2");

    __seedProductionPlanInput("tenant-flow04", {
      deliveryDate: "2026-08-02",
      dishes: [{ dishId: "dish-flow04", portions: 4 }],
      recipes: [
        {
          dishId: "dish-flow04",
          ingredientId: "ing-flow04",
          ingredientName: "Arroz",
          qty: 0.1,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-flow04", "ing-flow04", 100);

    const consumption = await InventoryService.planConsumptionFromProduction(
      ctx(),
      { deliveryDate: "2026-08-02" },
    );
    expect(consumption.status).toBe("planned");
    expect(consumption.lines).toHaveLength(1);
    expect(consumption.lines[0]?.qty).toBeCloseTo(0.4);

    if (through < 2) {
      expect(getObservedFlow04Steps()).toEqual([
        "FLOW04_T1_STARTED",
        "FLOW04_T1_COMPLETED",
      ]);
      return;
    }

    const applied = await InventoryService.applyConsumption(
      ctx(),
      consumption.id,
    );
    expect(applied.status).toBe("applied");

    if (through < 3) {
      expect(getObservedFlow04Steps()).toEqual([
        "FLOW04_T1_STARTED",
        "FLOW04_T1_COMPLETED",
        "FLOW04_T2_STARTED",
        "FLOW04_T2_COMPLETED",
      ]);
      return;
    }

    throw new Error(
      `FLOW04_LIVE_THROUGH=${through} not implemented (only T1–T2 certified)`,
    );
  });
});
