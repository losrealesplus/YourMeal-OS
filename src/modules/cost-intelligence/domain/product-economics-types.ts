// ============================================================================
// YOURMEAL OS — PRODUCT ECONOMICS DOMAIN TYPES (CR-COST-07A)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// ============================================================================

export type StudyStatus =
  | 'BORRADOR'
  | 'EN_CONFIGURACION'
  | 'LISTO_SIMULAR'
  | 'ESTUDIADO'
  | 'DECISION';

export type VersionStatus = 'BORRADOR' | 'CONGELADA' | 'ARCHIVADA';

export type SurplusDestination =
  | 'UNCONFIGURED'
  | 'STOCK_REFRIGERADO'
  | 'STOCK_CONGELADO'
  | 'VENTA_POSTERIOR'
  | 'MERMA_DESPERDICIO'
  | 'CONSUMO_INTERNO';

export type ConclusionTier = 'CERTIFIED' | 'CONDITIONED' | 'INSUFFICIENT_DATA';

export type PriceProvenance = 'REAL' | 'OBSERVADO' | 'MANUAL';

export type GrossUnit = 'kg' | 'g' | 'l' | 'ml' | 'unit';

export interface EconomicStudy {
  id: string;
  tenantId: string;
  productName: string;
  productCategory: string;
  currentStatus: StudyStatus;
  activeVersionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketPriceSnapshotEntry {
  priceId: string;
  marketProductId: string;
  sourceId: string;
  sourceName: string;
  unitPrice: number;
  unit: string;
  observedAt: string;
}

export interface StudyVersion {
  id: string;
  studyId: string;
  versionNumber: number;
  versionStatus: VersionStatus;
  targetPvp: number | null;
  salesUnit: string;
  salesUnitSize: number;
  batchUnitName: string;
  batchNominalYield: number; // e.g. 12 raciones
  isFractionalAllowed: boolean;
  surplusDestination: SurplusDestination;
  conclusionTier: ConclusionTier;
  provenanceSummary: string;
  marketPricesSnapshot: Record<string, MarketPriceSnapshotEntry>;
  isFrozen: boolean;
  createdAt: string;
}

export interface StudyIngredient {
  id: string;
  versionId: string;
  ingredientName: string;
  grossQuantity: number;
  grossUnit: GrossUnit;
  marketPriceId?: string | null;
  unitPrice: number;
  priceProvenance: PriceProvenance;
  densityKgPerL?: number | null; // NULL if unknown. NEVER ASSUME 1.0!
  pieceMassKg?: number | null; // NULL if unknown. NEVER ASSUME 0.06!
  trimmingLossPct: number | null; // NULL means [NO CONFIGURADO]. 0 means explicitly 0% loss!
  netUsableQuantity: number | null; // gross * (1 - trimming/100), or NULL if trimming is unconfigured
  createdAt: string;
}

export interface StudyYieldStage {
  id: string;
  versionId: string;
  stageOrder: number;
  stageName: string;
  lossPercentage: number; // e.g. 5.0 for 5%
  provenance: 'OBSERVADO' | 'MANUAL';
  createdAt: string;
}

export interface CumulativeYieldBreakdown {
  stageOrder: number;
  stageName: string;
  lossPct: number;
  remainingMassFactor: number;
  massAtStageEnd: number | null;
}

export interface YieldCalculationResult {
  totalGrossMaterialCost: number; // EUR is always exact
  totalGrossWeightKg: number | null; // null if any density/piece mass is unconfigured
  totalNetUsableWeightKg: number | null; // null if any trimming or mass is unconfigured
  trimmingYieldPct: number | null;
  cookingAndProcessYieldPct: number;
  cumulativeGlobalYieldPct: number | null;
  finishedProductMassKg: number | null;
  nominalPortionsProduced: number;
  effectiveCostPerKgVendible: number | null;
  rawMaterialCostPerNominalPortion: number;
  provenanceDistribution: {
    realPct: number;
    observedPct: number;
    manualPct: number;
    dominantProvenance: PriceProvenance;
  };
  stagesBreakdown: CumulativeYieldBreakdown[];
  epistemicWarnings: string[];
}
