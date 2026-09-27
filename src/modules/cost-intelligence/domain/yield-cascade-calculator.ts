// ============================================================================
// YOURMEAL OS — YIELD CASCADE CALCULATOR (CR-COST-07A)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// Deterministic Multi-Stage Yield & Usable Raw Material Calculator
// Constitutional Rule: ZERO ASSUMED DENSITIES · ZERO ASSUMED MERMAS
// ============================================================================

import type {
  StudyIngredient,
  StudyYieldStage,
  YieldCalculationResult,
  CumulativeYieldBreakdown,
  GrossUnit,
  PriceProvenance,
} from './product-economics-types';

export class YieldCascadeCalculator {
  /**
   * Converts gross unit quantities to kilograms for mass balance calculations.
   * STRICT CONSTITUTIONAL RULE: NEVER ASSUME DENSITY (e.g. 1 kg/L) OR PIECE MASS.
   * If density or piece mass is not configured, returns null.
   */
  public static calculateIngredientMassKg(
    grossQuantity: number,
    unit: GrossUnit,
    densityKgPerL?: number | null,
    pieceMassKg?: number | null
  ): number | null {
    if (grossQuantity <= 0) return 0;

    switch (unit) {
      case 'kg':
        return Number(grossQuantity.toFixed(4));
      case 'g':
        return Number((grossQuantity * 0.001).toFixed(4));
      case 'l':
        if (densityKgPerL === undefined || densityKgPerL === null || densityKgPerL <= 0) {
          return null; // DENSIDAD NO CONFIGURADA: PROHIBIDO ASUMIR 1.0 kg/L
        }
        return Number((grossQuantity * densityKgPerL).toFixed(4));
      case 'ml':
        if (densityKgPerL === undefined || densityKgPerL === null || densityKgPerL <= 0) {
          return null; // DENSIDAD NO CONFIGURADA: PROHIBIDO ASUMIR 1.0 kg/L
        }
        return Number((grossQuantity * 0.001 * densityKgPerL).toFixed(4));
      case 'unit':
        if (pieceMassKg === undefined || pieceMassKg === null || pieceMassKg <= 0) {
          return null; // MASA POR PIEZA NO CONFIGURADA: PROHIBIDO ASUMIR 0.06 kg
        }
        return Number((grossQuantity * pieceMassKg).toFixed(4));
      default:
        return null;
    }
  }

  /**
   * Computes the net usable quantity for an individual ingredient after trimming loss.
   * STRICT CONSTITUTIONAL RULE: NULL means [NO CONFIGURADO]. NEVER DEFAULT TO 0%.
   * Returns null if trimmingLossPct is null or undefined.
   */
  public static calculateIngredientNetUsable(
    grossQuantity: number,
    trimmingLossPct: number | null | undefined
  ): number | null {
    if (grossQuantity <= 0) return 0;
    if (trimmingLossPct === null || trimmingLossPct === undefined) {
      return null; // MERMA NO CONFIGURADA: PROHIBIDO ASUMIR 0%
    }
    const clampedLoss = Math.max(0, Math.min(trimmingLossPct, 99.99));
    return Number((grossQuantity * (1 - clampedLoss / 100)).toFixed(4));
  }

