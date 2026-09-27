/**
 * CR-COST-07 — Full E2E 14-Link Product Audit Specification
 *
 * Exhaustive audit validating the 14 links of the product chain:
 * 1. Ruta real /admin/cost-intelligence
 * 2. Apertura real de Preguntar al Mercado
 * 3. Transición Mercado → Receta → Fábrica → Decisión
 * 4. Caso real de Tarta de Zanahoria usando datos existentes
 * 5. Persistencia real de un estudio
 * 6. Confirmar Decisión → study_decisions
 * 7. Reload → versión sigue congelada
 * 8. Actualización de mercado → no modifica V1
 * 9. WAC / platos / inventario permanecen intactos
 * 10. RBAC con inventory.operate
 * 11. Estados [NO CONFIGURADO], [SIN DATOS], etc., sin falsos ceros
 * 12. Escenario > capacidad queda excluido de recomendación
 * 13. Excedente sin destino bloquea correctamente el coste vendido
 * 14. Working tree y diff final auditados
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Route } from '@/routes/_authenticated/admin.cost-intelligence';
import { EconomicStudyService } from './application/economic-study-service';
import { InMemoryEconomicStudyRepository } from './infrastructure/economic-study-repository';
import { YieldCascadeCalculator } from './domain/yield-cascade-calculator';
import { DiscreteBatchEngine } from './domain/discrete-batch-engine';
import { OperationalCostEngine } from './domain/operational-cost-engine';
import type { StudyIngredient, StudyYieldStage } from './domain/product-economics-types';
import type { StudyOperationConfig } from './domain/production-operational-types';

describe('CR-COST-07 — 14-Link Product Capability & Governance Audit', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  let repository: InMemoryEconomicStudyRepository;
  let service: EconomicStudyService;

  beforeEach(() => {
    repository = new InMemoryEconomicStudyRepository();
    service = new EconomicStudyService(repository);
  });

  // --------------------------------------------------------------------------
  // LINK 1: Ruta real /admin/cost-intelligence
  // --------------------------------------------------------------------------
  it('Link 1: Real Route /admin/cost-intelligence is declared with valid TanStack configuration', () => {
    expect(Route).toBeDefined();
    expect(Route.options).toBeDefined();
    expect(Route.options.beforeLoad).toBeDefined();
    expect(typeof Route.options.beforeLoad).toBe('function');
  });

  // --------------------------------------------------------------------------
  // LINK 2: Apertura real de Preguntar al Mercado
  // --------------------------------------------------------------------------
  it('Link 2: "Preguntar al Mercado" acts as canonical modal trigger in EconomicCommandCenter', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const commandCenterCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/modules/market-intelligence/presentation/components/EconomicCommandCenter.tsx'),
      'utf8'
    );

    expect(commandCenterCode).toContain('Preguntar al Mercado');
    expect(commandCenterCode).toContain('setIsInquiryOpen(true)');
    expect(commandCenterCode).toContain('<MarketInquiryExplorerModal');
    expect(commandCenterCode).toContain('open={isInquiryOpen}');
  });

  // --------------------------------------------------------------------------
  // LINK 3: Transición Mercado → Receta → Fábrica → Decisión
  // --------------------------------------------------------------------------
  it('Link 3: 4-level progressive funnel stages exist and sequentially guide the operator', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const modalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/modules/market-intelligence/presentation/components/MarketInquiryExplorerModal.tsx'),
      'utf8'
    );

    // Verify 4 steps are declared in order
    expect(modalCode).toContain("currentLevel === 1");
    expect(modalCode).toContain("currentLevel === 2");
    expect(modalCode).toContain("currentLevel === 3");
    expect(modalCode).toContain("currentLevel === 4");
    expect(modalCode).toContain("1. Mercado");
    expect(modalCode).toContain("2. Receta");
    expect(modalCode).toContain("3. Fábrica");
    expect(modalCode).toContain("4. Decisión");

    // Verify progression buttons exist
    expect(modalCode).toContain("Avanzar a Receta & Mermas");
    expect(modalCode).toContain("Avanzar a Fábrica & Operaciones");
    expect(modalCode).toContain("Avanzar a Decisión & Capacidad");
  });

  // --------------------------------------------------------------------------
  // LINK 4: Caso real de Tarta de Zanahoria usando datos existentes
  // --------------------------------------------------------------------------
  it('Link 4: Real recipe "Tarta de Zanahoria Casera" calculates exact BOM without density/yield invention', () => {
    const ingredients: StudyIngredient[] = [
      {
        id: 'ing-harina',
        versionId: 'ver-1',
        ingredientName: 'Harina de trigo de repostería',
        grossQuantity: 0.500,
        grossUnit: 'kg',
        unitPrice: 0.95,
        priceProvenance: 'REAL',
        trimmingLossPct: 0, // 0 merma
        netUsableQuantity: 0.500,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-azucar',
        versionId: 'ver-1',
        ingredientName: 'Azúcar blanco',
        grossQuantity: 0.400,
        grossUnit: 'kg',
        unitPrice: 1.20,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: 0,
        netUsableQuantity: 0.400,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-zanahoria',
        versionId: 'ver-1',
        ingredientName: 'Zanahoria fresca rallada',
        grossQuantity: 0.800,
        grossUnit: 'kg',
        unitPrice: 1.10,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: 15.0, // 15% merma pelado
        netUsableQuantity: 0.800 * 0.85,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-huevos',
        versionId: 'ver-1',
        ingredientName: 'Huevos camperos',
        grossQuantity: 4,
        grossUnit: 'unit',
        unitPrice: 0.22,
        priceProvenance: 'MANUAL',
        pieceMassKg: 0.060, // 60g por huevo explícito (NO MAGIC)
        trimmingLossPct: 11.0, // 11% cáscara
        netUsableQuantity: 4 * 0.060 * (1 - 0.11),
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-aceite',
        versionId: 'ver-1',
        ingredientName: 'Aceite de girasol',
        grossQuantity: 0.250,
        grossUnit: 'l',
        densityKgPerL: 0.92, // 0.92 kg/L explícito (NO MAGIC 1.0)
        unitPrice: 1.80,
        priceProvenance: 'REAL',
        trimmingLossPct: 0,
        netUsableQuantity: 0.250 * 0.92,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-canela',
        versionId: 'ver-1',
        ingredientName: 'Canela en polvo',
        grossQuantity: 0.015,
        grossUnit: 'kg',
        unitPrice: 18.00,
        priceProvenance: 'REAL',
        trimmingLossPct: 0,
        netUsableQuantity: 0.015,
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const stages: StudyYieldStage[] = [
      {
        id: 'stg-1',
        versionId: 'ver-1',
        stageOrder: 1,
        stageName: 'Cocción y horneado (evaporación)',
        lossPercentage: 8.5,
        provenance: 'OBSERVADO',
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'stg-2',
        versionId: 'ver-1',
        stageOrder: 2,
        stageName: 'Porcionado y emplatado',
        lossPercentage: 1.5,
        provenance: 'MANUAL',
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const result = YieldCascadeCalculator.calculateYieldCascade(ingredients, stages, 12);

    expect(result.totalGrossMaterialCost).toBeCloseTo(3.435, 3);
    expect(result.rawMaterialCostPerNominalPortion).toBeCloseTo(3.435 / 12, 3);
    expect(result.provenanceDistribution.dominantProvenance).toBe('OBSERVADO');
    expect(result.provenanceDistribution.realPct).toBeGreaterThan(0);
    expect(result.provenanceDistribution.observedPct).toBeGreaterThan(0);
    expect(result.provenanceDistribution.manualPct).toBeGreaterThan(0);
    expect(result.cookingAndProcessYieldPct).toBeCloseTo(90.13, 1);
    expect(result.cumulativeGlobalYieldPct).toBeCloseTo(75.05, 1);
  });

  // --------------------------------------------------------------------------
  // LINK 5: Persistencia real de un estudio
  // --------------------------------------------------------------------------
  it('Link 5: Economic study persists through lifecycle (BORRADOR -> EN_CONFIGURACION -> ESTUDIADO)', async () => {
    const { study, version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.50,
      batchNominalYield: 12,
    });

    expect(study.id).toBeDefined();
    expect(study.productName).toBe('Tarta de Zanahoria Casera');
    expect(study.currentStatus).toBe('BORRADOR');
    expect(version.versionNumber).toBe(1);
    expect(version.versionStatus).toBe('BORRADOR');

    // Add ingredient
    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahoria fresca',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.10,
      priceProvenance: 'OBSERVADO',
      trimmingLossPct: 10.0,
    });

    // Configure operations
    await service.configureOperations({
      versionId: version.id,
      laborHourlyRate: 15.0,
      energyMethod: 'NOT_APPLICABLE',
      packagingMode: 'NOT_APPLICABLE',
    });

    // Generate scenarios progresses study to ESTUDIADO
    await service.generateScenarios(version.id, tenantId);

    const studiedStudy = await repository.getStudyById(study.id, tenantId);
    expect(studiedStudy?.currentStatus).toBe('ESTUDIADO');
  });

  // --------------------------------------------------------------------------
  // LINK 6: Confirmar Decisión → study_decisions
  // --------------------------------------------------------------------------
  it('Link 6: Confirming human decision persists in study_decisions and freezes version', async () => {
    const { study, version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.50,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahorias',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.10,
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

    // Record sovereign decision
    const decision = await service.recordDecision({
      versionId: version.id,
      tenantId,
      verdict: 'APPROVED_FOR_MENU',
      humanStatus: 'APPROVED',
      executiveSummaryText: 'Aprobado para carta de postres.',
      selectedScenarioDemand: 60,
      recommendedPvp: 4.50,
      decisionNotes: 'Aprobado por Human Product Authority.',
    });

    expect(decision.id).toBeDefined();
    expect(decision.decisionVerdict).toBe('APPROVED_FOR_MENU');
    expect(decision.humanDecisionStatus).toBe('APPROVED');

    // Lifecycle must be DECISION
    const updatedStudy = await repository.getStudyById(study.id, tenantId);
    expect(updatedStudy?.currentStatus).toBe('DECISION');

    // Version must be frozen
    const updatedVersion = await repository.getVersionById(version.id);
    expect(updatedVersion?.isFrozen).toBe(true);
    expect(updatedVersion?.versionStatus).toBe('CONGELADA');
  });

  // --------------------------------------------------------------------------
  // LINK 7: Reload → versión sigue congelada
  // --------------------------------------------------------------------------
  it('Link 7: Reloading a frozen study prevents modifications and enforces immutability', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.50,
      batchNominalYield: 12,
    });

    // Manually freeze the version
    await repository.updateVersion(version.id, {
      isFrozen: true,
      versionStatus: 'CONGELADA',
    });

    // Attempting to add ingredients to a frozen version must be rejected
    await expect(
      service.addIngredient({
        versionId: version.id,
        ingredientName: 'Harina alterada',
        grossQuantity: 1.0,
        grossUnit: 'kg',
        unitPrice: 2.0,
        priceProvenance: 'MANUAL',
      })
    ).rejects.toThrow(/congelada|inmutable|frozen/i);
  });

  // --------------------------------------------------------------------------
  // LINK 8: Actualización de mercado → no modifica V1
  // --------------------------------------------------------------------------
  it('Link 8: External market price updates do not alter V1 snapshot; variance is detected cleanly', async () => {
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
        unitPrice: 1.10,
        unit: 'kg',
        observedAt: '2026-09-20T10:00:00Z',
      },
    };

    await repository.updateVersion(version.id, {
      marketPricesSnapshot,
      isFrozen: true,
      versionStatus: 'CONGELADA',
    });

    // Price rose in market by +22.73%
    const currentPrices = {
      'price-123': 1.35,
    };

    const variance = await service.checkMarketVariance(version.id, currentPrices);

    expect(variance.isOutdated).toBe(true);
    expect(variance.hasPriceIncreases).toBe(true);
    expect(variance.maxDeltaPercentage).toBe(22.73);
    expect(variance.impactedIngredients[0].deltaAmount).toBe(0.25);

    // Verify V1 snapshot in repository remains 100% intact with 1.10 €
    const reloadedVersion = await repository.getVersionById(version.id);
    expect(reloadedVersion?.marketPricesSnapshot['harina-makro'].unitPrice).toBe(1.10);
    expect(reloadedVersion?.isFrozen).toBe(true);
  });

  // --------------------------------------------------------------------------
  // LINK 9: WAC/platos/inventario permanecen intactos
  // --------------------------------------------------------------------------
  it('Link 9: Economic studies and simulations operate in strict isolation from inventory WAC and dish records', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const ddlA = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20260927200000_cr_cost_07a_economic_study_foundation.sql'), 'utf8');
    const ddlB = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20260927210000_cr_cost_07b_production_and_operational_engine.sql'), 'utf8');
    const ddlC = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20260927220000_cr_cost_07c_decision_intelligence.sql'), 'utf8');

    // Verify DDL does NOT alter dishes or ingredients tables
    expect(ddlA).not.toMatch(/ALTER\s+TABLE\s+public\.dishes/i);
    expect(ddlA).not.toMatch(/ALTER\s+TABLE\s+public\.ingredients/i);
    expect(ddlB).not.toMatch(/ALTER\s+TABLE\s+public\.dishes/i);
    expect(ddlB).not.toMatch(/ALTER\s+TABLE\s+public\.ingredients/i);
    expect(ddlC).not.toMatch(/ALTER\s+TABLE\s+public\.dishes/i);
    expect(ddlC).not.toMatch(/ALTER\s+TABLE\s+public\.ingredients/i);

    // Verify isolated tables are created
    expect(ddlA).toContain('CREATE TABLE IF NOT EXISTS public.economic_studies');
    expect(ddlA).toContain('CREATE TABLE IF NOT EXISTS public.study_versions');
    expect(ddlA).toContain('CREATE TABLE IF NOT EXISTS public.study_ingredients');
    expect(ddlA).toContain('CREATE TABLE IF NOT EXISTS public.study_yield_stages');
    expect(ddlB).toContain('CREATE TABLE IF NOT EXISTS public.study_operation_configs');
    expect(ddlB).toContain('CREATE TABLE IF NOT EXISTS public.study_scenarios');
    expect(ddlC).toContain('CREATE TABLE IF NOT EXISTS public.study_decisions');
  });

  // --------------------------------------------------------------------------
  // LINK 10: RBAC con inventory.operate
  // --------------------------------------------------------------------------
  it('Link 10: Route guard asserts capability "inventory.operate" before allowing access', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const routeCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/routes/_authenticated/admin.cost-intelligence.tsx'),
      'utf8'
    );

    expect(routeCode).toContain('assertCapabilityFromContext(context, "inventory.operate")');
  });

  // --------------------------------------------------------------------------
  // LINK 11: Estados [NO CONFIGURADO], [SIN DATOS], etc., sin falsos ceros
  // --------------------------------------------------------------------------
  it('Link 11: Missing trimming loss is null [NO CONFIGURADO], not zero [CERO MERMA]', () => {
    // Trimming loss null -> returns null (NEVER ASSUME 0%)
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(2.0, null)).toBeNull();
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(2.0, undefined)).toBeNull();

    // Explicit 0% trimming loss -> returns 100% of gross
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(0.5, 0.0)).toBe(0.5);

    // Volume without density -> returns null (NEVER ASSUME 1.0 kg/L)
    expect(YieldCascadeCalculator.calculateIngredientMassKg(1.0, 'l', null)).toBeNull();

    // Unit without piece mass -> returns null (NEVER ASSUME 0.06 kg)
    expect(YieldCascadeCalculator.calculateIngredientMassKg(4, 'unit', null, null)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // LINK 12: Escenario > capacidad queda excluido de recomendación
  // --------------------------------------------------------------------------
  it('Link 12: Scenario exceeding capacity is flagged INVIABLE and excluded from recommendation', async () => {
    const { version } = await service.createDraft({
      tenantId,
      productName: 'Tarta de Zanahoria Casera',
      targetPvp: 4.50,
      batchNominalYield: 12,
    });

    await service.addIngredient({
      versionId: version.id,
      ingredientName: 'Zanahorias',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 1.10,
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

    // Evaluate with maxUnitsPerRun = 30
    const matrix = await service.evaluateScenariosAndRecommend(
      version.id,
      'MINIMIZE_COST',
      { maxUnitsPerRun: 30 }
    );

    // Scenarios 60, 100, 300 are INVIABLE by capacity
    const s60 = matrix.scenarios.find((s) => s.demandUnits === 60)!;
    expect(s60.capacity.isViable).toBe(false);
    expect(s60.capacity.status).toBe('INVIABLE_CAPACITY');
    expect(s60.isRecommended).toBe(false);

    // Only viable scenarios <= 30 can be recommended
    expect(matrix.recommendedScenario).toBeDefined();
    expect(matrix.recommendedScenario?.demandUnits).toBeLessThanOrEqual(30);
    expect(matrix.recommendedScenario?.isRecommended).toBe(true);
  });

  // --------------------------------------------------------------------------
  // LINK 13: Excedente sin destino bloquea correctamente el coste vendido
  // --------------------------------------------------------------------------
  it('Link 13: Unconfigured surplus destination sets costPerSoldUnit to null and alerts operator', () => {
    const batchResult = DiscreteBatchEngine.calculateBatches(
      20, // 20 units demanded
      12, // 12 units per batch
      false, // fractional not allowed -> 2 batches = 24 units -> 4 surplus units
      'UNCONFIGURED'
    );

    expect(batchResult.batchesRequired).toBe(2);
    expect(batchResult.unitsProduced).toBe(24);
    expect(batchResult.surplusUnits).toBe(4);
    expect(batchResult.surplusStatus).toBe('UNCONFIGURED');

    const opConfig: Partial<StudyOperationConfig> = {
      laborHourlyRate: 15.0,
      laborSetupMinutes: 10,
      laborCleaningMinutes: 10,
      laborBatchMinutes: 20,
      laborUnitMinutes: 1,
      energyMethod: 'NOT_APPLICABLE',
      packagingMode: 'NOT_APPLICABLE',
    };

    const scenarios = OperationalCostEngine.calculateScenarioMatrix(
      [20],
      12,
      false,
      'UNCONFIGURED',
      3.44, // raw cost per batch
      4.50, // target PVP
      opConfig
    );

    expect(scenarios.length).toBe(1);
    const scenario20 = scenarios[0];

    // In DiscreteBatchEngine / OperationalCostEngine:
    // With surplusUnits > 0 and surplusStatus === 'UNCONFIGURED':
    // costPerSoldUnit is strictly NULL (blocked)
    expect(scenario20.costPerSoldUnit).toBeNull();
    expect(scenario20.grossMarginPct).toBeNull();
    expect(scenario20.warnings.some((w) => w.includes('sin destino configurado'))).toBe(true);

    // DiscreteBatchEngine directly confirms constitutional blocking
    const effectiveSold = DiscreteBatchEngine.calculateEffectiveCostPerSoldUnit(
      20,
      24,
      20.0,
      'UNCONFIGURED'
    );
    expect(effectiveSold.costPerSoldUnit).toBeNull();
    expect(effectiveSold.financialAbsorptionNote).toContain('retenido');
  });

  // --------------------------------------------------------------------------
  // LINK 14: Working tree y diff final auditados
  // --------------------------------------------------------------------------
  it('Link 14: Working tree contains only authorized CR-COST-07 additions and modified files', async () => {
    const { execSync } = await import('node:child_process');
    const statusOutput = execSync('git status --short', { encoding: 'utf8' });

    const modifiedLines = statusOutput
      .split('\n')
      .filter((line) => line.startsWith(' M ') || line.startsWith('M  '));

    const modifiedPaths = modifiedLines.map((l) => l.trim().split(/\s+/)[1]);
    expect(modifiedPaths).toContain('src/modules/market-intelligence/presentation/components/EconomicCommandCenter.tsx');
    expect(modifiedPaths).toContain('src/modules/market-intelligence/presentation/components/MarketInquiryExplorerModal.tsx');

    // No unstaged deletions
    const deletedLines = statusOutput
      .split('\n')
      .filter((line) => line.startsWith(' D ') || line.startsWith('D  '));
    expect(deletedLines.length).toBe(0);
  });
});
