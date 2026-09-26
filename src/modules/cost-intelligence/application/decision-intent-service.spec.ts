import { describe, it, expect } from "vitest";
import { DecisionIntentService } from "./decision-intent-service";
import { CostDecisionIntentRecord, CostSimulationScenarioRecord } from "../domain/scenario-types";
import { ScenarioRepository } from "../infrastructure/scenario-repository";
import { ServiceContext } from "@/services/types";

describe("DecisionIntentService (CR-COST-03)", () => {
  const createMockRepo = () => {
    const storedScenarios: CostSimulationScenarioRecord[] = [
      {
        id: "sc-001",
        tenantId: "tenant-eatclean-1",
        name: "Salmon Spike Scenario",
        presetType: "item_inflation",
        baselineSnapshotId: "snap-01",
        baselineSnapshot: {} as any,
        appliedVariables: {},
        status: "simulated",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const storedIntents: CostDecisionIntentRecord[] = [];

    const repo: ScenarioRepository = {
      createScenario: async () => ({} as any),
      getScenarioById: async (id, tenantId) => {
        return storedScenarios.find((s) => s.id === id && s.tenantId === tenantId) ?? null;
      },
      listScenariosByTenant: async () => storedScenarios,
      updateScenarioResult: async () => ({} as any),
      archiveScenario: async () => {},
      createDecisionIntent: async (i) => {
        const record: CostDecisionIntentRecord = {
          ...i,
          id: `intent-uuid-${storedIntents.length + 1}`,
          recordedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storedIntents.push(record);
        return record;
      },
      listIntentsByScenario: async (scenarioId, tenantId) => {
        return storedIntents.filter((i) => i.scenarioId === scenarioId && i.tenantId === tenantId);
      },
      listIntentsByTenant: async (tenantId) => {
        return storedIntents.filter((i) => i.tenantId === tenantId);
      },
      updateIntentStatus: async (id, tenantId, status) => {
        const item = storedIntents.find((i) => i.id === id && i.tenantId === tenantId);
        if (!item) throw new Error("Intent not found");
        item.status = status;
        item.updatedAt = new Date().toISOString();
        return item;
      },
    };

    return { repo, storedScenarios, storedIntents };
  };

  const createMockCtx = (tenantId = "tenant-eatclean-1"): ServiceContext => ({
    tenantId,
    userId: "user-manager-01",
    roles: ["operations_manager"],
    capabilities: new Set(["inventory.operate"]),
    supabase: {} as any,
  });

  it("records a qualitative decision intent linked to a scenario", async () => {
    const { repo, storedIntents } = createMockRepo();
    const service = new DecisionIntentService(() => repo);
    const ctx = createMockCtx();

    const intent = await service.recordDecisionIntent(ctx, {
      scenarioId: "sc-001",
      intentType: "renegotiate_supplier",
      targetEntityType: "supplier",
      targetEntityId: "sup-fresh-fish",
      rationale: "Reunión con distribuidor de pescado para fijar precio a 11.50€/kg",
      plannedEffectiveDate: "2026-10-01",
    });

    expect(intent.id).toBeDefined();
    expect(intent.status).toBe("pending_action");
    expect(intent.intentType).toBe("renegotiate_supplier");
    expect(intent.rationale).toBe("Reunión con distribuidor de pescado para fijar precio a 11.50€/kg");
    expect(storedIntents).toHaveLength(1);
  });

  it("throws when trying to record intent for non-existent scenario or cross-tenant scenario", async () => {
    const { repo } = createMockRepo();
    const service = new DecisionIntentService(() => repo);
    const ctx = createMockCtx("tenant-other");

    await expect(
      service.recordDecisionIntent(ctx, {
        scenarioId: "sc-001", // exists in tenant-eatclean-1, not tenant-other
        intentType: "adjust_menu_price",
        rationale: "Increase menu price by 1€",
      }),
    ).rejects.toThrow("Scenario sc-001 not found");
  });

  it("updates intent status to completed_manually", async () => {
    const { repo } = createMockRepo();
    const service = new DecisionIntentService(() => repo);
    const ctx = createMockCtx();

    const intent = await service.recordDecisionIntent(ctx, {
      scenarioId: "sc-001",
      intentType: "reformulate_recipe",
      rationale: "Ajustar receta cambiando ingrediente",
    });

    const updated = await service.updateIntentStatus(ctx, intent.id, "completed_manually");
    expect(updated.status).toBe("completed_manually");
  });
});
