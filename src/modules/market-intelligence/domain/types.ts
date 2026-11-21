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

export type TaxMode = 'ex_tax' | 'inc_tax' | 'in_tax' | 'exempt' | 'unknown';

export type TaxInclusion = 'excluded' | 'included' | 'unknown';

export type TaxRegime =
  | 'IVA'
  | 'IGIC'
  | 'IPSI'
  | 'VAT'
  | 'GST'
  | 'SALES_TAX'
  | 'EXEMPT'
  | 'OUT_OF_SCOPE'
  | 'UNKNOWN';

export type TaxRateSource =
  | 'observed_document'
  | 'official_tariff_table'
  | 'source_declared_default'
  | 'tenant_supplied'
  | 'not_applicable'
  | 'unknown';

export type AiemStatus =
  | 'not_applicable'
  | 'applicable_included'
  | 'applicable_excluded'
  | 'applicable_inclusion_unknown'
  | 'unknown';

export type KnownSpainRegionCode =
  | 'ES_TENERIFE_TF'
  | 'ES_GRAN_CANARIA_GC'
  | 'ES_CANARIAS_REGIONAL'
  | 'ES_PENINSULA_MAINLAND'
  | 'ES_NATIONAL';

/** Country-agnostic region identifier; preserves canonical Spain region tokens. */
export type RegionCode = KnownSpainRegionCode | (string & {});

export type ThermalState = 'fresh' | 'frozen' | 'ambient' | 'dry';

export type MeasurementDimension = 'mass' | 'volume' | 'count';

export type StandardUnit = 'kg' | 'l' | 'unit';

export type ContentUnit = 'kg' | 'g' | 'l' | 'ml' | 'cl' | 'unit';

export type PackPresentation =
  | 'bulk'
  | 'bag'
  | 'box'
  | 'tray'
  | 'bottle'
  | 'can'
  | 'jar'
  | 'sachet'
  | 'vacuum'
  | 'drum'
  | 'pack'
  | 'other';

export type ObservedPriceBasis = 'per_pack' | 'per_inner_unit' | 'per_base_unit' | 'unknown';

export type NormalizationBasis = 'net_content' | 'drained_weight' | 'unit_count' | 'unknown';

export type NormalizationStatus =
  | 'computed'
  | 'tax_unknown'
  | 'tax_rate_missing'
  | 'dimension_incompatible'
  | 'pack_incomplete';

export type ChannelKind =
  | 'cash_carry'
  | 'wholesale_depot'
  | 'retail_store'
  | 'online_store'
  | 'direct_delivery'
  | 'unknown';

export type SourceChannelType =
  | 'b2b_wholesale'
  | 'cash_carry'
  | 'regional_distributor'
  | 'retail_store'
  | 'retail_online'
  | 'direct_producer'
  | 'unknown';

export type ObservedChannel =
  | 'cash_carry'
  | 'b2b_portal'
  | 'retail_shelf'
  | 'retail_online'
  | 'supplier_quote'
  | 'catalog_sheet'
  | 'unknown';

export type FulfillmentMode = 'delivery' | 'pickup_only' | 'delivery_and_pickup' | 'unknown';

export type CoverageStatus =
  | 'documented_available'
  | 'documented_unavailable'
  | 'conditional'
  | 'unknown';

export type DeliveryCoverageState =
  | 'delivery_available'
  | 'pickup_only'
  | 'unavailable_in_target'
  | 'unknown';

export type AvailabilityStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'limited'
  | 'on_request'
  | 'discontinued'
  | 'unknown';

export type ValiditySource =
  | 'source_declared'
  | 'contract_agreed'
  | 'inferred_default'
  | 'unknown';

export type FreightInclusion = 'included' | 'excluded' | 'free_above_threshold' | 'unknown';

