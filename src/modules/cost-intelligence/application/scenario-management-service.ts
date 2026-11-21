/**
 * YOURMEAL OS — SCENARIO MANAGEMENT SERVICE (CR-COST-03)
 * Subsystem: Platform Core (Cost Intelligence)
 * Orchestrates creation, persistence, simulation, and archiving of What-If scenarios.
 * Strict Invariant: Zero writes to operational catalog, inventory, or billing tables.
 */

import { ServiceContext } from "@/services/types";
import { DomainError, permissionDenied } from "@/domain/errors";
import { FeatureFlagService } from "@/services/feature-flag-service";
import { PILOT_ADMIN_MODULE_FLAGS } from "@/lib/pilot-feature-flags";
import { CostBaselineSnapshot, HypotheticalVariables, ScenarioResult } from "../domain/types";
import { CostSimulationScenarioRecord, ScenarioPresetType, ScenarioStatus } from "../domain/scenario-types";
import { ScenarioRepository, SupabaseScenarioRepository } from "../infrastructure/scenario-repository";
import { simulateScenario } from "../domain/cost-simulation-engine";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertCostIntelligencePermission(ctx: ServiceContext): void {
  const hasPerm =
    ctx.capabilities.has("ingredients.read") ||
    ctx.capabilities.has("inventory.operate") ||
    ctx.roles.includes("saas_admin") ||
    ctx.roles.includes("operations_manager");

  if (!hasPerm) {
    throw permissionDenied("ingredients.read");
  }
}

export interface CreateScenarioInput {
  name: string;
  description?: string;
  presetType?: ScenarioPresetType;
  baselineSnapshot: CostBaselineSnapshot;
  appliedVariables: HypotheticalVariables;
}

export class ScenarioManagementService {
  constructor(
    private readonly repositoryFactory: (ctx: ServiceContext) => ScenarioRepository = (ctx) =>
      new SupabaseScenarioRepository(ctx.supabase),
    private readonly isModuleEnabled: (ctx: ServiceContext) => Promise<boolean> = async (ctx) => {
      if (typeof ctx.supabase?.from !== "function") return true;
      return FeatureFlagService.isEnabled(ctx, PILOT_ADMIN_MODULE_FLAGS.costIntelligence);
    },
  ) {}

  private async assertCostIntelligenceModuleEnabled(ctx: ServiceContext): Promise<void> {
    const enabled = await this.isModuleEnabled(ctx);
    if (!enabled) {
      throw new DomainError(
        "PERMISSION_DENIED",
        "El módulo Cost Intelligence está desactivado para este tenant (modo solo lectura).",
      );
    }
  }

  /**
   * Builds and persists a simulated scenario against a frozen baseline snapshot.
   */
  async createAndSimulateScenario(
    ctx: ServiceContext,
    input: CreateScenarioInput,
  ): Promise<CostSimulationScenarioRecord> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);
    await this.assertCostIntelligenceModuleEnabled(ctx);

    const repo = this.repositoryFactory(ctx);
    const tempId = `scenario-${Date.now()}`;

    // 1. Run simulation math in pure domain engine (Zero operational mutations)
    const simulationResult = simulateScenario(input.baselineSnapshot, input.appliedVariables, {
      scenarioId: tempId,
      name: input.name,
      description: input.description,
    });

    // 2. Persist scenario with frozen baseline snapshot
    const record = await repo.createScenario({
      tenantId: ctx.tenantId,
      name: input.name,
      description: input.description,
      presetType: input.presetType ?? "custom",
      baselineSnapshotId: input.baselineSnapshot.snapshotId,
      baselineSnapshot: input.baselineSnapshot,
      appliedVariables: input.appliedVariables,
      simulationResult,
      status: "simulated",
      createdBy: ctx.userId,
    });

    return record;
  }

  async listScenarios(
    ctx: ServiceContext,
    status?: ScenarioStatus,
  ): Promise<CostSimulationScenarioRecord[]> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return repo.listScenariosByTenant(ctx.tenantId, status);
  }

  async getScenario(
    ctx: ServiceContext,
    scenarioId: string,
  ): Promise<CostSimulationScenarioRecord | null> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return repo.getScenarioById(scenarioId, ctx.tenantId);
  }

  async archiveScenario(
    ctx: ServiceContext,
    scenarioId: string,
  ): Promise<void> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);
    await this.assertCostIntelligenceModuleEnabled(ctx);

    const repo = this.repositoryFactory(ctx);
    await repo.archiveScenario(scenarioId, ctx.tenantId);
  }
}
