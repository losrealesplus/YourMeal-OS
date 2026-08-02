import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { InventoryService } from "./inventory-service";
import {
  __resetFlow04EvidenceForTests,
  getObservedFlow04Steps,
} from "./flow04-evidence";
import {
  __resetInventoryStoreForTests,
  __seedProductionPlanInput,
} from "../infrastructure/inventory-repository";

function ctx(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-1",
    tenantId: "tenant-1",
    roles: ["inventory"],
    capabilities: new Set(["inventory.operate"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

describe("FLOW04-001 · InventoryService.planConsumptionFromProduction T1", () => {
  afterEach(() => {
    __resetFlow04EvidenceForTests();
    __resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("emits T1_STARTED then T1_COMPLETED → status=planned · no stock API", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-1", {
      deliveryDate: "2026-08-02",
      dishes: [{ dishId: "dish-1", portions: 2 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.25,
          unit: "kg",
        },
      ],
    });

    const consumption = await InventoryService.planConsumptionFromProduction(
      ctx(),
      { deliveryDate: "2026-08-02" },
    );

    expect(consumption.status).toBe("planned");
    expect(consumption.lines).toHaveLength(1);
    expect(consumption.lines[0]?.qty).toBe(0.5);
    expect(getObservedFlow04Steps()).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-04]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW04_T"));
    expect(flowTokens).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
    ]);
    expect(flowTokens.some((t) => t.startsWith("FLOW04_T2"))).toBe(false);
    expect(flowTokens.some((t) => t.includes("T3"))).toBe(false);
  });

  it("does not emit FLOW04 tokens when production source missing", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(
      InventoryService.planConsumptionFromProduction(ctx(), {
        deliveryDate: "2026-08-02",
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow04Steps()).toEqual([]);
  });

  it("does not emit when capability missing", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(
      InventoryService.planConsumptionFromProduction(
        ctx({ capabilities: new Set() }),
        { deliveryDate: "2026-08-02" },
      ),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow04Steps()).toEqual([]);
  });

  it("idempotent: second plan returns existing and re-emits T1 once per call pipeline", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-1", {
      deliveryDate: "2026-08-02",
      dishes: [{ dishId: "dish-1", portions: 1 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 1,
          unit: "kg",
        },
      ],
    });

    const first = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-08-02",
    });
    __resetFlow04EvidenceForTests();
    const second = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-08-02",
    });

    expect(second.id).toBe(first.id);
    expect(second.status).toBe("planned");
    expect(getObservedFlow04Steps()).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
    ]);
  });
});
