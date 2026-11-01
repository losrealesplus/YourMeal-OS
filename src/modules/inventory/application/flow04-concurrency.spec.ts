/**
 * FLOW04 Concurrency & Context Isolation Test Suite
 *
 * Verifies strict execution isolation between concurrent operations across tenants/dates:
 * - Case A (Overlapped T1): Iniciar T1 A, Iniciar T1 B, resolver A, resolver B.
 * - Case B (Reverse Order): Iniciar A y B, resolver B, resolver A.
 * - Case C (Late Failure): Iniciar A y B, rechazar A. Fallo y STOP de A no cierran ni contaminan B.
 * - Case D (Recovery): Recuperar plan en Tenant A Fecha 1, cambiar a Tenant B Fecha 2, recuperar plan en B. T2/T3 actúan estrictamente en el contexto previsto.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryService } from "./inventory-service";
import {
  __resetFlow04EvidenceForTests,
  getObservedFlow04Steps,
  isFlow04PipelineActive,
} from "./flow04-evidence";
import * as repoModule from "../infrastructure/inventory-repository";
import type { ServiceContext } from "@/services/types";

function createDeferred<T>() {
  let resolve!: (val: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeCtx(tenantId: string): ServiceContext {
  return {
    supabase: {} as ServiceContext["supabase"],
    userId: `user-${tenantId}`,
    tenantId,
    roles: ["inventory"],
    capabilities: new Set(["inventory.operate"]),
    localization: null,
    ip: null,
  };
}

describe("FLOW-04 Concurrency & Multi-Tenant Pipeline Isolation", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    __resetFlow04EvidenceForTests();
    repoModule.__resetInventoryStoreForTests();
  });

  afterEach(() => {
    __resetFlow04EvidenceForTests();
    repoModule.__resetInventoryStoreForTests();
    vi.restoreAllMocks();
  });

  it("Case A (Overlapped T1): Iniciar T1 A, Iniciar T1 B, resolver A, resolver B", async () => {
    const ctxA = makeCtx("tenant-alpha");
    const ctxB = makeCtx("tenant-beta");

    repoModule.__seedProductionPlanInput("tenant-alpha", {
      deliveryDate: "2026-11-01",
      dishes: [{ dishId: "dish-a", portions: 2 }],
      recipes: [
        { dishId: "dish-a", ingredientId: "ing-a", ingredientName: "Pollo", qty: 0.5, unit: "kg" },
      ],
    });
    repoModule.__seedProductionPlanInput("tenant-beta", {
      deliveryDate: "2026-11-02",
      dishes: [{ dishId: "dish-b", portions: 4 }],
      recipes: [
        { dishId: "dish-b", ingredientId: "ing-b", ingredientName: "Arroz", qty: 0.25, unit: "kg" },
      ],
    });

    const deferredA = createDeferred<void>();
    const deferredB = createDeferred<void>();

    const realCreateRepo = repoModule.createInventoryRepository;
    vi.spyOn(repoModule, "createInventoryRepository").mockImplementation((supabase, tenantId) => {
      const real = realCreateRepo(supabase, tenantId);
      return {
        ...real,
        createPlanned: async (input) => {
          if (tenantId === "tenant-alpha") {
            await deferredA.promise;
          } else if (tenantId === "tenant-beta") {
            await deferredB.promise;
          }
          return real.createPlanned(input);
        },
      };
    });

    // Iniciar T1 A (suspends before DB commit)
    const promiseA = InventoryService.planConsumptionFromProduction(ctxA, {
      deliveryDate: "2026-11-01",
    });
    await new Promise((r) => setTimeout(r, 10));

    // Iniciar T1 B (suspends before DB commit)
    const promiseB = InventoryService.planConsumptionFromProduction(ctxB, {
      deliveryDate: "2026-11-02",
    });
    await new Promise((r) => setTimeout(r, 10));

    // Both pipelines exist independently and are active
    expect(isFlow04PipelineActive({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" })).toBe(
      true,
    );
    expect(isFlow04PipelineActive({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toBe(
      true,
    );

    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual(["FLOW04_T1_STARTED"]);
    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED"],
    );

    // Resolver A first
    deferredA.resolve();
    const plannedA = await promiseA;
    expect(plannedA.status).toBe("planned");
    expect(plannedA.tenantId).toBe("tenant-alpha");

    // A completed T1
    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
    // B is still suspended at T1_STARTED with no contamination
    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED"],
    );

    // Resolver B second
    deferredB.resolve();
    const plannedB = await promiseB;
    expect(plannedB.status).toBe("planned");
    expect(plannedB.tenantId).toBe("tenant-beta");

    // Both completed T1 with completely isolated context and steps
    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"],
    );
    expect(plannedA.id).not.toBe(plannedB.id);
  });

  it("Case B (Reverse Order): Iniciar A y B, resolver B, resolver A", async () => {
    const ctxA = makeCtx("tenant-alpha");
    const ctxB = makeCtx("tenant-beta");

    repoModule.__seedProductionPlanInput("tenant-alpha", {
      deliveryDate: "2026-11-01",
      dishes: [{ dishId: "dish-a", portions: 1 }],
      recipes: [
        { dishId: "dish-a", ingredientId: "ing-a", ingredientName: "Pollo", qty: 1, unit: "kg" },
      ],
    });
    repoModule.__seedProductionPlanInput("tenant-beta", {
      deliveryDate: "2026-11-02",
      dishes: [{ dishId: "dish-b", portions: 1 }],
      recipes: [
        { dishId: "dish-b", ingredientId: "ing-b", ingredientName: "Arroz", qty: 1, unit: "kg" },
      ],
    });

    const deferredA = createDeferred<void>();
    const deferredB = createDeferred<void>();

    const realCreateRepo = repoModule.createInventoryRepository;
    vi.spyOn(repoModule, "createInventoryRepository").mockImplementation((supabase, tenantId) => {
      const real = realCreateRepo(supabase, tenantId);
      return {
        ...real,
        createPlanned: async (input) => {
          if (tenantId === "tenant-alpha") {
            await deferredA.promise;
          } else if (tenantId === "tenant-beta") {
            await deferredB.promise;
          }
          return real.createPlanned(input);
        },
      };
    });

    const promiseA = InventoryService.planConsumptionFromProduction(ctxA, {
      deliveryDate: "2026-11-01",
    });
    await new Promise((r) => setTimeout(r, 10));

    const promiseB = InventoryService.planConsumptionFromProduction(ctxB, {
      deliveryDate: "2026-11-02",
    });
    await new Promise((r) => setTimeout(r, 10));

    // Resolve B FIRST (reverse completion order)
    deferredB.resolve();
    const plannedB = await promiseB;
    expect(plannedB.status).toBe("planned");

    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"],
    );
    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual(["FLOW04_T1_STARTED"]);

    // Now resolve A
    deferredA.resolve();
    const plannedA = await promiseA;
    expect(plannedA.status).toBe("planned");

    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual(["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED"]);
  });

  it("Case C (Late Failure): Iniciar A y B, rechazar A. Fallo de A no afecta ni cierra B", async () => {
    const ctxA = makeCtx("tenant-alpha");
    const ctxB = makeCtx("tenant-beta");

    repoModule.__seedProductionPlanInput("tenant-alpha", {
      deliveryDate: "2026-11-01",
      dishes: [{ dishId: "dish-a", portions: 1 }],
      recipes: [
        { dishId: "dish-a", ingredientId: "ing-a", ingredientName: "Pollo", qty: 1, unit: "kg" },
      ],
    });
    repoModule.__seedProductionPlanInput("tenant-beta", {
      deliveryDate: "2026-11-02",
      dishes: [{ dishId: "dish-b", portions: 1 }],
      recipes: [
        { dishId: "dish-b", ingredientId: "ing-b", ingredientName: "Arroz", qty: 1, unit: "kg" },
      ],
    });
    repoModule.__seedStock("tenant-beta", "ing-b", 10);

    const deferredA = createDeferred<void>();
    const deferredB = createDeferred<void>();

    const realCreateRepo = repoModule.createInventoryRepository;
    vi.spyOn(repoModule, "createInventoryRepository").mockImplementation((supabase, tenantId) => {
      const real = realCreateRepo(supabase, tenantId);
      return {
        ...real,
        createPlanned: async (input) => {
          if (tenantId === "tenant-alpha") {
            await deferredA.promise;
            throw new Error("PostgreSQL deadlock on Tenant A");
          } else if (tenantId === "tenant-beta") {
            await deferredB.promise;
          }
          return real.createPlanned(input);
        },
      };
    });

    const promiseA = InventoryService.planConsumptionFromProduction(ctxA, {
      deliveryDate: "2026-11-01",
    });
    await new Promise((r) => setTimeout(r, 10));

    const promiseB = InventoryService.planConsumptionFromProduction(ctxB, {
      deliveryDate: "2026-11-02",
    });
    await new Promise((r) => setTimeout(r, 10));

    // Reject A
    deferredA.resolve(); // trigger the throw inside createPlanned
    await expect(promiseA).rejects.toThrow("PostgreSQL deadlock on Tenant A");

    // Pipeline A is terminated and closed
    expect(isFlow04PipelineActive({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" })).toBe(
      false,
    );

    // Crucial invariant: Pipeline B is STILL ACTIVE and completely unpolluted!
    expect(isFlow04PipelineActive({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toBe(
      true,
    );
    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED"],
    );

    // B completes T1 normally
    deferredB.resolve();
    const plannedB = await promiseB;
    expect(plannedB.status).toBe("planned");

    // B successfully transitions through T2
    const appliedB = await InventoryService.applyConsumption(ctxB, plannedB.id);
    expect(appliedB.status).toBe("applied");

    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED", "FLOW04_T2_STARTED", "FLOW04_T2_COMPLETED"],
    );
  });

  it("Case D (Recovery): Recuperar plan en Tenant A Fecha 1, cambiar a Tenant B Fecha 2, aislar T2/T3", async () => {
    const ctxA = makeCtx("tenant-alpha");
    const ctxB = makeCtx("tenant-beta");

    // Seed production and plan for Tenant A
    repoModule.__seedProductionPlanInput("tenant-alpha", {
      deliveryDate: "2026-11-01",
      dishes: [{ dishId: "dish-a", portions: 2 }],
      recipes: [
        { dishId: "dish-a", ingredientId: "ing-a", ingredientName: "Pollo", qty: 1, unit: "kg" },
      ],
    });
    repoModule.__seedStock("tenant-alpha", "ing-a", 20);
    const plannedA = await InventoryService.planConsumptionFromProduction(ctxA, {
      deliveryDate: "2026-11-01",
    });

    // Seed production and plan for Tenant B
    repoModule.__seedProductionPlanInput("tenant-beta", {
      deliveryDate: "2026-11-02",
      dishes: [{ dishId: "dish-b", portions: 3 }],
      recipes: [
        { dishId: "dish-b", ingredientId: "ing-b", ingredientName: "Arroz", qty: 1, unit: "kg" },
      ],
    });
    repoModule.__seedStock("tenant-beta", "ing-b", 15);
    const plannedB = await InventoryService.planConsumptionFromProduction(ctxB, {
      deliveryDate: "2026-11-02",
    });

    // Simulate page reload: clear in-memory evidence
    __resetFlow04EvidenceForTests();

    // Recover Tenant A on Date 1
    const recoveredA = await InventoryService.getConsumptionByDate(ctxA, "2026-11-01");
    expect(recoveredA?.id).toBe(plannedA.id);
    expect(isFlow04PipelineActive({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" })).toBe(
      true,
    );

    // Switch context to Tenant B on Date 2
    const recoveredB = await InventoryService.getConsumptionByDate(ctxB, "2026-11-02");
    expect(recoveredB?.id).toBe(plannedB.id);
    expect(isFlow04PipelineActive({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toBe(
      true,
    );

    // Execute T2 on Tenant B Date 2
    const appliedB = await InventoryService.applyConsumption(ctxB, plannedB.id);
    expect(appliedB.status).toBe("applied");

    // Tenant B stock decremented from 15 to 12
    expect(
      await (
        await repoModule.createInventoryRepository({}, "tenant-beta")
      ).getStock("tenant-beta", "ing-b"),
    ).toBe(12);
    // Tenant A stock untouched at 20
    expect(
      await (
        await repoModule.createInventoryRepository({}, "tenant-alpha")
      ).getStock("tenant-alpha", "ing-a"),
    ).toBe(20);

    // Now execute T2 and T3 on Tenant A Date 1
    const appliedA = await InventoryService.applyConsumption(ctxA, plannedA.id);
    expect(appliedA.status).toBe("applied");
    const sealedA = await InventoryService.sealConsumption(ctxA, plannedA.id);
    expect(sealedA.status).toBe("sealed");

    // Tenant A stock decremented from 20 to 18
    expect(
      await (
        await repoModule.createInventoryRepository({}, "tenant-alpha")
      ).getStock("tenant-alpha", "ing-a"),
    ).toBe(18);

    // Steps are strictly isolated
    expect(getObservedFlow04Steps({ tenantId: "tenant-beta", deliveryDate: "2026-11-02" })).toEqual(
      ["FLOW04_T1_STARTED", "FLOW04_T1_COMPLETED", "FLOW04_T2_STARTED", "FLOW04_T2_COMPLETED"],
    );
    expect(
      getObservedFlow04Steps({ tenantId: "tenant-alpha", deliveryDate: "2026-11-01" }),
    ).toEqual([
      "FLOW04_T1_STARTED",
      "FLOW04_T1_COMPLETED",
      "FLOW04_T2_STARTED",
      "FLOW04_T2_COMPLETED",
      "FLOW04_T3_STARTED",
      "FLOW04_T3_COMPLETED",
    ]);
  });
});
