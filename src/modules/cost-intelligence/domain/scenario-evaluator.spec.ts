import { describe, it, expect } from 'vitest';
import { ScenarioEvaluator } from './scenario-evaluator';
import type { ScenarioCalculationResult } from './production-operational-types';

describe('ScenarioEvaluator Domain Engine (CR-COST-07C)', () => {
  const mockScenarios: ScenarioCalculationResult[] = [
    {
      demandUnits: 10,
      batchesRequired: 1,
      unitsProduced: 12,
      surplusUnits: 2,
      surplusStatus: 'STOCK_REFRIGERADO',
      totalRawMaterialCost: 10.2,
      totalLaborCost: 7.5,
      totalEnergyCost: 0.6,
      totalPackagingCost: 1.5,
      totalKnownDirectCost: 19.8,
      costPerSoldUnit: 1.98,
      grossMarginPct: 50.5,
      isCustomScenario: false,
      warnings: [],
    },
    {
      demandUnits: 24,
      batchesRequired: 2,
      unitsProduced: 24,
      surplusUnits: 0,
      surplusStatus: 'STOCK_REFRIGERADO',
      totalRawMaterialCost: 20.4,
      totalLaborCost: 11.25,
      totalEnergyCost: 1.2,
      totalPackagingCost: 3.0,
      totalKnownDirectCost: 35.85,
      costPerSoldUnit: 1.4938,
      grossMarginPct: 62.66,
      isCustomScenario: false,
      warnings: [],
    },
    {
      demandUnits: 60,
      batchesRequired: 5,
      unitsProduced: 60,
      surplusUnits: 0,
      surplusStatus: 'STOCK_REFRIGERADO',
      totalRawMaterialCost: 51.0,
      totalLaborCost: 22.5,
      totalEnergyCost: 3.0,
      totalPackagingCost: 7.5,
      totalKnownDirectCost: 84.0,
      costPerSoldUnit: 1.4,
      grossMarginPct: 65.0,
      isCustomScenario: false,
      warnings: [],
    },
  ];

  it('evaluates capacity and identifies viable vs inviable scenarios', () => {
    // Capacity constraint: max 28 units per run -> 24/28 = 85.7% (>=85%)
    const matrix = ScenarioEvaluator.evaluateMatrix(
      mockScenarios,
      'MINIMIZE_COST',
      { maxUnitsPerRun: 28 },
      null,
      4.0
    );

    expect(matrix.scenarios[0].capacity.isViable).toBe(true);
    expect(matrix.scenarios[0].capacity.status).toBe('VIABLE');
    expect(matrix.scenarios[0].capacity.capacityLoadPct).toBe(42.9); // 12/28 = 42.9%

    expect(matrix.scenarios[1].capacity.isViable).toBe(true);
    expect(matrix.scenarios[1].capacity.status).toBe('BOTTLENECK_NEAR'); // 24/28 = 85.7% >= 85%

    expect(matrix.scenarios[2].capacity.isViable).toBe(false);
    expect(matrix.scenarios[2].capacity.status).toBe('INVIABLE_CAPACITY');
    expect(matrix.scenarios[2].capacity.capacityLoadPct).toBe(214.3); // 60/28 = 214.3%
  });

  it('ENFORCES: Escenario calculable !== escenario viable (inviable scenario can NEVER be recommended)', () => {
    // 60 units has the lowest cost (1.40 € vs 1.4938 €), but capacity is limited to 30 units
    const matrix = ScenarioEvaluator.evaluateMatrix(
      mockScenarios,
      'MINIMIZE_COST',
      { maxUnitsPerRun: 30 },
      null,
      4.0
    );

    // Scenario 2 (60 units) MUST NOT be recommended because it is inviable
    expect(matrix.scenarios[2].isRecommended).toBe(false);
    // Scenario 1 (24 units) should be recommended instead
    expect(matrix.recommendedScenario?.demandUnits).toBe(24);
    expect(matrix.recommendedScenario?.isRecommended).toBe(true);
  });

  it('blocks recommendation if surplus destination is UNCONFIGURED', () => {
    const unconfiguredSurplusScenarios: ScenarioCalculationResult[] = [
      {
        demandUnits: 10,
        batchesRequired: 1,
        unitsProduced: 12,
        surplusUnits: 2,
        surplusStatus: 'UNCONFIGURED',
        totalRawMaterialCost: 10.2,
        totalLaborCost: null,
        totalEnergyCost: null,
        totalPackagingCost: null,
        totalKnownDirectCost: 10.2,
        costPerSoldUnit: null, // blocked
        grossMarginPct: null,
        isCustomScenario: false,
        warnings: ['SURPLUS_DESTINATION_UNCONFIGURED'],
      },
    ];

    const matrix = ScenarioEvaluator.evaluateMatrix(
      unconfiguredSurplusScenarios,
      'MINIMIZE_COST',
      undefined,
      null,
      4.0
    );

    expect(matrix.recommendedScenario).toBeNull();
    expect(matrix.selectionExplanation).toContain('[DESTINO NO CONFIGURADO]');
  });

  it('optimizes for MAXIMIZE_PROFIT correctly', () => {
    // PVP = 4.00 €
    // 10 units profit: (10 * 4) - 19.80 = 20.20 €
    // 24 units profit: (24 * 4) - 35.85 = 60.15 €
    // 60 units profit: (60 * 4) - 84.00 = 156.00 €
    const matrix = ScenarioEvaluator.evaluateMatrix(
      mockScenarios,
      'MAXIMIZE_PROFIT',
      { maxUnitsPerRun: 100 },
      null,
      4.0
    );

    expect(matrix.recommendedScenario?.demandUnits).toBe(60);
    expect(matrix.recommendedScenario?.recommendationReason).toContain('156.00 €');
  });

  it('optimizes for MINIMIZE_SURPLUS correctly', () => {
    const matrix = ScenarioEvaluator.evaluateMatrix(
      mockScenarios,
      'MINIMIZE_SURPLUS',
      { maxUnitsPerRun: 100 },
      null,
      4.0
    );

    // 24 and 60 units both have 0 surplus units, but 60 has higher demand
    expect(matrix.recommendedScenario?.surplusUnits).toBe(0);
    expect(matrix.recommendedScenario?.demandUnits).toBe(60);
  });

  it('handles all scenarios exceeding capacity with null recommendation', () => {
    const matrix = ScenarioEvaluator.evaluateMatrix(
      mockScenarios,
      'MINIMIZE_COST',
      { maxUnitsPerRun: 5 }, // All exceed 5 units
      null,
      4.0
    );

    expect(matrix.recommendedScenario).toBeNull();
    expect(matrix.unviableScenariosCount).toBe(3);
    expect(matrix.selectionExplanation).toContain('superan la capacidad instalada');
  });
});
