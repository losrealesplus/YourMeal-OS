/**
 * CR-COST-05: Food Market Price Intelligence Domain Types
 * Core / Domain layer definitions for observable market prices, normalization,
 * matching engine, weighted benchmarks, and negotiation intelligence.
 */

export type SourceType =
  | 'b2b_wholesale'
  | 'cash_carry'
  | 'regional_specialist'
  | 'retail_ceiling';

export type TaxMode = 'ex_tax' | 'inc_tax';

export type RegionCode =
  | 'ES_TENERIFE_TF'
  | 'ES_GRAN_CANARIA_GC'
  | 'ES_CANARIAS_REGIONAL'
  | 'ES_PENINSULA_MAINLAND'
  | 'ES_NATIONAL';

export type ThermalState = 'fresh' | 'frozen' | 'ambient' | 'dry';

export type StandardUnit = 'kg' | 'l' | 'unit';

export type NormalizedUnit = 'EUR_PER_KG' | 'EUR_PER_L' | 'EUR_PER_UNIT';

export type PromotionStatus = 'standard' | 'temporary_discount' | 'clearance';

export type CaptureMethod =
  | 'assisted_entry'
  | 'catalog_import'
  | 'authorized_feed';

export type QualityStatus =
  | 'VERIFIED'
  | 'OBSERVED'
  | 'ESTIMATED'
  | 'PROMOTIONAL'
  | 'STALE'
  | 'LOW_CONFIDENCE';

export type MatchStatus = 'suggested' | 'confirmed' | 'rejected';

