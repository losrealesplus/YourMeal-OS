// ============================================================================
// YOURMEAL OS — DECISION INTELLIGENCE DOMAIN TYPES (CR-COST-07C)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// ============================================================================

import type { ScenarioCalculationResult } from './production-operational-types';
import type { ConclusionTier } from './product-economics-types';

export type DecisionVerdict =
  | 'APPROVED_FOR_MENU'
  | 'REJECTED_MARGIN_TOO_LOW'
  | 'REJECTED_CAPACITY_LIMIT'
  | 'POSTPONED_NEEDS_RECIPE_REVISION'
  | 'CUSTOM';

export type HumanDecisionStatus = 'APPROVED' | 'REJECTED' | 'POSTPONED';

export interface StudyDecision {
  id: string;
  versionId: string;
  decisionVerdict: DecisionVerdict;
  executiveSummaryText: string;
  humanDecisionStatus: HumanDecisionStatus;
  selectedScenarioDemand?: number | null;
  recommendedPvp?: number | null;
  approvedByUserId?: string | null;
  decisionNotes?: string | null;
  decidedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// Break-Even & PVP Economics
// ----------------------------------------------------------------------------
export interface BreakEvenBatchMetrics {
  fixedCostPerBatch: number;
  variableCostPerUnit: number | null;
  contributionMarginPerUnit: number | null;
  contributionMarginRatio: number | null;
  breakEvenBatchUnits: number | null;
  isReachable: boolean;
  unreachableReason?: string;
}

export interface PvpRecommendation {
  targetMarginPct: number;
  minimumViablePvp: number | null;
  foodCostRatioPct: number | null;
  isPartialPvp: boolean;
  unconfiguredCostFactors: string[];
}

export interface BreakEvenAnalysisResult {
  batchMetrics: BreakEvenBatchMetrics;
  pvpRecommendation: PvpRecommendation;
  requiredCapacityMinutesPer100Units: number | null;
  warnings: string[];
}

// ----------------------------------------------------------------------------
// Capacity & Bottleneck Types
// ----------------------------------------------------------------------------
export interface CapacityConstraint {
  maxUnitsPerRun?: number | null;
  maxLaborMinutesPerRun?: number | null;
  maxStorageUnits?: number | null;
}

export type CapacityStatus =
  | 'VIABLE'
  | 'BOTTLENECK_NEAR'
  | 'INVIABLE_CAPACITY'
  | 'UNCONFIGURED';

export interface CapacityEvaluation {
  demandUnits: number;
  unitsProduced: number;
  capacityLoadPct: number | null;
  status: CapacityStatus;
  isViable: boolean;
  exceededBottlenecks: string[];
  warningMessage?: string;
}

// ----------------------------------------------------------------------------
// Multidimensional Scenario Optimization
// ----------------------------------------------------------------------------
export type OptimizationGoal =
  | 'MINIMIZE_COST'
  | 'MAXIMIZE_MARGIN'
  | 'MAXIMIZE_PROFIT'
  | 'MINIMIZE_SURPLUS'
  | 'RESPECT_CAPACITY';

export interface EvaluatedScenario extends ScenarioCalculationResult {
  capacity: CapacityEvaluation;
  isRecommended: boolean;
  recommendationReason: string;
}

export interface ScenarioEvaluationMatrix {
  goal: OptimizationGoal;
  capacityConstraint?: CapacityConstraint;
  scenarios: EvaluatedScenario[];
  recommendedScenario: EvaluatedScenario | null;
  selectionExplanation: string;
  unviableScenariosCount: number;
}

// ----------------------------------------------------------------------------
// Market Variance Types
// ----------------------------------------------------------------------------
export interface MarketIngredientDelta {
  ingredientName: string;
  marketPriceId?: string | null;
  snapshotPrice: number;
  currentPrice: number;
  deltaAmount: number;
  deltaPercentage: number;
}

export interface MarketVarianceCheckResult {
  isOutdated: boolean;
  hasPriceIncreases: boolean;
  maxDeltaPercentage: number;
  impactedIngredients: MarketIngredientDelta[];
  explanation: string;
}

// ----------------------------------------------------------------------------
// Executive Verdict & Narrative
// ----------------------------------------------------------------------------
export type ExecutiveVerdictStatus =
  | 'VIABLE'
  | 'VIABLE_CONDITIONED'
  | 'NOT_VIABLE'
  | 'INSUFFICIENT_DATA';

export interface ExecutiveVerdictResult {
  status: ExecutiveVerdictStatus;
  conclusionTier: ConclusionTier;
  headline: string;
  narrativeSummary: string;
  sensitivityFactors: string[];
  epistemicGaps: string[];
  recommendedAction: string;
}