  /**
   * Computes the complete multi-stage yield cascade and effective raw material costs.
   */
  public static calculateYieldCascade(
    ingredients: StudyIngredient[],
    stages: StudyYieldStage[],
    batchNominalYield: number
  ): YieldCalculationResult {
    let totalGrossMaterialCost = 0;
    let realCost = 0;
    let observedCost = 0;
    let manualCost = 0;

    let hasMassUnconfigured = false;
    let hasTrimmingUnconfigured = false;
    let totalGrossWeightKgAccumulator = 0;
    let totalNetUsableWeightKgAccumulator = 0;

    const epistemicWarnings: string[] = [];

    for (const ing of ingredients) {
      const lineCost = ing.grossQuantity * ing.unitPrice;
      totalGrossMaterialCost += lineCost;

      if (ing.priceProvenance === 'REAL') {
        realCost += lineCost;
      } else if (ing.priceProvenance === 'OBSERVADO') {
        observedCost += lineCost;
      } else {
        manualCost += lineCost;
      }

      // Check trimming configuration
      if (ing.trimmingLossPct === null || ing.trimmingLossPct === undefined) {
        hasTrimmingUnconfigured = true;
        epistemicWarnings.push(
          `[MERMA DE LIMPIEZA NO CONFIGURADA]: ${ing.ingredientName} no tiene merma definida (no se asume 0%).`
        );
      }

      // Check mass conversion configuration
      const grossMass = this.calculateIngredientMassKg(
        ing.grossQuantity,
        ing.grossUnit,
        ing.densityKgPerL,
        ing.pieceMassKg
      );

      if (grossMass === null) {
        hasMassUnconfigured = true;
        if (ing.grossUnit === 'l' || ing.grossUnit === 'ml') {
          epistemicWarnings.push(
            `[DENSIDAD NO CONFIGURADA]: ${ing.ingredientName} en ${ing.grossUnit} requiere densidad para calcular masa (prohibido asumir 1 kg/L).`
          );
        } else if (ing.grossUnit === 'unit') {
          epistemicWarnings.push(
            `[MASA POR UNIDAD NO CONFIGURADA]: ${ing.ingredientName} en unidades requiere peso medio por pieza (prohibido asumir masa).`
          );
        }
      } else {
        totalGrossWeightKgAccumulator += grossMass;

        if (ing.netUsableQuantity !== null && ing.netUsableQuantity !== undefined) {
          const netMass = this.calculateIngredientMassKg(
            ing.netUsableQuantity,
            ing.grossUnit,
            ing.densityKgPerL,
            ing.pieceMassKg
          );
          if (netMass !== null) {
            totalNetUsableWeightKgAccumulator += netMass;
          }
        }
      }
    }

    // Sort stages by order
    const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

    let processFactor = 1.0;
    const stagesBreakdown: CumulativeYieldBreakdown[] = [];

    // Process stages factor
    for (const stage of sortedStages) {
      const clampedLoss = Math.max(0, Math.min(stage.lossPercentage, 99.99));
      const stepRetention = 1 - clampedLoss / 100;
      processFactor *= stepRetention;

      stagesBreakdown.push({
        stageOrder: stage.stageOrder,
        stageName: stage.stageName,
        lossPct: clampedLoss,
        remainingMassFactor: Number(processFactor.toFixed(4)),
        massAtStageEnd:
          !hasMassUnconfigured && !hasTrimmingUnconfigured
            ? Number((totalNetUsableWeightKgAccumulator * processFactor).toFixed(4))
            : null,
      });
    }

    const cookingAndProcessYieldPct = Number((processFactor * 100).toFixed(2));

    const totalGrossWeightKg =
      !hasMassUnconfigured && totalGrossWeightKgAccumulator > 0
        ? Number(totalGrossWeightKgAccumulator.toFixed(4))
        : null;

    const totalNetUsableWeightKg =
      !hasMassUnconfigured && !hasTrimmingUnconfigured && totalNetUsableWeightKgAccumulator > 0
        ? Number(totalNetUsableWeightKgAccumulator.toFixed(4))
        : null;

    const trimmingYieldPct =
      totalGrossWeightKg !== null && totalNetUsableWeightKg !== null && totalGrossWeightKg > 0
        ? Number(((totalNetUsableWeightKg / totalGrossWeightKg) * 100).toFixed(2))
        : null;

    const finishedProductMassKg =
      totalNetUsableWeightKg !== null
        ? Number((totalNetUsableWeightKg * processFactor).toFixed(4))
        : null;

    const cumulativeGlobalYieldPct =
      totalGrossWeightKg !== null && finishedProductMassKg !== null && totalGrossWeightKg > 0
        ? Number(((finishedProductMassKg / totalGrossWeightKg) * 100).toFixed(2))
        : null;

    const effectiveCostPerKgVendible =
      finishedProductMassKg !== null && finishedProductMassKg > 0
        ? Number((totalGrossMaterialCost / finishedProductMassKg).toFixed(4))
        : null;

    // Monetary cost per nominal portion is ALWAYS exact (does not depend on mass conversion)
    const rawMaterialCostPerNominalPortion =
      batchNominalYield > 0
        ? Number((totalGrossMaterialCost / batchNominalYield).toFixed(4))
        : 0;

    // Provenance calculation
    const realPct =
      totalGrossMaterialCost > 0
        ? Number(((realCost / totalGrossMaterialCost) * 100).toFixed(1))
        : 0;
    const observedPct =
      totalGrossMaterialCost > 0
        ? Number(((observedCost / totalGrossMaterialCost) * 100).toFixed(1))
        : 0;
    const manualPct =
      totalGrossMaterialCost > 0
        ? Number(((manualCost / totalGrossMaterialCost) * 100).toFixed(1))
        : 100;

    let dominantProvenance: PriceProvenance = 'MANUAL';
    if (realPct >= observedPct && realPct >= manualPct && realPct > 0) {
      dominantProvenance = 'REAL';
    } else if (observedPct >= manualPct && observedPct > 0) {
      dominantProvenance = 'OBSERVADO';
    }

    return {
      totalGrossMaterialCost: Number(totalGrossMaterialCost.toFixed(4)),
      totalGrossWeightKg,
      totalNetUsableWeightKg,
      trimmingYieldPct,
      cookingAndProcessYieldPct,
      cumulativeGlobalYieldPct,
      finishedProductMassKg,
      nominalPortionsProduced: batchNominalYield,
      effectiveCostPerKgVendible,
      rawMaterialCostPerNominalPortion,
      provenanceDistribution: {
        realPct,
        observedPct,
        manualPct,
        dominantProvenance,
      },
      stagesBreakdown,
      epistemicWarnings,
    };
  }
}
