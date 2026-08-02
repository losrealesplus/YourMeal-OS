import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { InventoryService } from "./inventory-service";
import {
  __resetFlow04EvidenceForTests,
  beginFlow04Pipeline,
  getObservedFlow04Steps,
  logFlow04Step,
} from "./flow04-evidence";
import {
  __resetInventoryStoreForTests,
  __seedProductionPlanInput,
  __seedStock,
  createInventoryRepository,
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

function seedT1Prefix() {
  beginFlow04Pipeline({ test: "flow04-002" });
  logFlow04Step("FLOW04_T1_STARTED");
  logFlow04Step("FLOW04_T1_COMPLETED");
}

async function planWithStock(): Promise<string> {
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
  __seedStock("tenant-1", "ing-1", 10);
  // Plan emits its own pipeline — use real T1 then keep pipeline for T2
  const planned = await InventoryService.planConsumptionFromProduction(ctx(), {
    deliveryDate: "2026-08-02",
  });
  return planned.id;
}

describe("FLOW04-002 · InventoryService.applyConsumption T2", () => {
  afterEach(() => {
    __resetFlow04EvidenceForTests();
    __resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("emits T2_STARTED then T2_COMPLETED · planned → applied · stock decremented", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const id = await planWithStock();
    const before = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(before).toBe(10);

    const applied = await InventoryService.applyConsumption(ctx(), id);
    expect(applied.status).toBe("applied");

    const after = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(after).toBe(9.5); // 10 - (0.25 * 2)

    expect(getObservedFlow04Steps()).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
      "FLOW04_T2_STARTED",
      "FLOW04_T2_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-04]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW04_T"));
    expect(flowTokens.filter((t) => t.startsWith("FLOW04_T3"))).toEqual([]);
  });

  it("FLOW04-I2 · second apply does not double-decrement stock", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const id = await planWithStock();
    await InventoryService.applyConsumption(ctx(), id);
    const mid = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    await InventoryService.applyConsumption(ctx(), id);
    const end = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(end).toBe(mid);
    expect(end).toBe(9.5);
  });

  it("FLOW04-I3 · rejects apply when stock would go negative", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-1", {
      deliveryDate: "2026-08-02",
      dishes: [{ dishId: "dish-1", portions: 10 }],
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
    __seedStock("tenant-1", "ing-1", 2); // need 10
    const planned = await InventoryService.planConsumptionFromProduction(
      ctx(),
      { deliveryDate: "2026-08-02" },
    );
    await expect(
      InventoryService.applyConsumption(ctx(), planned.id),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
      message: "insufficient_stock",
    });
    const stockLeft = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(stockLeft).toBe(2);
  });

  it("rejects T2 without T1 COMPLETED", async () => {
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
    __seedStock("tenant-1", "ing-1", 5);
    // Create planned via repo without evidence pipeline
    const repo = createInventoryRepository({}, "tenant-1");
    const planned = await repo.createPlanned({
      tenantId: "tenant-1",
      deliveryDate: "2026-08-02",
      lines: [{ ingredientId: "ing-1", name: "Pollo", qty: 1, unit: "kg" }],
    });
    __resetFlow04EvidenceForTests();
    await expect(
      InventoryService.applyConsumption(ctx(), planned.id),
    ).rejects.toBeInstanceOf(DomainError);
    expect(getObservedFlow04Steps()).toEqual([]);
  });

  it("seed helper still allows isolated T2 token check", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    seedT1Prefix();
    __seedProductionPlanInput("tenant-1", {
      deliveryDate: "2026-08-03",
      dishes: [{ dishId: "d", portions: 1 }],
      recipes: [
        {
          dishId: "d",
          ingredientId: "i",
          ingredientName: "X",
          qty: 1,
          unit: "u",
        },
      ],
    });
    // Direct create without T1 service (pipeline already has T1)
    const repo = createInventoryRepository({}, "tenant-1");
    const planned = await repo.createPlanned({
      tenantId: "tenant-1",
      deliveryDate: "2026-08-03",
      lines: [{ ingredientId: "i", name: "X", qty: 1, unit: "u" }],
    });
    __seedStock("tenant-1", "i", 5);
    const applied = await InventoryService.applyConsumption(ctx(), planned.id);
    expect(applied.status).toBe("applied");
    expect(getObservedFlow04Steps()).toContain("FLOW04_T2_COMPLETED");
  });
});
