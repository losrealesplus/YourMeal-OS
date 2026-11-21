import { describe, it, expect } from "vitest";
import { ScenarioManagementService } from "./scenario-management-service";
import { CostBaselineSnapshot, HypotheticalVariables } from "../domain/types";
import { CostSimulationScenarioRecord } from "../domain/scenario-types";
import { ScenarioRepository } from "../infrastructure/scenario-repository";
import { ServiceContext } from "@/services/types";

describe("ScenarioManagementService (CR-COST-03)", () => {
  const sampleBaseline: CostBaselineSnapshot = {
    snapshotId: "snap-eatclean-001",
    createdAt: "2026-09-26T16:00:00Z",
    products: [
      {
        productId: "dish-poke",
        productName: "Salmon Poke Bowl",
        salesPrice: 12.00,
        monthlyVolume: 400,
        bomComponents: [
          { componentId: "ing-salmon", componentName: "Salmon", quantity: 0.15, unit: "kg", unitCost: 12.00 },
          { componentId: "ing-rice", componentName: "Rice", quantity: 0.10, unit: "kg", unitCost: 1.50 },
        ],
        overheads: { laborCost: 1.20, energyCost: 0.40, packagingCost: 0.50 },
      },
    ],
  };

  const createMockRepo = (): { repo: ScenarioRepository; storedScenarios: CostSimulationScenarioRecord[] } => {
    const storedScenarios: CostSimulationScenarioRecord[] = [];

    const repo: ScenarioRepository = {
      createScenario: async (s) => {
        const record: CostSimulationScenarioRecord = {
          ...s,
          id: `sc-uuid-${storedScenarios.length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storedScenarios.push(record);
        return record;
      },
      getScenarioById: async (id, tenantId) => {
        return storedScenarios.find((s) => s.id === id && s.tenantId === tenantId) ?? null;
      },
      listScenariosByTenant: async (tenantId, status) => {
        return storedScenarios.filter((s) => s.tenantId === tenantId && (!status || s.status === status));
      },
      updateScenarioResult: async (id, tenantId, result, status) => {
        const sc = storedScenarios.find((s) => s.id === id && s.tenantId === tenantId);
        if (!sc) throw new Error("Not found");
        sc.simulationResult = result;
        sc.status = status;
        return sc;
      },
      archiveScenario: async (id, tenantId) => {
        const sc = storedScenarios.find((s) => s.id === id && s.tenantId === tenantId);
        if (sc) sc.status = "archived";
      },
      createDecisionIntent: async () => ({} as any),
      listIntentsByScenario: async () => [],
      listIntentsByTenant: async () => [],
      updateIntentStatus: async () => ({} as any),
    };

    return { repo, storedScenarios };
  };

  const createMockCtx = (tenantId = "tenant-eatclean-1", roles = ["operations_manager"]): ServiceContext => ({
    tenantId,
    userId: "user-ops-01",
    roles: roles as any,
    capabilities: new Set(["ingredients.read", "inventory.operate"]),
    supabase: {} as any,
  });

  it("creates, simulates, and persists a What-If scenario with a frozen baseline", async () => {
    const { repo, storedScenarios } = createMockRepo();
    const service = new ScenarioManagementService(() => repo);
    const ctx = createMockCtx();

    const variables: HypotheticalVariables = {
      itemCostDeltas: { "ing-salmon": 0.25 }, // +25% salmon cost
    };

    const scenario = await service.createAndSimulateScenario(ctx, {
      name: "Salmon Inflation +25%",
      description: "Supplier price increase projection",
      presetType: "item_inflation",
      baselineSnapshot: sampleBaseline,
      appliedVariables: variables,
    });

    expect(scenario.id).toBeDefined();
    expect(scenario.status).toBe("simulated");
    expect(scenario.presetType).toBe("item_inflation");
    expect(scenario.baselineSnapshotId).toBe("snap-eatclean-001");
    expect(scenario.simulationResult).toBeDefined();
    expect(scenario.simulationResult?.products[0].simulatedCost).toBeGreaterThan(
      scenario.simulationResult?.products[0].currentCost!,
    );
    expect(storedScenarios).toHaveLength(1);
  });

  it("enforces tenant isolation: Tenant X cannot retrieve Tenant Y scenarios", async () => {
    const { repo } = createMockRepo();
    const service = new ScenarioManagementService(() => repo);

    const ctxX = createMockCtx("tenant-X");
    const ctxY = createMockCtx("tenant-Y");

    const scenarioX = await service.createAndSimulateScenario(ctxX, {
      name: "Scenario X",
      baselineSnapshot: sampleBaseline,
      appliedVariables: {},
    });

    const retrievedByY = await service.getScenario(ctxY, scenarioX.id);
    expect(retrievedByY).toBeNull();
  });

  it("archives a scenario without deleting record", async () => {
    const { repo, storedScenarios } = createMockRepo();
    const service = new ScenarioManagementService(() => repo);
    const ctx = createMockCtx();

    const scenario = await service.createAndSimulateScenario(ctx, {
      name: "Archive Test",
      baselineSnapshot: sampleBaseline,
      appliedVariables: {},
    });

    await service.archiveScenario(ctx, scenario.id);

    const listActive = await service.listScenarios(ctx, "simulated");
    expect(listActive).toHaveLength(0);

    const listArchived = await service.listScenarios(ctx, "archived");
    expect(listArchived).toHaveLength(1);
    expect(listArchived[0].status).toBe("archived");
  });

  it("throws DomainError when Cost Intelligence module is disabled for tenant upon creating scenario", async () => {
    const { repo } = createMockRepo();
    const service = new ScenarioManagementService(
      () => repo,
      async () => false, // module disabled
    );
    const ctx = createMockCtx();

    await expect(
      service.createAndSimulateScenario(ctx, {
        name: "Test Scenario",
        baselineSnapshot: sampleBaseline,
        appliedVariables: {},
      }),
    ).rejects.toThrow("El módulo Cost Intelligence está desactivado para este tenant");
  });

  it("throws DomainError when Cost Intelligence module is disabled for tenant upon archiving scenario", async () => {
    const { repo } = createMockRepo();
    const service = new ScenarioManagementService(
      () => repo,
      async () => false, // module disabled
    );
    const ctx = createMockCtx();

    await expect(service.archiveScenario(ctx, "sc-123")).rejects.toThrow(
      "El módulo Cost Intelligence está desactivado para este tenant",
    );
  });

  it("allows reading historical scenarios even when Cost Intelligence module is disabled", async () => {
    const { repo, storedScenarios } = createMockRepo();
    storedScenarios.push({
      id: "sc-historical-1",
      tenantId: "tenant-eatclean-1",
      name: "Historical Scenario",
      presetType: "custom",
      baselineSnapshotId: "snap-01",
      baselineSnapshot: sampleBaseline,
      appliedVariables: {},
      status: "simulated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const service = new ScenarioManagementService(
      () => repo,
      async () => false, // module disabled
    );
    const ctx = createMockCtx();

    const list = await service.listScenarios(ctx);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Historical Scenario");

    const single = await service.getScenario(ctx, "sc-historical-1");
    expect(single).not.toBeNull();
    expect(single?.id).toBe("sc-historical-1");
  });
});
