// ============================================================================
// YOURMEAL OS — OPERATIONAL COST ENGINE (CR-COST-07B)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// Non-Linear Labor, Energy in 3 Modes, Decoupled Packaging & Scenario Matrix
// Constitutional Rule: NO FALSE ZERO (Unconfigured operational costs are NULL)
// ============================================================================

import type { SurplusDestination } from './product-economics-types';
import type {
  StudyOperationConfig,
  LaborCostResult,
  EnergyCostResult,
  PackagingCostResult,
  ScenarioCalculationResult,
} from './production-operational-types';
import { DiscreteBatchEngine } from './discrete-batch-engine';

export class OperationalCostEngine {
  /**
   * Calculates direct labor minutes and cost.
   * If hourly rate is unconfigured (null), totalLaborCost is null (NO FALSE ZERO).
   */
  public static calculateLaborCost(
    batchesRequired: number,
    demandUnits: number,
    config?: Partial<StudyOperationConfig> | null
  ): LaborCostResult {
    const setup = config?.laborSetupMinutes ?? 0;
    const cleaning = config?.laborCleaningMinutes ?? 0;
    const batchMinutes = (config?.laborBatchMinutes ?? 0) * batchesRequired;
    const unitMinutes = (config?.laborUnitMinutes ?? 0) * demandUnits;

    const totalMinutes = Number((setup + cleaning + batchMinutes + unitMinutes).toFixed(2));
    const hourlyRate = config?.laborHourlyRate ?? null;

    let totalLaborCost: number | null = null;
    if (hourlyRate !== null && hourlyRate > 0) {
      totalLaborCost = Number(((totalMinutes / 60) * hourlyRate).toFixed(4));
    }

    return {
      totalMinutes,
      setupMinutes: setup,
      batchMinutes,
      unitMinutes,
      cleaningMinutes: cleaning,
      hourlyRate,
      totalLaborCost,
    };
  }

  /**
   * Calculates cooking/process energy cost across 3 legitimate traceable modes:
   * A. QUANTITATIVE (kW * hours * tariff)
   * B. PERCENTAGE (X% of raw materials)
   * C. MANUAL_FLAT (flat fee per batch)
   * If NOT_APPLICABLE: returns 0.00
   * If UNCONFIGURED: returns null (NO FALSE ZERO)
   */
  public static calculateEnergyCost(
    batchesRequired: number,
    totalRawMaterialCost: number,
    config?: Partial<StudyOperationConfig> | null
  ): EnergyCostResult {
    const method = config?.energyMethod ?? 'UNCONFIGURED';

    if (method === 'NOT_APPLICABLE') {
      return {
        method,
        totalEnergyCost: 0.0,
        kwhConsumed: 0,
        details: 'Energía marcada como [NO APLICA] (ej. elaboración en frío).',
      };
    }

    if (method === 'UNCONFIGURED') {
      return {
        method,
        totalEnergyCost: null,
        kwhConsumed: null,
        details: 'Energía en estado [NO CONFIGURADO] (no se asume coste cero).',
      };
    }

    if (method === 'QUANTITATIVE') {
      const power = config?.energyPowerKw ?? null;
      const hours = config?.energyCycleHours ?? null;
      const tariff = config?.energyTariffKwh ?? null;

      if (power === null || hours === null || tariff === null) {
        return {
          method,
          totalEnergyCost: null,
          kwhConsumed: null,
          details: 'Método cuantitativo con parámetros incompletos (kW, horas o tarifa faltantes).',
        };
      }

      // Energy scales per batch run cycle
      const kwhPerCycle = power * hours;
      const totalKwh = kwhPerCycle * batchesRequired;
      const totalCost = Number((totalKwh * tariff).toFixed(4));

      return {
        method,
        totalEnergyCost: totalCost,
        kwhConsumed: Number(totalKwh.toFixed(2)),
        details: `Cuantitativo: ${batchesRequired} ciclo(s) × ${power} kW × ${hours}h @ ${tariff} €/kWh = ${totalCost} €`,
      };
    }

    if (method === 'PERCENTAGE') {
      const pct = config?.energyPercentageRate ?? null;
      if (pct === null || pct < 0) {
        return {
          method,
          totalEnergyCost: null,
          details: 'Método porcentual sin porcentaje configurado.',
        };
      }

      const totalCost = Number((totalRawMaterialCost * (pct / 100)).toFixed(4));
      return {
        method,
        totalEnergyCost: totalCost,
        details: `Porcentual: ${pct}% sobre materia prima (${totalRawMaterialCost} €) = ${totalCost} €`,
      };
    }

    if (method === 'MANUAL_FLAT') {
      const flat = config?.energyFlatFee ?? null;
      if (flat === null || flat < 0) {
        return {
          method,
          totalEnergyCost: null,
          details: 'Coste fijo manual sin importe configurado.',
        };
      }

      const totalCost = Number((flat * batchesRequired).toFixed(4));
      return {
        method,
        totalEnergyCost: totalCost,
        details: `Manual promedio: ${flat} €/lote × ${batchesRequired} lote(s) = ${totalCost} €`,
      };
    }

    return {
      method: 'UNCONFIGURED',
      totalEnergyCost: null,
      details: 'Método de energía desconocido o no configurado.',
    };
  }

