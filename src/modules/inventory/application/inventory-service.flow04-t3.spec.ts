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

function ctx(): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-1",
    tenantId: "tenant-1",
    roles: ["inventory"],
    capabilities: new Set(["inventory.operate"]),
    localization: null,
    ip: null,
  };
}

async function planAndApply(): Promise<string> {
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
  const planned = await InventoryService.planConsumptionFromProduction(ctx(), {
    deliveryDate: "2026-08-02",
  });
  const applied = await InventoryService.applyConsumption(ctx(), planned.id);
  expect(applied.status).toBe("applied");
  return applied.id;
}

describe("FLOW04-003 · InventoryService.sealConsumption T3", () => {
  afterEach(() => {
    __resetFlow04EvidenceForTests();
    __resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("emits T3_STARTED then T3_COMPLETED · applied → sealed · stock stable", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const id = await planAndApply();
    const before = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );

    const sealed = await InventoryService.sealConsumption(ctx(), id);
    expect(sealed.status).toBe("sealed");

    const after = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(after).toBe(before);

    expect(getObservedFlow04Steps()).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
      "FLOW04_T2_STARTED",
      "FLOW04_T2_COMPLETED",
      "FLOW04_T3_STARTED",
      "FLOW04_T3_COMPLETED",
    ]);

    const flowTokens = info.mock.calls
      .filter((c) => c[0] === "[FLOW-04]")
      .map((c) => String(c[1]))
      .filter((t) => t.startsWith("FLOW04_T"));
    expect(flowTokens.filter((t) => t === "FLOW04_T3_COMPLETED")).toHaveLength(
      1,
    );
  });

  it("idempotent seal does not mutate stock", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const id = await planAndApply();
    await InventoryService.sealConsumption(ctx(), id);
    const mid = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    await InventoryService.sealConsumption(ctx(), id);
    const end = await createInventoryRepository({}, "tenant-1").getStock(
      "tenant-1",
      "ing-1",
    );
    expect(end).toBe(mid);
  });

  it("rejects T3 without T2 COMPLETED", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-1", {
      deliveryDate: "2026-08-02",
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
    __seedStock("tenant-1", "i", 5);
    const planned = await InventoryService.planConsumptionFromProduction(
      ctx(),
      { deliveryDate: "2026-08-02" },
    );
    // Only T1 in pipeline — apply via repo to get applied without T2 tokens
    __resetFlow04EvidenceForTests();
    beginFlow04Pipeline({});
    logFlow04Step("FLOW04_T1_STARTED");
    logFlow04Step("FLOW04_T1_COMPLETED");
    // Force status applied without T2 evidence
    const repo = createInventoryRepository({}, "tenant-1");
    await repo.applyConsumption({
      tenantId: "tenant-1",
      consumptionId: planned.id,
    });
    await expect(
      InventoryService.sealConsumption(ctx(), planned.id),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
