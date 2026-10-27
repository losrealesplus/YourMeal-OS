import { afterEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import { InventoryService } from "./inventory-service";
import {
  __resetFlow04EvidenceForTests,
  getObservedFlow04Steps,
  isFlow04PipelineActive,
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
    userId: "user-kitchen",
    tenantId: "tenant-eatclean",
    roles: ["kitchen", "inventory"],
    capabilities: new Set(["kitchen.operate", "inventory.operate"]),
    localization: null,
    ip: null,
    ...overrides,
  };
}

describe("FLOW-04 UI V1 · Session Recovery & Safe Pipeline Persistence", () => {
  afterEach(() => {
    __resetFlow04EvidenceForTests();
    __resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("getConsumptionByDate returns null when no plan exists", async () => {
    const consumption = await InventoryService.getConsumptionByDate(ctx(), "2026-10-27");
    expect(consumption).toBeNull();
    expect(isFlow04PipelineActive()).toBe(false);
  });

  it("allows page reload between T1 and T2 via sessionRecovery", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-eatclean", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-1", portions: 2 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-eatclean", "ing-1", 10);

    // Step 1: User plans consumption (T1)
    const planned = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-10-27",
    });
    expect(planned.status).toBe("planned");

    // Simulating browser page reload: module memory is wiped
    __resetFlow04EvidenceForTests();
    expect(isFlow04PipelineActive()).toBe(false);

    // Step 2: Page reloads, calls getConsumptionByDate
    const recovered = await InventoryService.getConsumptionByDate(ctx(), "2026-10-27");
    expect(recovered).not.toBeNull();
    expect(recovered?.id).toBe(planned.id);
    expect(isFlow04PipelineActive()).toBe(true);
    expect(getObservedFlow04Steps()).toContain("FLOW04_T1_COMPLETED");

    // Step 3: User applies consumption (T2)
    const applied = await InventoryService.applyConsumption(ctx(), planned.id, {
      sessionRecovery: true,
    });
    expect(applied.status).toBe("applied");

    // Verify stock decremented
    const repo = createInventoryRepository({}, "tenant-eatclean");
    const stockAfter = await repo.getStock("tenant-eatclean", "ing-1");
    expect(stockAfter).toBe(9); // 10 - (0.5 * 2)
  });

  it("allows page reload between T2 and T3 via sessionRecovery", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-eatclean", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-1", portions: 2 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-eatclean", "ing-1", 10);

    // T1 + T2
    const planned = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-10-27",
    });
    const applied = await InventoryService.applyConsumption(ctx(), planned.id);
    expect(applied.status).toBe("applied");

    // Simulating browser page reload
    __resetFlow04EvidenceForTests();
    expect(isFlow04PipelineActive()).toBe(false);

    // Page reloads, recovers state
    const recovered = await InventoryService.getConsumptionByDate(ctx(), "2026-10-27");
    expect(recovered?.status).toBe("applied");

    // User seals consumption (T3)
    const sealed = await InventoryService.sealConsumption(ctx(), planned.id, {
      sessionRecovery: true,
    });
    expect(sealed.status).toBe("sealed");
    expect(getObservedFlow04Steps()).toContain("FLOW04_T3_COMPLETED");
  });

  it("direct applyConsumption with sessionRecovery resumes if pipeline was empty", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-eatclean", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-1", portions: 1 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-eatclean", "ing-1", 5);

    const planned = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-10-27",
    });

    // Wipe memory
    __resetFlow04EvidenceForTests();

    // Call apply with sessionRecovery: true directly (e.g. without getConsumptionByDate)
    const applied = await InventoryService.applyConsumption(ctx(), planned.id, {
      sessionRecovery: true,
    });
    expect(applied.status).toBe("applied");
  });

  it("enforces context binding: tenant A pipeline does not leak into tenant B", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-eatclean", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-1", portions: 2 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-eatclean", "ing-1", 10);

    const plannedA = await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-10-27",
    });
    expect(plannedA.status).toBe("planned");

    // Foreign context (Tenant B)
    const ctxB = ctx({ tenantId: "tenant-foreign-b" });
    __seedProductionPlanInput("tenant-foreign-b", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-b", portions: 1 }],
      recipes: [
        {
          dishId: "dish-b",
          ingredientId: "ing-b",
          ingredientName: "Arroz",
          qty: 1,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-foreign-b", "ing-b", 5);

    // Switching to Tenant B where no consumption is planned for that date resets/clears active pipeline
    const noConsB = await InventoryService.getConsumptionByDate(ctxB, "2026-10-27");
    expect(noConsB).toBeNull();
    expect(isFlow04PipelineActive({ tenantId: "tenant-foreign-b" })).toBe(false);

    // Tenant B planning creates its own isolated pipeline bound to tenant B
    const plannedB = await InventoryService.planConsumptionFromProduction(ctxB, {
      deliveryDate: "2026-10-27",
    });
    expect(plannedB.status).toBe("planned");
    expect(isFlow04PipelineActive({ tenantId: "tenant-foreign-b" })).toBe(true);
    expect(isFlow04PipelineActive({ tenantId: "tenant-eatclean" })).toBe(false);
  });

  it("enforces date context binding: switching date isolates evidence", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    __seedProductionPlanInput("tenant-eatclean", {
      deliveryDate: "2026-10-27",
      dishes: [{ dishId: "dish-1", portions: 2 }],
      recipes: [
        {
          dishId: "dish-1",
          ingredientId: "ing-1",
          ingredientName: "Pollo",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    __seedStock("tenant-eatclean", "ing-1", 10);

    await InventoryService.planConsumptionFromProduction(ctx(), {
      deliveryDate: "2026-10-27",
    });

    // Query another date with no plan
    const otherDate = await InventoryService.getConsumptionByDate(ctx(), "2026-10-28");
    expect(otherDate).toBeNull();
    expect(isFlow04PipelineActive({ deliveryDate: "2026-10-28" })).toBe(false);
  });
});
