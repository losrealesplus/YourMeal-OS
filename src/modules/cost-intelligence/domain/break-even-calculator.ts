// ============================================================================
// YOURMEAL OS — BREAK-EVEN & PVP ECONOMIC CALCULATOR (CR-COST-07C)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// "YOURMEAL OS NO ASUME: PREGUNTA, CALCULA Y EXPLICA."
// ============================================================================

import type { StudyOperationConfig } from './production-operational-types';
import type {
  BreakEvenAnalysisResult,
  BreakEvenBatchMetrics,
  PvpRecommendation,
} from './decision-intelligence-types';

export class BreakEvenCalculator {
  /**
   * Calculates comprehensive break-even metrics and minimum viable PVP.
   */
  public static calculateBreakEven(
    rawMaterialCostPerUnit: number,
    nominalBatchYield: number,
    targetPvp: number | null,
    operationConfig: StudyOperationConfig | null,
    targetMarginPct: number = 70.0
  ): BreakEvenAnalysisResult {
    const warnings: string[] = [];
    const unconfiguredCostFactors: string[] = [];

    // 1. Calculate Fixed Costs per Batch Run
    let fixedLaborCost = 0;
    if (operationConfig) {
      const fixedMinutes =
        (operationConfig.laborSetupMinutes || 0) +
        (operationConfig.laborCleaningMinutes || 0);

      if (fixedMinutes > 0) {
        if (operationConfig.laborHourlyRate != null) {
          fixedLaborCost = (fixedMinutes / 60) * operationConfig.laborHourlyRate;
        } else {
          warnings.push('LABOR_HOURLY_RATE_MISSING_FOR_SETUP');
          unconfiguredCostFactors.push('LABOR');
        }
      }
    } else {
      unconfiguredCostFactors.push('LABOR');
    }

    let fixedEnergyCost = 0;
    if (operationConfig) {
      if (operationConfig.energyMethod === 'MANUAL_FLAT') {
        fixedEnergyCost = operationConfig.energyFlatFee || 0;
      } else if (operationConfig.energyMethod === 'UNCONFIGURED') {
        unconfiguredCostFactors.push('ENERGY');
      }
    } else {
      unconfiguredCostFactors.push('ENERGY');
    }

    const fixedCostPerBatch = Number((fixedLaborCost + fixedEnergyCost).toFixed(4));

    // 2. Calculate Variable Direct Cost per Unit
    let variableLaborPerUnit = 0;
    if (operationConfig) {
      const batchMinutesPerUnit =
        nominalBatchYield > 0 ? (operationConfig.laborBatchMinutes || 0) / nominalBatchYield : 0;
      const unitMinutes = operationConfig.laborUnitMinutes || 0;
      const totalVarMinutes = batchMinutesPerUnit + unitMinutes;

      if (totalVarMinutes > 0) {
        if (operationConfig.laborHourlyRate != null) {
          variableLaborPerUnit = (totalVarMinutes / 60) * operationConfig.laborHourlyRate;
        } else if (!unconfiguredCostFactors.includes('LABOR')) {
          unconfiguredCostFactors.push('LABOR');
        }
      }
    }

    let variableEnergyPerUnit = 0;
    if (operationConfig) {
      if (operationConfig.energyMethod === 'QUANTITATIVE') {
        const power = operationConfig.energyPowerKw || 0;
        const hours = operationConfig.energyCycleHours || 0;
        const tariff = operationConfig.energyTariffKwh || 0;
        const batchEnergy = power * hours * tariff;
        variableEnergyPerUnit = nominalBatchYield > 0 ? batchEnergy / nominalBatchYield : 0;
      } else if (operationConfig.energyMethod === 'PERCENTAGE') {
        const pct = (operationConfig.energyPercentageRate || 0) / 100;
        variableEnergyPerUnit = rawMaterialCostPerUnit * pct;
      }
    }

    let variablePackagingPerUnit = 0;
    if (operationConfig) {
      if (operationConfig.packagingMode === 'CONFIGURED') {
        const primary = operationConfig.packagingUnitCost || 0;
        const secondary =
          operationConfig.packagingSecondaryCost && operationConfig.packagingSecondaryCapacity
            ? operationConfig.packagingSecondaryCost / operationConfig.packagingSecondaryCapacity
            : 0;
        variablePackagingPerUnit = primary + secondary;
      } else if (operationConfig.packagingMode === 'UNCONFIGURED') {
        unconfiguredCostFactors.push('PACKAGING');
      }
    } else {
      unconfiguredCostFactors.push('PACKAGING');
    }

    const totalKnownVariableCostPerUnit = Number(
      (
        rawMaterialCostPerUnit +
        variableLaborPerUnit +
        variableEnergyPerUnit +
        variablePackagingPerUnit
      ).toFixed(4)
    );

    // 3. Break-Even Batch Metrics
    let contributionMarginPerUnit: number | null = null;
    let contributionMarginRatio: number | null = null;
    let breakEvenBatchUnits: number | null = null;
    let isReachable = false;
    let unreachableReason: string | undefined = undefined;

    if (targetPvp == null) {
      unreachableReason = 'TARGET_PVP_MISSING';
      warnings.push('TARGET_PVP_MISSING');
    } else {
      contributionMarginPerUnit = Number((targetPvp - totalKnownVariableCostPerUnit).toFixed(4));
      contributionMarginRatio = Number((contributionMarginPerUnit / targetPvp).toFixed(4));

      if (contributionMarginPerUnit <= 0) {
        isReachable = false;
        unreachableReason = 'CONTRIBUTION_MARGIN_NEGATIVE_OR_ZERO';
        warnings.push('CONTRIBUTION_MARGIN_NEGATIVE_OR_ZERO');
      } else {
        isReachable = true;
        if (fixedCostPerBatch === 0) {
          breakEvenBatchUnits = 0; // No fixed costs to amortize
        } else {
          breakEvenBatchUnits = Math.ceil(fixedCostPerBatch / contributionMarginPerUnit);
        }
      }
    }

    const batchMetrics: BreakEvenBatchMetrics = {
      fixedCostPerBatch,
      variableCostPerUnit: totalKnownVariableCostPerUnit,
      contributionMarginPerUnit,
      contributionMarginRatio,
      breakEvenBatchUnits,
      isReachable,
      unreachableReason,
    };

    // 4. Minimum Viable PVP Recommendation
    let minimumViablePvp: number | null = null;
    let foodCostRatioPct: number | null = null;

    if (targetMarginPct > 0 && targetMarginPct < 100) {
      const marginDivisor = 1 - targetMarginPct / 100;
      minimumViablePvp = Number((totalKnownVariableCostPerUnit / marginDivisor).toFixed(4));
      if (targetPvp && targetPvp > 0) {
        foodCostRatioPct = Number(((rawMaterialCostPerUnit / targetPvp) * 100).toFixed(2));
      }
    }

    const pvpRecommendation: PvpRecommendation = {
      targetMarginPct,
      minimumViablePvp,
      foodCostRatioPct,
      isPartialPvp: unconfiguredCostFactors.length > 0,
      unconfiguredCostFactors: Array.from(new Set(unconfiguredCostFactors)),
    };

    // 5. Required Capacity for 100 Units
    let requiredCapacityMinutesPer100Units: number | null = null;
    if (operationConfig && nominalBatchYield > 0) {
      const batchesFor100 = Math.ceil(100 / nominalBatchYield);
      const setup = operationConfig.laborSetupMinutes || 0;
      const cleaning = operationConfig.laborCleaningMinutes || 0;
      const batchTime = (operationConfig.laborBatchMinutes || 0) * batchesFor100;
      const unitTime = (operationConfig.laborUnitMinutes || 0) * 100;
      requiredCapacityMinutesPer100Units = setup + cleaning + batchTime + unitTime;
    }

    return {
      batchMetrics,
      pvpRecommendation,
      requiredCapacityMinutesPer100Units,
      warnings,
    };
  }
}
