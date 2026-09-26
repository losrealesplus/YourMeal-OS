/**
 * YOURMEAL OS — SCENARIOS & DECISION INTENTS REPOSITORY (CR-COST-03)
 * Subsystem: Platform Core (Cost Intelligence)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  CostSimulationScenarioRecord,
  CostDecisionIntentRecord,
  ScenarioStatus,
  DecisionIntentStatus,
} from "../domain/scenario-types";

export interface ScenarioRepository {
  // Scenarios
  createScenario(
    scenario: Omit<CostSimulationScenarioRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<CostSimulationScenarioRecord>;
  getScenarioById(id: string, tenantId: string): Promise<CostSimulationScenarioRecord | null>;
  listScenariosByTenant(tenantId: string, status?: ScenarioStatus): Promise<CostSimulationScenarioRecord[]>;
  updateScenarioResult(
    id: string,
    tenantId: string,
    simulationResult: any,
    status: ScenarioStatus,
  ): Promise<CostSimulationScenarioRecord>;
  archiveScenario(id: string, tenantId: string): Promise<void>;

  // Decision Intents
  createDecisionIntent(
    intent: Omit<CostDecisionIntentRecord, "id" | "recordedAt" | "updatedAt">,
  ): Promise<CostDecisionIntentRecord>;
  listIntentsByScenario(scenarioId: string, tenantId: string): Promise<CostDecisionIntentRecord[]>;
  listIntentsByTenant(tenantId: string): Promise<CostDecisionIntentRecord[]>;
  updateIntentStatus(
    id: string,
    tenantId: string,
    status: DecisionIntentStatus,
  ): Promise<CostDecisionIntentRecord>;
}

export class SupabaseScenarioRepository implements ScenarioRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createScenario(
    scenario: Omit<CostSimulationScenarioRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<CostSimulationScenarioRecord> {
    const { data, error } = await this.supabase
      .from("cost_simulation_scenarios")
      .insert({
        tenant_id: scenario.tenantId,
        name: scenario.name,
        description: scenario.description,
        preset_type: scenario.presetType,
        baseline_snapshot_id: scenario.baselineSnapshotId,
        baseline_snapshot: scenario.baselineSnapshot,
        applied_variables: scenario.appliedVariables,
        simulation_result: scenario.simulationResult,
        status: scenario.status,
        created_by: scenario.createdBy,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create simulation scenario: ${error?.message}`);
    }

    return this.mapScenario(data);
  }

  async getScenarioById(id: string, tenantId: string): Promise<CostSimulationScenarioRecord | null> {
    const { data, error } = await this.supabase
      .from("cost_simulation_scenarios")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapScenario(data);
  }

  async listScenariosByTenant(tenantId: string, status?: ScenarioStatus): Promise<CostSimulationScenarioRecord[]> {
    let query = this.supabase
      .from("cost_simulation_scenarios")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d) => this.mapScenario(d));
  }

  async updateScenarioResult(
    id: string,
    tenantId: string,
    simulationResult: any,
    status: ScenarioStatus,
  ): Promise<CostSimulationScenarioRecord> {
    const { data, error } = await this.supabase
      .from("cost_simulation_scenarios")
      .update({
        simulation_result: simulationResult,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to update scenario result: ${error?.message}`);
    }

    return this.mapScenario(data);
  }

  async archiveScenario(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from("cost_simulation_scenarios")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to archive scenario: ${error.message}`);
    }
  }

  async createDecisionIntent(
    intent: Omit<CostDecisionIntentRecord, "id" | "recordedAt" | "updatedAt">,
  ): Promise<CostDecisionIntentRecord> {
    const { data, error } = await this.supabase
      .from("cost_decision_intents")
      .insert({
        tenant_id: intent.tenantId,
        scenario_id: intent.scenarioId,
        intent_type: intent.intentType,
        target_entity_type: intent.targetEntityType,
        target_entity_id: intent.targetEntityId,
        rationale: intent.rationale,
        planned_effective_date: intent.plannedEffectiveDate,
        status: intent.status,
        recorded_by: intent.recordedBy,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create decision intent: ${error?.message}`);
    }

    return this.mapIntent(data);
  }

  async listIntentsByScenario(scenarioId: string, tenantId: string): Promise<CostDecisionIntentRecord[]> {
    const { data, error } = await this.supabase
      .from("cost_decision_intents")
      .select("*")
      .eq("scenario_id", scenarioId)
      .eq("tenant_id", tenantId)
      .order("recorded_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d) => this.mapIntent(d));
  }

  async listIntentsByTenant(tenantId: string): Promise<CostDecisionIntentRecord[]> {
    const { data, error } = await this.supabase
      .from("cost_decision_intents")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("recorded_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d) => this.mapIntent(d));
  }

  async updateIntentStatus(
    id: string,
    tenantId: string,
    status: DecisionIntentStatus,
  ): Promise<CostDecisionIntentRecord> {
    const { data, error } = await this.supabase
      .from("cost_decision_intents")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to update intent status: ${error?.message}`);
    }

    return this.mapIntent(data);
  }

  private mapScenario(d: any): CostSimulationScenarioRecord {
    return {
      id: d.id,
      tenantId: d.tenant_id,
      name: d.name,
      description: d.description,
      presetType: d.preset_type,
      baselineSnapshotId: d.baseline_snapshot_id,
      baselineSnapshot: d.baseline_snapshot,
      appliedVariables: d.applied_variables,
      simulationResult: d.simulation_result,
      status: d.status,
      createdBy: d.created_by,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    };
  }

  private mapIntent(d: any): CostDecisionIntentRecord {
    return {
      id: d.id,
      tenantId: d.tenant_id,
      scenarioId: d.scenario_id,
      intentType: d.intent_type,
      targetEntityType: d.target_entity_type,
      targetEntityId: d.target_entity_id,
      rationale: d.rationale,
      plannedEffectiveDate: d.planned_effective_date,
      status: d.status,
      recordedBy: d.recorded_by,
      recordedAt: d.recorded_at,
      updatedAt: d.updated_at,
    };
  }
}