export type ComparabilityGrade = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface MarketSource {
  id: string;
  name: string;
  sourceType: SourceType;
  defaultTaxMode: TaxMode;
  defaultRegion: RegionCode;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketProduct {
  id: string;
  sourceId: string;
  externalSku?: string;
  rawName: string;
  brand?: string;
  category: string;
  thermalState: ThermalState;
  standardQuantity: number;
  standardUnit: StandardUnit;
  cutSpecification?: string;
  qualityGrade?: string;
  origin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketVolumeTier {
  id: string;
  observationId: string;
  minQuantity: number;
  tierNormalizedPriceExTax: number;
}

export interface MarketPriceObservation {
  id: string;
  marketProductId: string;
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  priceRaw: number;
  currency: 'EUR';
  taxMode: TaxMode;
  taxRate: number; // e.g. 0.0, 0.03, 0.07, 0.10, 0.21
  normalizedPriceExTax: number;
  normalizedUnit: NormalizedUnit;
  promotionStatus: PromotionStatus;
  regionCode: RegionCode;
  locationName?: string;
  captureMethod: CaptureMethod;
  qualityStatus: QualityStatus;
  volumeTiers?: MarketVolumeTier[];
  createdAt: string;
}

export interface ProductMapping {
  id: string;
  tenantId: string;
  tenantIngredientId: string;
  marketProductId: string;
  matchConfidence: number; // 0.00 to 1.00
  matchStatus: MatchStatus;
  comparabilityGrade: ComparabilityGrade;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantIngredientEconomicRef {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  thermalState?: ThermalState;
  unit: StandardUnit;
  effectiveWacExTax: number;
  currentInvoicedPriceExTax?: number;
  annualVolume?: number; // annual consumption in unit
  lastInvoicedAt?: string;
  primarySupplierName?: string;
}

export interface MatchCandidateInput {
  tenantIngredientName: string;
  tenantThermalState?: ThermalState;
  tenantUnit: StandardUnit;
  tenantCutSpec?: string;
  tenantQualityGrade?: string;
}

export interface MatchDimensionBreakdown {
  nameScore: number; // 0.0 - 1.0 (w = 0.40)
  thermalStateScore: number; // 0.0 - 1.0 (w = 0.25)
  unitScore: number; // 0.0 - 1.0 (w = 0.15)
  specScore: number; // 0.0 - 1.0 (w = 0.10)
  gradeScore: number; // 0.0 - 1.0 (w = 0.10)
}

export type MatchClassification =
  | 'HIGH_MATCH'
  | 'MEDIUM_MATCH'
  | 'LOW_MATCH'
  | 'UNMATCHED';

export interface MatchConfidenceResult {
  confidenceScore: number; // 0.0 - 1.0
  classification: MatchClassification;
  breakdown: MatchDimensionBreakdown;
  suggestedComparability: ComparabilityGrade;
}

export interface BenchmarkComponent {
  observationId: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  rawName: string;
  regionCode: RegionCode;
  observedAt: string;
  rawPrice: number;
  taxMode: TaxMode;
  taxRate: number;
  normalizedPriceExTax: number;
  normalizedUnit: NormalizedUnit;
  comparabilityGrade: ComparabilityGrade;
  weight: number;
  isStale: boolean;
  isPromo: boolean;
}

export interface BenchmarkCalculation {
  tenantIngredientId: string;
  tenantIngredientName: string;
  calculatedAt: string;
  canonicalUnit: NormalizedUnit;
  benchmarkPriceExTax: number;
  minPriceExTax: number;
  maxPriceExTax: number;
  dispersionSpreadPct: number;
  observationsCount: number;
  highComparabilityCount: number;
  components: BenchmarkComponent[];
}

export interface VarianceAnalysis {
  tenantIngredientId: string;
  tenantIngredientName: string;
  unit: NormalizedUnit;
  effectiveWacExTax: number;
  currentInvoicedPriceExTax?: number;
  benchmarkPriceExTax: number;
  marketVariancePct: number; // (WAC - Benchmark) / Benchmark * 100
  supplierPriceGapEur: number; // Invoiced - Benchmark
  annualSpendAtRiskEur?: number;
  status: 'FAVORABLE' | 'AT_PAR' | 'UNFAVORABLE_OVERPAYING';
  confidenceSummary: ComparabilityGrade;
}

export interface NegotiationTalkingPoint {
  topic: string;
  point: string;
  evidence: string;
  impactEur?: number;
}

export interface NegotiationBrief {
  tenantId: string;
  tenantName: string;
  generatedAt: string;
  ingredientId: string;
  ingredientName: string;
  targetSupplierName?: string;
  currentInvoicedPriceExTax: number;
  effectiveWacExTax: number;
  consumptionVolume: number;
  unit: StandardUnit;
  projectedAnnualSpendEur: number;
  benchmarkPriceExTax: number;
  potentialAnnualSavingsEur: number;
  targetRenegotiationPriceExTax: number;
  varianceAnalysis: VarianceAnalysis;
  observableComponents: BenchmarkComponent[];
  talkingPoints: NegotiationTalkingPoint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CR-COST-05 v4.1 Canonical Opportunity State Machine & Decision Entity
// ─────────────────────────────────────────────────────────────────────────────

export type OpportunityLifecycleState =
  | 'DETECTED'
  | 'REVIEWED'
  | 'SIMULATED'
  | 'DECISION_RECORDED'
  | 'PENDING_EXECUTION'
  | 'RESOLVED';

export type ActionabilityGrade =
  | 'DIRECT_ACTION'
  | 'REVIEW_DATA'
  | 'INFORMATIONAL'
  | 'INSUFFICIENT';

export interface AffectedDishSim {
  dishId: string;
  dishName: string;
  salesPrice: number;
  currentCost: number;
  simulatedCost: number;
  currentMarginPct: number;
  simulatedMarginPct: number;
  costDelta: number;
  monthlyVolumeUnits: number;
  monthlyProfitImpactEur: number;
}

export interface EconomicOpportunity {
  id: string;
  ingredientId: string;
  ingredientName: string;
  category?: string;
  unit: string;
  effectiveWacExTax: number;
  benchmarkPriceExTax: number;
  variancePct: number;
  comparabilityGrade: ComparabilityGrade;
  annualVolume: number | null;
  potentialAnnualSavingsEur: number | null;
  actionabilityGrade: ActionabilityGrade;
  lifecycleState: OpportunityLifecycleState;
  calculation: BenchmarkCalculation;
  affectedDishes: AffectedDishSim[];
  recordedDecision?: {
    id: string;
    intentType: string;
    targetPriceExTax?: number;
    plannedEffectiveDate?: string;
    rationale: string;
    authorName: string;
    createdAt: string;
  };
}

