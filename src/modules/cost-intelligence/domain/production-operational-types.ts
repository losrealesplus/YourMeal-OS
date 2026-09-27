// ============================================================================
// YOURMEAL OS — PRODUCTION & OPERATIONAL COST DOMAIN TYPES (CR-COST-07B)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// ============================================================================

import type { SurplusDestination } from './product-economics-types';

export type EnergyMethod =
  | 'QUANTITATIVE'
  | 'PERCENTAGE'
  | 'MANUAL_FLAT'
  | 'NOT_APPLICABLE'
  | 'UNCONFIGURED';

export type PackagingMode = 'CONFIGURED' | 'NOT_APPLICABLE' | 'UNCONFIGURED';

export interface StudyOperationConfig {
  id: string;
  versionId: string;
  laborSetupMinutes: number;
  laborBatchMinutes: number;
  laborUnitMinutes: number;
  laborCleaningMinutes: number;
  laborHourlyRate: number | null; // NULL if unconfigured. Never assume 0.00!
  energyMethod: EnergyMethod;
  energyPowerKw?: number | null;
  energyCycleHours?: number | null;
  energyTariffKwh?: number | null;
  energyPercentageRate?: number | null;
  energyFlatFee?: number | null;
  packagingMode: PackagingMode;
  packagingUnitCost?: number | null;
  packagingSecondaryCost?: number | null;
  packagingSecondaryCapacity?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscreteBatchResult {
  demandUnits: number;
  batchesRequired: number;
  unitsProduced: number;
  surplusUnits: number;
  surplusStatus: SurplusDestination;
  isFractional: boolean;
}

export interface LaborCostResult {
  totalMinutes: number;
  setupMinutes: number;
  batchMinutes: number;
  unitMinutes: number;
  cleaningMinutes: number;
  hourlyRate: number | null;
  totalLaborCost: number | null; // null if hourlyRate is null
}

export interface EnergyCostResult {
  method: EnergyMethod;
  totalEnergyCost: number | null; // null if unconfigured
  kwhConsumed?: number | null;
  details: string;
}

export interface PackagingCostResult {
  mode: PackagingMode;
  totalPackagingCost: number | null; // null if unconfigured
  primaryCost?: number;
  secondaryCost?: number;
  secondaryBoxesCount?: number;
}

export interface ScenarioCalculationResult {
  demandUnits: number;
  batchesRequired: number;
  unitsProduced: number;
  surplusUnits: number;
  surplusStatus: SurplusDestination;
  totalRawMaterialCost: number;
  totalLaborCost: number | null;
  totalEnergyCost: number | null;
  totalPackagingCost: number | null;
  totalKnownDirectCost: number;
  costPerSoldUnit: number | null; // NULL if surplusStatus === 'UNCONFIGURED'
  grossMarginPct: number | null; // NULL if costPerSoldUnit or targetPvp is null
  isCustomScenario: boolean;
  warnings: string[];
}
