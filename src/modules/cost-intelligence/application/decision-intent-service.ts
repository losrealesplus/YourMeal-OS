/**
 * YOURMEAL OS — DECISION INTENT SERVICE (CR-COST-03)
 * Subsystem: Platform Core (Cost Intelligence)
 * Manages operator qualitative action intents linked to What-If scenarios.
 * Strict Invariant: Decision Intent != Operational Command.
 * Registering an intent never triggers automatic catalog price updates or stock mutations.
 */

import { ServiceContext } from "@/services/types";
import { DomainError, permissionDenied } from "@/domain/errors";
import {
  CostDecisionIntentRecord,
  DecisionIntentStatus,
  DecisionIntentType,
} from "../domain/scenario-types";
import { ScenarioRepository, SupabaseScenarioRepository } from "../infrastructure/scenario-repository";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertCostIntelligencePermission(ctx: ServiceContext): void {
  const hasPerm =
    ctx.capabilities.has("inventory.operate") ||
    ctx.roles.includes("saas_admin") ||
    ctx.roles.includes("operations_manager");

  if (!hasPerm) {
    throw permissionDenied("inventory.operate");
  }
}

export interface RecordDecisionIntentInput {
  scenarioId: string;
  intentType: DecisionIntentType;
  targetEntityType?: "dish" | "supplier" | "ingredient" | "overhead" | "other";
  targetEntityId?: string;
  rationale: string;
  plannedEffectiveDate?: string;
}

export class DecisionIntentService {
  constructor(
    private readonly repositoryFactory: (ctx: ServiceContext) => ScenarioRepository = (ctx) =>
      new SupabaseScenarioRepository(ctx.supabase),
  ) {}

  /**
   * Records a qualitative decision intent taken by an operator based on simulation findings.
   */
  async recordDecisionIntent(
    ctx: ServiceContext,
    input: RecordDecisionIntentInput,
  ): Promise<CostDecisionIntentRecord> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    if (!input.rationale || input.rationale.trim().length === 0) {
      throw new DomainError("INVALID_STATE", "Rationale is required to document a decision intent.");
    }

    const repo = this.repositoryFactory(ctx);

    // Verify scenario exists in tenant boundary
    const scenario = await repo.getScenarioById(input.scenarioId, ctx.tenantId);
    if (!scenario) {
      throw new DomainError("NOT_FOUND", `Scenario ${input.scenarioId} not found in tenant context.`);
    }

    const intent = await repo.createDecisionIntent({
      tenantId: ctx.tenantId,
      scenarioId: input.scenarioId,
      intentType: input.intentType,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      rationale: input.rationale.trim(),
      plannedEffectiveDate: input.plannedEffectiveDate,
      status: "pending_action",
      recordedBy: ctx.userId,
    });

    return intent;
  }

  async listIntentsForScenario(
    ctx: ServiceContext,
    scenarioId: string,
  ): Promise<CostDecisionIntentRecord[]> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return repo.listIntentsByScenario(scenarioId, ctx.tenantId);
  }

  async listIntentsForTenant(
    ctx: ServiceContext,
  ): Promise<CostDecisionIntentRecord[]> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return repo.listIntentsByTenant(ctx.tenantId);
  }

  async updateIntentStatus(
    ctx: ServiceContext,
    intentId: string,
    status: DecisionIntentStatus,
  ): Promise<CostDecisionIntentRecord> {
    assertTenant(ctx);
    assertCostIntelligencePermission(ctx);

    const repo = this.repositoryFactory(ctx);
    return repo.updateIntentStatus(intentId, ctx.tenantId, status);
  }
}