export type MinOrderUnit = 'pack' | 'unit' | 'kg' | 'l' | 'order_amount';

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
  providerCode?: string | null;
  countryCode?: string | null;
  channelType?: SourceChannelType | null;
  defaultTaxMode: TaxMode;
  defaultRegion: RegionCode;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketEstablishment {
  id: string;
  sourceId: string;
  ownerTenantId?: string | null;
  establishmentCode: string;
  name: string;
  channelKind: ChannelKind;
  countryCode?: string | null;
  regionCode?: RegionCode | null;
  subdivisionCode?: string | null;
  provinceCode?: string | null;
  islandCode?: string | null;
  postalCode?: string | null;
  city?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDeliveryCoverage {
  id: string;
  sourceId: string;
  establishmentId?: string | null;
  ownerTenantId?: string | null;
  fulfillmentMode: FulfillmentMode;
  coverageStatus: CoverageStatus;
  countryCode: string;
  regionCode?: RegionCode | null;
  subdivisionCode?: string | null;
  provinceCode?: string | null;
  islandCode?: string | null;
  postalCodePrefix?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  evidenceNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketProduct {
  id: string;
  sourceId: string;
  ownerTenantId?: string | null;
  externalSku?: string;
  gtin?: string | null;
  rawName: string;
  brand?: string;
  category: string;
  thermalState: ThermalState;
  measurementDimension?: MeasurementDimension | null;
  standardQuantity: number;
  standardUnit: StandardUnit;
  packPresentation?: PackPresentation | null;
  packCount?: number | null;
  unitContentQty?: number | null;
  unitContentUnit?: ContentUnit | null;
  netContentQty?: number | null;
  netContentUnit?: ContentUnit | null;
  drainedWeightQty?: number | null;
  drainedWeightUnit?: 'kg' | 'g' | null;
  densityKgPerL?: number | null;
  cutSpecification?: string;
  qualityGrade?: string;
  origin?: string;
  isCatchWeight?: boolean;
  taricCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketVolumeTier {
  id: string;
  observationId: string;
  minQuantity: number;
  tierQuantityUnit?: string;
  tierPriceRaw?: number | null;
  taxMode?: TaxMode;
  taxRate?: number | null;
  tierNormalizedPriceExTax: number | null;
}

export type PricingComparisonMode = 'landed_cost' | 'origin_price';

export type CatchWeightPolicy = 'allow_variable_kg' | 'strict_nominal_pack';

export interface MarketTenantConfig {
  id?: string;
  tenantId: string;
  pricingComparisonMode: PricingComparisonMode;
  catchWeightPolicy: CatchWeightPolicy;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketPriceObservation {
  id: string;
  marketProductId: string;
  ownerTenantId?: string | null;
  observedAt: string;
  validFrom?: string;
  validTo?: string | null;
  validitySource?: ValiditySource;
  priceRaw: number;
  currency: string;
  taxMode: TaxMode;
  taxInclusion?: TaxInclusion;
  taxRate: number | null; // Explicit 0 means 0%; null means unknown / undetermined
  taxRegime?: TaxRegime;
  taxRateSource?: TaxRateSource;
  taxRuleRef?: string | null;
  taxEffectiveFrom?: string | null;
  taxEffectiveTo?: string | null;
  aiemStatus?: AiemStatus;
  aiemEvidence?: string | null;
  aiemRate?: number | null;
  aiemAmountRaw?: number | null;
  normalizedPriceExTax: number | null;
  normalizedUnit: NormalizedUnit;
  observedPriceBasis?: ObservedPriceBasis;
  normalizationBasis?: NormalizationBasis;
  normalizationStatus?: NormalizationStatus;
  promotionStatus: PromotionStatus;
  promotionCondition?: string | null;
  promotionValidTo?: string | null;
  freightInclusion?: FreightInclusion;
  freightCostRaw?: number | null;
  freeFreightMinOrderAmount?: number | null;
  minOrderQty?: number | null;
  minOrderUnit?: MinOrderUnit | null;
  regionCode: RegionCode;
  locationName?: string;
  establishmentId?: string | null;
  observationCountryCode?: string | null;
  observationSubdivisionCode?: string | null;
  observationProvinceCode?: string | null;
  observationIslandCode?: string | null;
  observationPostalCode?: string | null;
  observedChannel?: ObservedChannel;
  deliveryCoverageState?: DeliveryCoverageState;
  availabilityStatus?: AvailabilityStatus;
  captureMethod: CaptureMethod;
  qualityStatus: QualityStatus;
  rawPayload?: Record<string, unknown>;
  importedBy?: string;
  volumeTiers?: MarketVolumeTier[];
  createdAt: string;
}

/**
 * Tax deductibility is strictly buyer/tenant-scoped, never a universal property of a market SKU.
 */
export interface BuyerFiscalProfileRef {
  tenantId: string;
  buyerTaxRegime: TaxRegime;
  canRecoverInputTax: boolean | 'partial' | 'unknown';
  recoveryRate: number | null;
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
  taxRate: number | null;
  normalizedPriceExTax: number;
  normalizedUnit: NormalizedUnit;
  comparabilityGrade: ComparabilityGrade;
  weight: number;
  isStale: boolean;
  isPromo: boolean;
}

export type BenchmarkStatus =
  | 'COMPUTED'
  | 'PENDING_NORMALIZATION'
  | 'NO_VALID_OBSERVATIONS';

export interface BenchmarkCalculation {
  tenantIngredientId: string;
  tenantIngredientName: string;
  calculatedAt: string;
  canonicalUnit: NormalizedUnit;
  benchmarkStatus?: BenchmarkStatus;
  benchmarkPriceExTax: number | null;
  minPriceExTax: number | null;
  maxPriceExTax: number | null;
  dispersionSpreadPct: number | null;
  observationsCount: number;
  highComparabilityCount: number;
  components: BenchmarkComponent[];
  historicalReferences?: BenchmarkComponent[];
  diagnosticNote?: string | null;
}

export interface VarianceAnalysis {
  tenantIngredientId: string;
  tenantIngredientName: string;
  unit: NormalizedUnit;
  effectiveWacExTax: number;
  currentInvoicedPriceExTax?: number;
  benchmarkPriceExTax: number | null;
  marketVariancePct: number | null; // (WAC - Benchmark) / Benchmark * 100
  supplierPriceGapEur: number | null; // Invoiced - Benchmark
  annualSpendAtRiskEur?: number | null;
  status: 'FAVORABLE' | 'AT_PAR' | 'UNFAVORABLE_OVERPAYING' | 'PENDING_DATA';
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
  consumptionVolume: number | null;
  unit: StandardUnit;
  projectedAnnualSpendEur: number | null;
  benchmarkPriceExTax: number | null;
  potentialAnnualSavingsEur: number | null;
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
  salesPrice: number | null;
  currentCost: number | null;
  simulatedCost: number | null;
  currentMarginPct: number | null;
  simulatedMarginPct: number | null;
  costDelta: number | null;
  monthlyVolumeUnits: number;
  monthlyProfitImpactEur: number | null;
  isCalculable?: boolean;
}

export interface EconomicOpportunity {
  id: string;
  ingredientId: string;
  ingredientName: string;
  category?: string;
  unit: string;
  effectiveWacExTax: number;
  benchmarkPriceExTax: number | null;
  variancePct: number | null;
  comparabilityGrade: ComparabilityGrade;
  annualVolume: number | null;
  potentialAnnualSavingsEur: number | null;
  actionabilityGrade: ActionabilityGrade;
  lifecycleState: OpportunityLifecycleState;
  calculation: BenchmarkCalculation | null;
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

// ============================================================================
// CR-COST-05 Bloque 3: Offer Comparison, Landed Cost & Explainable Ranking
// ============================================================================

export type FreightStatus =
  | 'included'
  | 'surcharged'
  | 'free_threshold_reached'
  | 'unknown_freight';

export interface DeliveryTargetQuery {
  countryCode: string; // ISO 3166-1 alpha-2, e.g. 'ES', 'PT'
  regionCode?: RegionCode | null;
  subdivisionCode?: string | null;
  provinceCode?: string | null;
  islandCode?: string | null;
  postalCode?: string | null;
  allowPickup?: boolean;
}

export interface ComparisonInputObservation {
  source: MarketSource;
  product: MarketProduct;
  observation: MarketPriceObservation;
  mapping: ProductMapping;
  coverages?: MarketDeliveryCoverage[];
}

export type OfferUncertaintyFlag =
  | 'UNKNOWN_FREIGHT'
  | 'UNQUANTIFIED_SURCHARGE'
  | 'AIEM_INCLUSION_UNKNOWN'
  | 'STALE_OBSERVATION'
  | 'UNVERIFIED_GEO_COVERAGE'
  | 'ESTIMATED_QUALITY'
  | 'PROMOTIONAL_TEMPORARY'
  | 'MIN_ORDER_QTY_TIGHT';

export type DisqualificationReason =
  | 'OUT_OF_GEOGRAPHIC_COVERAGE'
  | 'UNRESOLVED_TAX_MODE'
  | 'EXPIRED_OR_STALE_OBSERVATION'
  | 'INCOMPATIBLE_UNIT_OR_DIMENSION'
  | 'MIN_ORDER_QTY_EXCEEDED'
  | 'UNKNOWN_FREIGHT_IN_LANDED_COST'
  | 'CATCH_WEIGHT_DEVIATION_DISALLOWED'
  | 'THERMAL_STATE_INCOMPATIBLE'
  | 'COMPARABILITY_GRADE_EXCLUDED';

export interface DisqualifiedOffer {
  observationId: string;
  sourceId: string;
  sourceName: string;
  productName: string;
  reason: DisqualificationReason;
  diagnosticNote: string;
}

export interface ComparisonContext {
  targetLocation?: DeliveryTargetQuery;
  batchQuantity?: number;
  batchUnit?: string;
  targetThermalState?: ThermalState;
  comparisonMode?: PricingComparisonMode;
  catchWeightPolicy?: CatchWeightPolicy;
  referenceDate?: Date;
  maxFreshnessDays?: number;
}

export interface RankedMarketOffer {
  observationId: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  channelType?: SourceChannelType | null;
  productId: string;
  rawName: string;
  brand?: string | null;
  origin?: string | null;
  thermalState?: ThermalState;
  comparabilityGrade: ComparabilityGrade;

  // Applied tier (if applicable)
  appliedTier?: MarketVolumeTier | null;
  effectiveQuantityUnit: string;

  // Price components
  originPriceExTax: number;
  freightSurchargePerUnit: number;
  landedCostExTax: number;
  effectiveComparablePriceExTax: number;

  // Fiscal & Freight details
  taxMode: TaxMode;
  taxRate: number | null;
  taxRegime?: TaxRegime;
  aiemStatus?: AiemStatus;
  freightStatus: FreightStatus;

  // Geographic & Delivery
  deliveryCoverageState: DeliveryCoverageState;
  fulfillmentMode?: FulfillmentMode;

  // Timestamps & Quality
  observedAt: string;
  validTo?: string | null;
  qualityStatus: QualityStatus;
  isStale: boolean;
  isPromo: boolean;

  // Uncertainty flags & reasons
  uncertaintyFlags: OfferUncertaintyFlag[];
  isEligibleTop1: boolean;
  ineligibilityReason?: string;

  // Scoring for tie-break
  tieBreakScore: number;
  explanationNote: string;
}

export interface MarketOfferRanking {
  tenantIngredientId: string;
  tenantIngredientName: string;
  calculatedAt: string;
  comparisonMode: PricingComparisonMode;
  batchQuantity: number | null;
  batchUnit: string;
  canonicalUnit: NormalizedUnit;

  // Top 1 Recommended Offer
  top1: RankedMarketOffer | null;
  top1Explanation: string;

  // Next Best Alternatives (up to 2-3)
  alternatives: RankedMarketOffer[];

  // Disqualified Offers
  disqualifiedOffers: DisqualifiedOffer[];
  totalObservationsEvaluated: number;

  // Honest Savings Evaluation
  tenantWacExTax: number | null;
  savingsVsWacEurPerUnit: number | null;
  savingsVsWacPct: number | null;
  savingsVsAlternativeEurPerUnit: number | null;
  savingsConfidence: 'VERIFIED' | 'UNCERTAIN' | 'NOT_COMPUTABLE';
  savingsExplanation: string;
}


