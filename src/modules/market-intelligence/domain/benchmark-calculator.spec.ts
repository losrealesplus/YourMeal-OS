import { describe, it, expect } from 'vitest';
import { BenchmarkCalculator, BenchmarkInputObservation } from './benchmark-calculator';
import { TenantIngredientEconomicRef } from './types';

describe('BenchmarkCalculator (CR-COST-05)', () => {
  const refDate = new Date('2026-09-27T12:00:00Z');

  const chickenIngredient = {
    id: 'ing-chicken-001',
    name: 'Pechuga de Pollo Limpia',
  };

  const sampleInputs: BenchmarkInputObservation[] = [
    {
      source: {
        id: 'src-makro',
        name: 'Makro Tenerife',
        sourceType: 'b2b_wholesale',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      product: {
        id: 'mp-makro-1',
        sourceId: 'src-makro',
        rawName: 'Pechuga de Pollo Limpia 2kg',
        category: 'Aves',
        thermalState: 'fresh',
        standardQuantity: 2,
        standardUnit: 'kg',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      observation: {
        id: 'obs-makro-1',
        marketProductId: 'mp-makro-1',
        observedAt: '2026-09-25T10:00:00Z',
        priceRaw: 10.5,
        currency: 'EUR',
        taxMode: 'ex_tax',
        taxRate: 0.0,
        normalizedPriceExTax: 5.25,
        normalizedUnit: 'EUR_PER_KG',
        promotionStatus: 'standard',
        regionCode: 'ES_TENERIFE_TF',
        captureMethod: 'catalog_import',
        qualityStatus: 'OBSERVED',
        createdAt: '2026-09-25T10:00:00Z',
      },
      mapping: {
        id: 'map-1',
        tenantId: 'tenant-eatclean',
        tenantIngredientId: 'ing-chicken-001',
        marketProductId: 'mp-makro-1',
        matchConfidence: 0.95,
        matchStatus: 'confirmed',
        comparabilityGrade: 'HIGH',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
    {
      source: {
        id: 'src-gmcash',
        name: 'GM Cash Adeje',
        sourceType: 'cash_carry',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      product: {
        id: 'mp-gmcash-1',
        sourceId: 'src-gmcash',
        rawName: 'Pechuga Pollo Fresca Bandeja 1.5kg',
        category: 'Aves',
        thermalState: 'fresh',
        standardQuantity: 1.5,
        standardUnit: 'kg',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      observation: {
        id: 'obs-gmcash-1',
        marketProductId: 'mp-gmcash-1',
        observedAt: '2026-09-24T10:00:00Z',
        priceRaw: 8.025,
        currency: 'EUR',
        taxMode: 'ex_tax',
        taxRate: 0.0,
        normalizedPriceExTax: 5.35,
        normalizedUnit: 'EUR_PER_KG',
        promotionStatus: 'standard',
        regionCode: 'ES_TENERIFE_TF',
        captureMethod: 'assisted_entry',
        qualityStatus: 'OBSERVED',
        createdAt: '2026-09-24T10:00:00Z',
      },
      mapping: {
        id: 'map-2',
        tenantId: 'tenant-eatclean',
        tenantIngredientId: 'ing-chicken-001',
        marketProductId: 'mp-gmcash-1',
        matchConfidence: 0.91,
        matchStatus: 'confirmed',
        comparabilityGrade: 'HIGH',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
    {
      source: {
        id: 'src-5oceanos',
        name: '5 Océanos Tenerife',
        sourceType: 'regional_specialist',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      product: {
        id: 'mp-5oceanos-1',
        sourceId: 'src-5oceanos',
        rawName: 'Pechuga Pollo Congelada Granel',
        category: 'Aves',
        thermalState: 'frozen',
        standardQuantity: 1.0,
        standardUnit: 'kg',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      observation: {
        id: 'obs-5oc-1',
        marketProductId: 'mp-5oceanos-1',
        observedAt: '2026-09-20T10:00:00Z',
        priceRaw: 5.6,
        currency: 'EUR',
        taxMode: 'ex_tax',
        taxRate: 0.0,
        normalizedPriceExTax: 5.6,
        normalizedUnit: 'EUR_PER_KG',
        promotionStatus: 'temporary_discount',
        regionCode: 'ES_TENERIFE_TF',
        captureMethod: 'catalog_import',
        qualityStatus: 'OBSERVED',
        createdAt: '2026-09-20T10:00:00Z',
      },
      mapping: {
        id: 'map-3',
        tenantId: 'tenant-eatclean',
        tenantIngredientId: 'ing-chicken-001',
        marketProductId: 'mp-5oceanos-1',
        matchConfidence: 0.72,
        matchStatus: 'confirmed',
        comparabilityGrade: 'MEDIUM',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
    {
      source: {
        id: 'src-mercadona',
        name: 'Mercadona Canarias',
        sourceType: 'retail_ceiling',
        defaultTaxMode: 'inc_tax',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        isActive: true,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      product: {
        id: 'mp-mercadona-1',
        sourceId: 'src-mercadona',
        rawName: 'Filetes Pechuga Pollo Bandeja 500g',
        category: 'Aves',
        thermalState: 'fresh',
        standardQuantity: 0.5,
        standardUnit: 'kg',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      observation: {
        id: 'obs-mercadona-1',
        marketProductId: 'mp-mercadona-1',
        observedAt: '2026-09-26T10:00:00Z',
        priceRaw: 3.344,
        currency: 'EUR',
        taxMode: 'inc_tax',
        taxRate: 0.07,
        normalizedPriceExTax: 6.25,
        normalizedUnit: 'EUR_PER_KG',
        promotionStatus: 'standard',
        regionCode: 'ES_CANARIAS_REGIONAL',
        captureMethod: 'assisted_entry',
        qualityStatus: 'OBSERVED',
        createdAt: '2026-09-26T10:00:00Z',
      },
      mapping: {
        id: 'map-4',
        tenantId: 'tenant-eatclean',
        tenantIngredientId: 'ing-chicken-001',
        marketProductId: 'mp-mercadona-1',
        matchConfidence: 0.65,
        matchStatus: 'confirmed',
        comparabilityGrade: 'LOW',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
  ];

  it('calculates weighted median benchmark without allowing retail ceiling to distort wholesale price', () => {
    const calculation = BenchmarkCalculator.calculateBenchmark(
      chickenIngredient,
      sampleInputs,
      refDate
    );

    expect(calculation.canonicalUnit).toBe('EUR_PER_KG');
    // Makro (5.25, w=1.0), GM Cash (5.35, w=1.0), 5 Océanos (5.60, w=0.54), Mercadona (6.25, w=0.06)
    // Weighted median lands solidly on GM Cash (5.35 €/kg)
    expect(calculation.benchmarkPriceExTax).toBe(5.35);
    expect(calculation.minPriceExTax).toBe(5.25);
    expect(calculation.maxPriceExTax).toBe(6.25);
    expect(calculation.highComparabilityCount).toBe(2);
    expect(calculation.dispersionSpreadPct).toBeGreaterThan(15);
  });

  it('computes accurate price variance, spend at risk, and unfavorable status', () => {
    const calculation = BenchmarkCalculator.calculateBenchmark(
      chickenIngredient,
      sampleInputs,
      refDate
    );

    const tenantRef: TenantIngredientEconomicRef = {
      id: chickenIngredient.id,
      tenantId: 'tenant-eatclean',
      name: chickenIngredient.name,
      category: 'Aves',
      unit: 'kg',
      effectiveWacExTax: 6.04,
      currentInvoicedPriceExTax: 6.1,
      annualVolume: 1250,
      primarySupplierName: 'Distribuciones Cárnicas Canarias S.L.',
    };

    const variance = BenchmarkCalculator.analyzeVariance(tenantRef, calculation);

    expect(variance.status).toBe('UNFAVORABLE_OVERPAYING');
    // (6.04 - 5.35) / 5.35 * 100 = 12.90%
    expect(variance.marketVariancePct).toBe(12.9);
    // 6.10 - 5.35 = 0.75 €/kg
    expect(variance.supplierPriceGapEur).toBe(0.75);
    // 1250 kg * 0.75 € = 937.50 €
    expect(variance.annualSpendAtRiskEur).toBe(937.5);
    expect(variance.confidenceSummary).toBe('HIGH');
  });

  it('generates actionable Negotiation Brief with clear evidence and talking points', () => {
    const calculation = BenchmarkCalculator.calculateBenchmark(
      chickenIngredient,
      sampleInputs,
      refDate
    );

    const tenantRef: TenantIngredientEconomicRef = {
      id: chickenIngredient.id,
      tenantId: 'tenant-eatclean',
      name: chickenIngredient.name,
      category: 'Aves',
      unit: 'kg',
      effectiveWacExTax: 6.04,
      currentInvoicedPriceExTax: 6.1,
      annualVolume: 1250,
      primarySupplierName: 'Distribuciones Cárnicas Canarias S.L.',
    };

    const variance = BenchmarkCalculator.analyzeVariance(tenantRef, calculation);
    const brief = BenchmarkCalculator.generateNegotiationBrief(
      { id: 'tenant-eatclean', name: 'EatClean Tenerife' },
      tenantRef,
      calculation,
      variance,
      refDate
    );

    expect(brief.tenantName).toBe('EatClean Tenerife');
    expect(brief.targetSupplierName).toBe('Distribuciones Cárnicas Canarias S.L.');
    expect(brief.projectedAnnualSpendEur).toBe(7625.0); // 1250 * 6.10
    expect(brief.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(brief.talkingPoints[0].topic).toBe('Volume Scale');
    expect(brief.targetRenegotiationPriceExTax).toBeLessThan(6.1);
    expect(brief.potentialAnnualSavingsEur).toBeGreaterThan(0);
  });

  it('penalizes stale observations and excludes UNKNOWN comparability', () => {
    const staleInputs: BenchmarkInputObservation[] = [
      {
        ...sampleInputs[0],
        observation: {
          ...sampleInputs[0].observation,
          observedAt: '2026-08-01T00:00:00Z', // > 14 days old relative to 2026-09-27
        },
      },
      {
        ...sampleInputs[1],
        mapping: {
          ...sampleInputs[1].mapping,
          comparabilityGrade: 'UNKNOWN', // Must have 0 weight
        },
      },
    ];

    const calculation = BenchmarkCalculator.calculateBenchmark(
      chickenIngredient,
      staleInputs,
      refDate
    );

    // Only observation 0 is active (with freshness penalty 0.5)
    expect(calculation.components[0].isStale).toBe(true);
    expect(calculation.components[0].weight).toBe(0.5); // 1.0 * 1.0 * 0.5
    expect(calculation.components[1].weight).toBe(0.0); // UNKNOWN comparability
    expect(calculation.benchmarkPriceExTax).toBe(5.25);
  });
});
