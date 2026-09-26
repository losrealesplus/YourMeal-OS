/**
 * YOURMEAL OS — COST INTELLIGENCE DOMAIN TYPES
 * Subsystem: Platform Core (E1–E9)
 * Conformity: YOURMEAL_OS_PLATFORM_CONSTITUTION.md (L1)
 */

export type ProrationMethod = "value" | "weight" | "volume" | "units" | "manual";

export interface InboundPurchaseLine {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  weightKg?: number;
  volumeM3?: number;
  manualOverhead?: number;
}

export interface ProratedPurchaseLine extends InboundPurchaseLine {
  baseAmount: number;
  allocatedOverhead: number;
  effectiveUnitCost: number;
  totalEffectiveCost: number;
}

export interface CostAllocationResult {
  totalBaseAmount: number;
  totalAdditionalCosts: number;
  totalEffectiveAmount: number;
  allocationMethod: ProrationMethod;
  lines: ProratedPurchaseLine[];
}

export interface YieldLossConfig {
  wastePercentage: number; // e.g. 0.15 = 15% merma / loss
  yieldFactor?: number; // e.g. 1.0 (or 2.5 for grains/rice expansion)
}

export interface BOMComponent {
  componentId: string;
  componentName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  yieldLoss?: YieldLossConfig;
  supplierId?: string;
}

export interface ProductionOverheadsConfig {
  laborCost: number; // Mano de obra directa
  energyCost: number; // Electricidad / gas / agua
  packagingCost: number; // Envases, etiquetas, embalaje
  otherOverheads?: number;
}

export interface CalculatedBOMCost {
  productId: string;
  productName: string;
  rawMaterialsCost: number;
  overheadsCost: number;
  totalProductionCost: number;
  componentBreakdown: Array<{
    componentId: string;
    componentName: string;
    netQuantity: number;
    grossQuantity: number;
    unitCost: number;
    effectiveCost: number;
  }>;
}

export interface VarianceBreakdown {
  rawMaterialsDelta: number;
  logisticsDelta: number;
  energyDelta: number;
  laborDelta: number;
  packagingDelta: number;
  yieldLossDelta: number;
  totalVariance: number;
  totalVariancePct: number;
}

export interface StandardVsRealCost {
  productId: string;
  standardCost: number;
  realCost: number;
  salesPrice: number;
  standardMarginPct: number;
  realMarginPct: number;
  variance: VarianceBreakdown;
}

export type CostAnomalyType =
  | "price_anomaly"
  | "supplier_anomaly"
  | "consumption_anomaly"
  | "waste_anomaly"
  | "yield_anomaly"
  | "margin_anomaly"
  | "cost_trend_anomaly";

export interface CostAnomaly {
  anomalyType: CostAnomalyType;
  severity: "info" | "warning" | "critical";
  itemId: string;
  itemName: string;
  expectedValue: number;
  actualValue: number;
  deviationPct: number;
  message: string;
  timestamp: string;
}

// ============================================================================
// E9: COST SIMULATION & SCENARIOS
// ============================================================================

export interface HypotheticalVariables {
  supplierCostDeltas?: Record<string, number>; // e.g. { "SUPP-MAKRO": 0.08 } (+8%)
  itemCostDeltas?: Record<string, number>; // e.g. { "ING-POLLO": 0.12 } (+12%)
  overheadDeltas?: {
    laborRateDeltaPct?: number; // e.g. +0.05 (+5%)
    energyRateDeltaPct?: number; // e.g. +0.10 (+10%)
    logisticsRateDeltaPct?: number; // e.g. +0.15 (+15%)
    packagingRateDeltaPct?: number; // e.g. +0.07 (+7%)
  };
  yieldLossAdjustments?: Record<string, number>; // e.g. { "ING-POLLO": -0.03 } (-3% merma)
}

export interface BaselineProduct {
  productId: string;
  productName: string;
  salesPrice: number;
  monthlyVolume: number;
  bomComponents: BOMComponent[];
  overheads: ProductionOverheadsConfig;
}

export interface CostBaselineSnapshot {
  snapshotId: string;
  createdAt: string;
  products: BaselineProduct[];
}

export interface SimulatedProductImpact {
  productId: string;
  productName: string;
  salesPrice: number;
  monthlyVolume: number;
  currentCost: number;
  simulatedCost: number;
  costDelta: number;
  costDeltaPct: number;
  currentMarginPct: number;
  simulatedMarginPct: number;
  marginDeltaPct: number;
  currentMonthlyCost: number;
  simulatedMonthlyCost: number;
  monthlyProfitImpact: number;
}

export interface ScenarioResult {
  scenarioId: string;
  name: string;
  description?: string;
  createdAt: string;
  baselineSnapshotId: string;
  appliedVariables: HypotheticalVariables;
  products: SimulatedProductImpact[];
  summary: {
    totalCurrentMonthlyCost: number;
    totalSimulatedMonthlyCost: number;
    totalMonthlyCostDelta: number;
    totalMonthlyProfitImpact: number;
    avgCostDeltaPct: number;
    avgMarginDeltaPct: number;
  };
}

export interface ScenarioComparison {
  baselineSnapshotId: string;
  scenarios: Array<{
    scenarioId: string;
    name: string;
    totalMonthlyCost: number;
    monthlyProfitImpact: number;
    avgMarginPct: number;
    costDeltaPct: number;
  }>;
}
