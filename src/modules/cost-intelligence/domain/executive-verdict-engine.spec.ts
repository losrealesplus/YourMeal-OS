import { describe, it, expect } from 'vitest';
import { ExecutiveVerdictEngine } from './executive-verdict-engine';
import type {
  StudyVersion,
  StudyIngredient,
} from './product-economics-types';
import type { StudyOperationConfig } from './production-operational-types';
import type {
  BreakEvenAnalysisResult,
  EvaluatedScenario,
  ScenarioEvaluationMatrix,
} from './decision-intelligence-types';

describe('ExecutiveVerdictEngine Domain Engine (CR-COST-07C)', () => {
  const baseVersion: StudyVersion = {
    id: 'ver-1',
    studyId: 'study-1',
    versionNumber: 1,
    versionStatus: 'BORRADOR',
    targetPvp: 4.0,
    salesUnit: 'ración',
    salesUnitSize: 1,
    batchUnitName: 'tarta',
    batchNominalYield: 12,
    isFractionalAllowed: false,
    surplusDestination: 'STOCK_REFRIGERADO',
    conclusionTier: 'CERTIFIED',
    provenanceSummary: 'REAL',
    marketPricesSnapshot: {},
    isFrozen: false,
    createdAt: new Date().toISOString(),
  };

  const ingredients: StudyIngredient[] = [
    {
      id: 'ing-1',
      versionId: 'ver-1',
      ingredientName: 'Harina de Trigo',
      grossQuantity: 0.5,
      grossUnit: 'kg',
      unitPrice: 1.2,
      priceProvenance: 'REAL',
      densityKgPerL: null,
      pieceMassKg: null,
      trimmingLossPct: 0,
      netUsableQuantity: 0.5,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ing-2',
      versionId: 'ver-1',
      ingredientName: 'Queso Crema',
      grossQuantity: 0.4,
      grossUnit: 'kg',
      unitPrice: 4.5,
      priceProvenance: 'MANUAL', // Manual provenance!
      densityKgPerL: null,
      pieceMassKg: null,
      trimmingLossPct: 0,
      netUsableQuantity: 0.4,
      createdAt: new Date().toISOString(),
    },
  ];

  const opConfig: StudyOperationConfig = {
    id: 'op-1',
    versionId: 'ver-1',
    laborSetupMinutes: 15,
    laborCleaningMinutes: 15,
    laborBatchMinutes: 10,
    laborUnitMinutes: 1,
    laborHourlyRate: 15.0,
    energyMethod: 'QUANTITATIVE',
    energyPowerKw: 2.0,
    energyCycleHours: 1.0,
    energyTariffKwh: 0.2,
    packagingMode: 'CONFIGURED',
    packagingUnitCost: 0.1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const recommendedScenario: EvaluatedScenario = {
    demandUnits: 24,
    batchesRequired: 2,
    unitsProduced: 24,
    surplusUnits: 0,
    surplusStatus: 'STOCK_REFRIGERADO',
    totalRawMaterialCost: 20.4,
    totalLaborCost: 18.5,
    totalEnergyCost: 0.8,
    totalPackagingCost: 2.4,
    totalKnownDirectCost: 42.1,
    costPerSoldUnit: 1.7542,
    grossMarginPct: 56.15,
    isCustomScenario: false,
    warnings: [],
    capacity: {
      demandUnits: 24,
      unitsProduced: 24,
      capacityLoadPct: 80.0,
      status: 'VIABLE',
      isViable: true,
      exceededBottlenecks: [],
    },
    isRecommended: true,
    recommendationReason: 'Optimiza coste unitario respetando capacidad.',
  };

  const matrix: ScenarioEvaluationMatrix = {
    goal: 'MINIMIZE_COST',
    scenarios: [recommendedScenario],
    recommendedScenario,
    selectionExplanation: 'Escenario de 24 unidades recomendado.',
    unviableScenariosCount: 0,
  };

  const breakEven: BreakEvenAnalysisResult = {
    batchMetrics: {
      fixedCostPerBatch: 7.5,
      variableCostPerUnit: 1.44,
      contributionMarginPerUnit: 2.56,
      contributionMarginRatio: 0.64,
      breakEvenBatchUnits: 3,
      isReachable: true,
    },
    pvpRecommendation: {
      targetMarginPct: 70,
      minimumViablePvp: 4.8,
      foodCostRatioPct: 21.25,
      isPartialPvp: false,
      unconfiguredCostFactors: [],
    },
    requiredCapacityMinutesPer100Units: 220,
    warnings: [],
  };

  it('declares INSUFFICIENT_DATA when target PVP is missing', () => {
    const noPvpVersion = { ...baseVersion, targetPvp: null };
    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      'Tarta de Zanahoria',
      noPvpVersion,
      ingredients,
      opConfig,
      matrix,
      breakEven
    );

    expect(verdict.status).toBe('INSUFFICIENT_DATA');
    expect(verdict.conclusionTier).toBe('INSUFFICIENT_DATA');
    expect(verdict.headline).toContain('INFORMACIÓN INSUFICIENTE');
    expect(verdict.epistemicGaps).toContain('PVP objetivo no establecido.');
  });

  it('declares INSUFFICIENT_DATA when surplus destination is UNCONFIGURED and surplus exists', () => {
    const unconfiguredSurplusMatrix: ScenarioEvaluationMatrix = {
      ...matrix,
      scenarios: [
        {
          ...recommendedScenario,
          surplusUnits: 4,
          surplusStatus: 'UNCONFIGURED',
        },
      ],
      recommendedScenario: null,
    };

    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      'Tarta de Zanahoria',
      baseVersion,
      ingredients,
      opConfig,
      unconfiguredSurplusMatrix,
      breakEven
    );

    expect(verdict.status).toBe('INSUFFICIENT_DATA');
    expect(verdict.epistemicGaps.some((g) => g.includes('excedentes'))).toBe(true);
  });

  it('declares VIABLE_CONDITIONED when manual ingredients or sensitivity factors are present', () => {
    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      'Tarta de Zanahoria',
      baseVersion,
      ingredients, // Contains Queso Crema as MANUAL
      opConfig,
      matrix,
      breakEven
    );

    expect(verdict.status).toBe('VIABLE_CONDITIONED');
    expect(verdict.conclusionTier).toBe('CONDITIONED');
    expect(verdict.headline).toContain('CONDICIONANTES');
    expect(verdict.sensitivityFactors.some((s) => s.includes('Queso Crema'))).toBe(true);
  });

  it('declares NOT_VIABLE when gross margin is under 50%', () => {
    const lowMarginScenario: EvaluatedScenario = {
      ...recommendedScenario,
      grossMarginPct: 35.0, // Low margin!
    };
    const lowMarginMatrix: ScenarioEvaluationMatrix = {
      ...matrix,
      scenarios: [lowMarginScenario],
      recommendedScenario: lowMarginScenario,
    };

    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      'Tarta de Zanahoria',
      baseVersion,
      ingredients,
      opConfig,
      lowMarginMatrix,
      breakEven
    );

    expect(verdict.status).toBe('NOT_VIABLE');
    expect(verdict.headline).toContain('MARGEN BRUTO INSUFICIENTE');
    expect(verdict.recommendedAction).toContain('Se recomienda un PVP mínimo');
  });

  it('declares VIABLE and CERTIFIED when all ingredients are REAL and data is complete', () => {
    const realIngredients = ingredients.map((i) => ({
      ...i,
      priceProvenance: 'REAL' as const,
    }));

    const verdict = ExecutiveVerdictEngine.synthesizeVerdict(
      'Tarta de Zanahoria',
      baseVersion,
      realIngredients,
      opConfig,
      matrix,
      breakEven
    );

    expect(verdict.status).toBe('VIABLE');
    expect(verdict.conclusionTier).toBe('CERTIFIED');
    expect(verdict.headline).toContain('PRODUCTO VIABLE Y CERTIFICADO');
    expect(verdict.recommendedAction).toContain('Aprobado para inclusión inmediata');
  });
});
