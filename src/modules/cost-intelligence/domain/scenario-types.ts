/**
 * YOURMEAL OS — SCENARIO PERSISTENCE & DECISION INTENT TYPES (CR-COST-03)
 * Subsystem: Platform Core (Cost Intelligence)
 */

import { CostBaselineSnapshot, HypotheticalVariables, ScenarioResult } from "./types";

export type ScenarioPresetType =
  | "custom"
  | "supplier_hike"
  | "item_inflation"
  | "energy_surge"
  | "labor_escalation"
  | "yield_optimization";

export type ScenarioStatus = "draft" | "simulated" | "archived";

export interface CostSimulationScenarioRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  presetType: ScenarioPresetType;
  baselineSnapshotId: string;
  baselineSnapshot: CostBaselineSnapshot;
  appliedVariables: HypotheticalVariables;
  simulationResult?: ScenarioResult;
  status: ScenarioStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type DecisionIntentType =
  | "renegotiate_supplier"
  | "adjust_menu_price"
  | "reformulate_recipe"
  | "accept_margin_compression"
  | "other";

export type DecisionIntentStatus = "pending_action" | "completed_manually" | "abandoned";

export interface CostDecisionIntentRecord {
  id: string;
  tenantId: string;
  scenarioId: string;
  intentType: DecisionIntentType;
  targetEntityType?: "dish" | "supplier" | "ingredient" | "overhead" | "other";
  targetEntityId?: string;
  rationale: string;
  plannedEffectiveDate?: string;
  status: DecisionIntentStatus;
  recordedBy?: string;
  recordedAt: string;
  updatedAt: string;
}
