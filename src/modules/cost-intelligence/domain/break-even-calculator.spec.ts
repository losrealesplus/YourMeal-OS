import { describe, it, expect } from 'vitest';
import { BreakEvenCalculator } from './break-even-calculator';
import type { StudyOperationConfig } from './production-operational-types';

describe('BreakEvenCalculator Domain Engine (CR-COST-07C)', () => {
  const baseOpConfig: StudyOperationConfig = {
    id: 'op-1',
    versionId: 'ver-1',
    laborSetupMinutes: 30, // 0.5h
    laborCleaningMinutes: 30, // 0.5h -> Total fixed 1h
    laborBatchMinutes: 15,
    laborUnitMinutes: 1,
    laborHourlyRate: 15.0, // 15 €/h
    energyMethod: 'QUANTITATIVE',
    energyPowerKw: 3.0,
    energyCycleHours: 1.0,
    energyTariffKwh: 0.2, // 3 * 1 * 0.2 = 0.60 € per batch
    packagingMode: 'CONFIGURED',
    packagingUnitCost: 0.15,
    packagingSecondaryCost: 1.2,
    packagingSecondaryCapacity: 12, // 0.10 €/unit
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('calculates fixed batch setup cost and variable unit cost accurately', () => {
    // rawMaterial: 0.85 €/portion
    // Fixed labor: 1h * 15 € = 15.00 €
    // Fixed energy: 0 (quantitative energy is variable per batch)
    // Nominal batch yield: 12 portions
    // Variable labor per unit: (15min/12 + 1min) / 60 * 15 € = (1.25 + 1)/60 * 15 = 2.25/60 * 15 = 0.5625 €
    // Variable energy per unit: 0.60 € / 12 = 0.05 €
    // Packaging per unit: 0.15 + (1.20/12) = 0.25 €
    // Total variable per unit: 0.85 + 0.5625 + 0.05 + 0.25 = 1.7125 €
    const result = BreakEvenCalculator.calculateBreakEven(
      0.85,
      12,
      4.0,
      baseOpConfig,
      70
    );

    expect(result.batchMetrics.fixedCostPerBatch).toBe(15.0);
    expect(result.batchMetrics.variableCostPerUnit).toBe(1.7125);
    expect(result.batchMetrics.contributionMarginPerUnit).toBe(2.2875); // 4.00 - 1.7125
    expect(result.batchMetrics.isReachable).toBe(true);

    // Break-even units: ceil(15.0 / 2.2875) = ceil(6.557) = 7 units
    expect(result.batchMetrics.breakEvenBatchUnits).toBe(7);
  });

  it('detects when contribution margin is negative and marks break-even unreachable', () => {
    // If target PVP is 1.50 € while variable cost is 1.7125 €
    const result = BreakEvenCalculator.calculateBreakEven(
      0.85,
      12,
      1.5,
      baseOpConfig,
      70
    );

    expect(result.batchMetrics.isReachable).toBe(false);
    expect(result.batchMetrics.unreachableReason).toBe('CONTRIBUTION_MARGIN_NEGATIVE_OR_ZERO');
    expect(result.batchMetrics.breakEvenBatchUnits).toBeNull();
    expect(result.warnings).toContain('CONTRIBUTION_MARGIN_NEGATIVE_OR_ZERO');
  });

  it('marks break-even unreachable when target PVP is null without assuming false zeros', () => {
    const result = BreakEvenCalculator.calculateBreakEven(
      0.85,
      12,
      null,
      baseOpConfig,
      70
    );

    expect(result.batchMetrics.isReachable).toBe(false);
    expect(result.batchMetrics.unreachableReason).toBe('TARGET_PVP_MISSING');
    expect(result.batchMetrics.contributionMarginPerUnit).toBeNull();
    expect(result.warnings).toContain('TARGET_PVP_MISSING');
  });

  it('recommends minimum viable PVP for target margin and flags unconfigured factors', () => {
    // Unconfigured operation config
    const result = BreakEvenCalculator.calculateBreakEven(
      1.0,
      10,
      5.0,
      null, // No operation config
      70.0 // 70% target margin
    );

    // Divisor = 1 - 0.70 = 0.30 -> 1.0 / 0.30 = 3.3333 €
    expect(result.pvpRecommendation.minimumViablePvp).toBe(3.3333);
    expect(result.pvpRecommendation.isPartialPvp).toBe(true);
    expect(result.pvpRecommendation.unconfiguredCostFactors).toContain('LABOR');
    expect(result.pvpRecommendation.unconfiguredCostFactors).toContain('ENERGY');
    expect(result.pvpRecommendation.unconfiguredCostFactors).toContain('PACKAGING');
  });

  it('calculates required labor capacity minutes for 100 units', () => {
    const result = BreakEvenCalculator.calculateBreakEven(
      0.85,
      12,
      4.0,
      baseOpConfig,
      70
    );

    // 100 units / 12 = 9 batches (ceil)
    // Setup (30) + Cleaning (30) + 9 batches * 15 min (135) + 100 * 1 min (100) = 295 minutes
    expect(result.requiredCapacityMinutesPer100Units).toBe(295);
  });
});