  /**
   * Calculates primary (per portion) and secondary (per box/crate) packaging cost.
   * If NOT_APPLICABLE: returns 0.00
   * If UNCONFIGURED: returns null
   */
  public static calculatePackagingCost(
    demandUnits: number,
    config?: Partial<StudyOperationConfig> | null
  ): PackagingCostResult {
    const mode = config?.packagingMode ?? 'UNCONFIGURED';

    if (mode === 'NOT_APPLICABLE') {
      return {
        mode,
        totalPackagingCost: 0.0,
        primaryCost: 0.0,
        secondaryCost: 0.0,
        secondaryBoxesCount: 0,
      };
    }

    if (mode === 'UNCONFIGURED') {
      return {
        mode,
        totalPackagingCost: null,
      };
    }

    const unitCost = config?.packagingUnitCost ?? 0;
    const secondaryCost = config?.packagingSecondaryCost ?? 0;
    const secondaryCapacity = config?.packagingSecondaryCapacity ?? 1;

    const primaryTotal = demandUnits * unitCost;
    const secondaryBoxesCount =
      secondaryCapacity > 0 ? Math.ceil(demandUnits / secondaryCapacity) : 0;
    const secondaryTotal = secondaryBoxesCount * secondaryCost;

    const total = Number((primaryTotal + secondaryTotal).toFixed(4));

    return {
      mode,
      totalPackagingCost: total,
      primaryCost: Number(primaryTotal.toFixed(4)),
      secondaryCost: Number(secondaryTotal.toFixed(4)),
      secondaryBoxesCount,
    };
  }

  /**
   * Computes the complete multidimensional scenario matrix for a demand ramp.
   */
  public static calculateScenarioMatrix(
    demands: number[],
    batchNominalYield: number,
    isFractionalAllowed: boolean,
    surplusDestination: SurplusDestination,
    baseBatchRawMaterialCost: number,
    targetPvp: number | null,
    config?: Partial<StudyOperationConfig> | null
  ): ScenarioCalculationResult[] {
    const defaultRamp = [10, 20, 30, 60, 100, 300];
    const uniqueDemands = Array.from(new Set([...demands])).sort((a, b) => a - b);

    return uniqueDemands.map((demand) => {
      const batchResult = DiscreteBatchEngine.calculateBatches(
        demand,
        batchNominalYield,
        isFractionalAllowed,
        surplusDestination
      );

      const totalRawMaterialCost = Number(
        (batchResult.batchesRequired * baseBatchRawMaterialCost).toFixed(4)
      );

      const laborResult = this.calculateLaborCost(batchResult.batchesRequired, demand, config);
      const energyResult = this.calculateEnergyCost(
        batchResult.batchesRequired,
        totalRawMaterialCost,
        config
      );
      const packagingResult = this.calculatePackagingCost(demand, config);

      // Known direct cost sums whatever components are configured
      let totalKnownDirectCost = totalRawMaterialCost;
      if (laborResult.totalLaborCost !== null) {
        totalKnownDirectCost += laborResult.totalLaborCost;
      }
      if (energyResult.totalEnergyCost !== null) {
        totalKnownDirectCost += energyResult.totalEnergyCost;
      }
      if (packagingResult.totalPackagingCost !== null) {
        totalKnownDirectCost += packagingResult.totalPackagingCost;
      }
      totalKnownDirectCost = Number(totalKnownDirectCost.toFixed(4));

      // Effective cost per sold unit
      const soldCostResult = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
        demand,
        batchResult.unitsProduced,
        totalKnownDirectCost,
        surplusDestination
      );

      const costPerSoldUnit = soldCostResult.costPerSoldUnit;

      // Gross margin %
      let grossMarginPct: number | null = null;
      if (costPerSoldUnit !== null && targetPvp !== null && targetPvp > 0) {
        grossMarginPct = Number((((targetPvp - costPerSoldUnit) / targetPvp) * 100).toFixed(2));
      }

      const warnings: string[] = [];
      if (batchResult.surplusUnits > 0 && surplusDestination === 'UNCONFIGURED') {
        warnings.push(
          `Excedente de ${batchResult.surplusUnits} raciones sin destino configurado: coste efectivo vendido bloqueado.`
        );
      }
      if (laborResult.totalLaborCost === null) {
        warnings.push('Mano de obra en estado [NO CONFIGURADO] (excluida del coste directo).');
      }
      if (energyResult.totalEnergyCost === null) {
        warnings.push('Energía en estado [NO CONFIGURADO] (excluida del coste directo).');
      }
      if (packagingResult.totalPackagingCost === null) {
        warnings.push('Packaging en estado [NO CONFIGURADO] (excluido del coste directo).');
      }

      return {
        demandUnits: demand,
        batchesRequired: batchResult.batchesRequired,
        unitsProduced: batchResult.unitsProduced,
        surplusUnits: batchResult.surplusUnits,
        surplusStatus: surplusDestination,
        totalRawMaterialCost,
        totalLaborCost: laborResult.totalLaborCost,
        totalEnergyCost: energyResult.totalEnergyCost,
        totalPackagingCost: packagingResult.totalPackagingCost,
        totalKnownDirectCost,
        costPerSoldUnit,
        grossMarginPct,
        isCustomScenario: !defaultRamp.includes(demand),
        warnings,
      };
    });
  }
}
