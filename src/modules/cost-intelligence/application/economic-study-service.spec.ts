import { describe, it, expect, beforeEach } from 'vitest';
import { EconomicStudyService } from './economic-study-service';
import { InMemoryEconomicStudyRepository } from '../infrastructure/economic-study-repository';

describe('EconomicStudyService (CR-COST-07A & 07B)', () => {
  let repository: InMemoryEconomicStudyRepository;
  let service: EconomicStudyService;
  const tenantId = 'tenant-eatclean-123';

  beforeEach(() => {
    repository = new InMemoryEconomicStudyRepository();
    service = new EconomicStudyService(repository);
  });

  it('creates an incomplete draft without blocking or requiring immediate full data', async () => {
    const { study, version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    expect(study.id).toBeDefined();
    expect(study.productName).toBe('Tarta de Zanahoria Casera');
    expect(study.currentStatus).toBe('BORRADOR');
    expect(study.activeVersionNumber).toBe(1);

    expect(version.versionNumber).toBe(1);
    expect(version.versionStatus).toBe('BORRADOR');
    expect(version.isFrozen).toBe(false);
    expect(version.conclusionTier).toBe('INSUFFICIENT_DATA');
  });

  it('adds ingredients with explicit trimming loss and preserves null when unconfigured', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    const carrot = await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahoria fresca',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 10.0,
    });

    expect(carrot.grossQuantity).toBe(2.0);
    expect(carrot.netUsableQuantity).toBe(1.8);
    expect(carrot.trimmingLossPct).toBe(10.0);

    const flour = await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Harina de trigo',
      grossQuantity: 0.5,
      grossUnit: 'kg',
      unitPrice: 0.9,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 0.0,
    });

    expect(flour.netUsableQuantity).toBe(0.5);
    expect(flour.trimmingLossPct).toBe(0.0);

    const cheese = await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Queso crema',
      grossQuantity: 0.5,
      grossUnit: 'kg',
      unitPrice: 4.5,
      priceProvenance: 'MANUAL',
      trimmingLossPct: null,
    });

    expect(cheese.netUsableQuantity).toBeNull();
    expect(cheese.trimmingLossPct).toBeNull();

    const summary = await service.getStudySummary(version.studyId, tenantId);
    expect(summary.activeVersion.conclusionTier).toBe('CONDITIONED');
    expect(summary.conclusion.tier).toBe('CONDITIONED');
  });

  it('adds multi-stage yield and calculates cumulative yields', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahoria fresca',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 10.0,
    });

    await service.addYieldStage({
      versionId: version.id,
      stageOrder: 1,
      stageName: 'Cocción y evaporación al horno',
      lossPercentage: 6.0,
      provenance: 'OBSERVADO',
    });

    await service.addYieldStage({
      versionId: version.id,
      stageOrder: 2,
      stageName: 'Porcionado y recorte de bordes',
      lossPercentage: 3.0,
      provenance: 'MANUAL',
    });

    const yieldResult = await service.calculateYield(version.id);

    expect(yieldResult.totalGrossMaterialCost).toBeCloseTo(2.3, 2);
    expect(yieldResult.stagesBreakdown).toHaveLength(2);
    expect(yieldResult.cookingAndProcessYieldPct).toBeCloseTo(91.18, 1);
    expect(yieldResult.effectiveCostPerKgVendible).toBeGreaterThan(1.15);
  });

  it('07B: configures operational costs and generates scenario matrix', async () => {
    const { version, study } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahoria',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 10.0,
    });

    // Configure 07B operational parameters
    await service.configureOperations({
      versionId: version.id,
      laborSetupMinutes: 15,
      laborCleaningMinutes: 15,
      laborBatchMinutes: 10,
      laborUnitMinutes: 0.5,
      laborHourlyRate: 18.0,
      energyMethod: 'QUANTITATIVE',
      energyPowerKw: 3.5,
      energyCycleHours: 1.0,
      energyTariffKwh: 0.2,
      packagingMode: 'CONFIGURED',
      packagingUnitCost: 0.25,
      packagingSecondaryCost: 0.8,
      packagingSecondaryCapacity: 12,
    });

    // Update surplus destination to STOCK_REFRIGERADO
    await service.updateVersionSpecifications(version.id, {
      surplusDestination: 'STOCK_REFRIGERADO',
    });

    // Generate scenarios with custom demand 42
    const scenarios = await service.generateScenarios(version.id, tenantId, [42]);

    // Default ramp [10, 20, 30, 60, 100, 300] + 42 = 7 scenarios
    expect(scenarios).toHaveLength(7);

    // Scenario 42 is flagged as custom
    const s42 = scenarios.find((s) => s.demandUnits === 42)!;
    expect(s42.isCustomScenario).toBe(true);
    expect(s42.batchesRequired).toBe(4); // ceil(42/12) = 4

    // Scenarios are persisted in repository
    const summary = await service.getStudySummary(study.id, tenantId);
    expect(summary.scenarios).toHaveLength(7);
    expect(summary.operationConfig?.energyMethod).toBe('QUANTITATIVE');
    expect(summary.study.currentStatus).toBe('ESTUDIADO');
  });

  it('freezes a version and prevents further operational or ingredient mutations', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria',
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Harina',
      grossQuantity: 1.0,
      grossUnit: 'kg',
      unitPrice: 0.9,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 0.0,
    });

    const frozen = await service.freezeVersion(version.id);
    expect(frozen.isFrozen).toBe(true);

    // Attempting to configure operations on frozen version must throw
    await expect(
      service.configureOperations({
        versionId: version.id,
        laborHourlyRate: 18.0,
      })
    ).rejects.toThrow(/frozen and immutable/);
  });

  it('creates an immutable Version 2 cloning specifications, operations, and snapshotting market prices', async () => {
    const { study, version: v1 } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: v1.id,
      ingredientName: 'Zanahoria fresca',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 10.0,
    });

    await service.configureOperations({
      versionId: v1.id,
      energyMethod: 'PERCENTAGE',
      energyPercentageRate: 5.0,
    });

    await service.freezeVersion(v1.id);

    const marketSnapshot = {
      'zanahoria-sku-1': {
        priceId: 'obs-2026-09-28',
        marketProductId: 'prod-zanahoria',
        sourceId: 'makro',
        sourceName: 'Makro Adeje',
        unitPrice: 1.25,
        unit: 'EUR_PER_KG',
        observedAt: '2026-09-28T09:00:00Z',
      },
    };

    const v2 = await service.createNewVersion(study.id, tenantId, marketSnapshot);

    expect(v2.versionNumber).toBe(2);
    expect(v2.isFrozen).toBe(false);

    // Operation config was cloned to v2
    const v2Op = await repository.getOperationConfig(v2.id);
    expect(v2Op?.energyMethod).toBe('PERCENTAGE');
    expect(v2Op?.energyPercentageRate).toBe(5.0);
  });

  // ==========================================================================
  // CR-COST-07C TESTS: BREAK-EVEN, CAPACITY, VARIANCE, SYNTHESIS & DECISION
  // ==========================================================================
  it('07C: calculates break-even and recommended PVP for target margin', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Masa base',
      grossQuantity: 1.0,
      grossUnit: 'kg',
      unitPrice: 10.2, // 10.20 € for 12 portions = 0.85 €/portion
      priceProvenance: 'REAL',
      trimmingLossPct: 0,
    });

    await service.configureOperations({
      versionId: version.id,
      laborSetupMinutes: 30, // 0.5h
      laborCleaningMinutes: 30, // 0.5h -> Total 1h fixed labor
      laborBatchMinutes: 15,
      laborUnitMinutes: 1,
      laborHourlyRate: 15.0, // 15 €/h
      energyMethod: 'QUANTITATIVE',
      energyPowerKw: 3.0,
      energyCycleHours: 1.0,
      energyTariffKwh: 0.2, // 0.60 € / 12 = 0.05 €/unit
      packagingMode: 'CONFIGURED',
      packagingUnitCost: 0.15,
      packagingSecondaryCost: 1.2,
      packagingSecondaryCapacity: 12, // 0.10 €/unit
    });

    const breakEven = await service.calculateBreakEven(version.id, 70.0);

    expect(breakEven.batchMetrics.fixedCostPerBatch).toBe(15.0);
    expect(breakEven.batchMetrics.variableCostPerUnit).toBe(1.7125);
    expect(breakEven.batchMetrics.contributionMarginPerUnit).toBe(2.2875);
    expect(breakEven.batchMetrics.isReachable).toBe(true);
    expect(breakEven.batchMetrics.breakEvenBatchUnits).toBe(7);

    // Recommended PVP for 70% margin = 1.7125 / (1 - 0.70) = 5.7083 €
    expect(breakEven.pvpRecommendation.minimumViablePvp).toBe(5.7083);
    expect(breakEven.pvpRecommendation.isPartialPvp).toBe(false);
  });

  it('07C: evaluates scenarios and ENFORCES: escenario calculable !== viable por capacidad', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.0,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Masa base',
      grossQuantity: 1.0,
      grossUnit: 'kg',
      unitPrice: 10.2,
      priceProvenance: 'REAL',
      trimmingLossPct: 0,
    });

    await service.configureOperations({
      versionId: version.id,
      laborHourlyRate: 15.0,
      energyMethod: 'NOT_APPLICABLE',
      packagingMode: 'NOT_APPLICABLE',
    });

    await service.updateVersionSpecifications(version.id, {
      surplusDestination: 'STOCK_REFRIGERADO',
    });

    // Generate standard scenarios [10, 20, 30, 60, 100, 300]
    await service.generateScenarios(version.id, tenantId);

    // Capacity constraint: kitchen can only produce max 30 units per run
    const matrix = await service.evaluateScenariosAndRecommend(
      version.id,
      'MINIMIZE_COST',
      { maxUnitsPerRun: 30 }
    );

    // Scenarios 60, 100, 300 have lower unit cost, but are INVIABLE by capacity!
    const s60 = matrix.scenarios.find((s) => s.demandUnits === 60)!;
    expect(s60.capacity.isViable).toBe(false);
    expect(s60.capacity.status).toBe('INVIABLE_CAPACITY');
    expect(s60.isRecommended).toBe(false);

    // Scenario 20 (24 units produced) is viable and complies with <= 30 max units
    expect(matrix.recommendedScenario).toBeDefined();
    expect(matrix.recommendedScenario?.demandUnits).toBeLessThanOrEqual(30);
    expect(matrix.recommendedScenario?.isRecommended).toBe(true);
  });

  it('07C: checks market price variances between frozen snapshot and current market prices', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
    });

    const marketPricesSnapshot = {
      'harina-makro': {
        priceId: 'price-123',
        marketProductId: 'prod-harina',
        sourceId: 'makro',
        sourceName: 'Makro Harina',
        unitPrice: 1.1,
        unit: 'kg',
        observedAt: '2026-09-20T10:00:00Z',
      },
    };

    await repository.updateVersion(version.id, {
      marketPricesSnapshot,
    });

    const currentPrices = {
      'price-123': 1.35, // Price rose from 1.10 to 1.35 (+22.73%)
    };

    const variance = await service.checkMarketVariance(version.id, currentPrices);

    expect(variance.isOutdated).toBe(true);
    expect(variance.hasPriceIncreases).toBe(true);
    expect(variance.maxDeltaPercentage).toBe(22.73);
    expect(variance.impactedIngredients[0].deltaAmount).toBe(0.25);
    expect(variance.explanation).toContain('+22.73%');
  });

  it('07C: generates executive synthesis and records formal sovereign decision', async () => {
    const { version, study } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.5,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahorias',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.2,
      priceProvenance: 'REAL',
      trimmingLossPct: 0,
    });

    await service.configureOperations({
      versionId: version.id,
      laborHourlyRate: 15.0,
      energyMethod: 'NOT_APPLICABLE',
      packagingMode: 'NOT_APPLICABLE',
    });

    await service.updateVersionSpecifications(version.id, {
      surplusDestination: 'STOCK_REFRIGERADO',
    });

    await service.generateScenarios(version.id, tenantId);

    // Generate synthesis with goal MINIMIZE_SURPLUS (picks 60 units with 0 surplus)
    const synthesis = await service.generateExecutiveSynthesis(
      version.id,
      tenantId,
      'MINIMIZE_SURPLUS',
      { maxUnitsPerRun: 150 }
    );

    expect(synthesis.evaluationMatrix.recommendedScenario?.demandUnits).toBe(60);
    expect(synthesis.evaluationMatrix.recommendedScenario?.surplusUnits).toBe(0);
    expect(synthesis.verdict.status).toBe('VIABLE');
    expect(synthesis.verdict.conclusionTier).toBe('CERTIFIED');
    expect(synthesis.breakEven.batchMetrics.isReachable).toBe(true);

    // Record human sovereign decision
    const decision = await service.recordDecision({
      versionId: version.id,
      tenantId,
      verdict: 'APPROVED_FOR_MENU',
      humanStatus: 'APPROVED',
      executiveSummaryText: synthesis.verdict.narrativeSummary,
      selectedScenarioDemand: synthesis.evaluationMatrix.recommendedScenario?.demandUnits,
      recommendedPvp: 4.5,
      decisionNotes: 'Aprobado por el chef ejecutivo para menú de otoño.',
    });

    expect(decision.id).toBeDefined();
    expect(decision.decisionVerdict).toBe('APPROVED_FOR_MENU');
    expect(decision.humanDecisionStatus).toBe('APPROVED');

    // Study lifecycle must advance to DECISION
    const updatedStudy = await repository.getStudyById(study.id, tenantId);
    expect(updatedStudy?.currentStatus).toBe('DECISION');

    // Version must be frozen and immutable
    const updatedVersion = await repository.getVersionById(version.id);
    expect(updatedVersion?.isFrozen).toBe(true);
    expect(updatedVersion?.versionStatus).toBe('CONGELADA');

    // Summary reflects recorded decision
    const summary = await service.getStudySummary(study.id, tenantId);
    expect(summary.decision?.decisionVerdict).toBe('APPROVED_FOR_MENU');
  });
});
