import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StrategicOpportunityCards, OpportunityItem } from './StrategicOpportunityCards';
import type { BenchmarkCalculation } from '../../domain/types';

describe('StrategicOpportunityCards Component (CR-COST-05 Opción A)', () => {
  const sampleCalculation: BenchmarkCalculation = {
    tenantIngredientId: 'ing-1',
    tenantIngredientName: 'Pechuga de Pollo',
    calculatedAt: '2026-11-20T12:00:00Z',
    canonicalUnit: 'EUR_PER_KG',
    benchmarkPriceExTax: 5.2,
    minPriceExTax: 4.9,
    maxPriceExTax: 6.8,
    dispersionSpreadPct: 38.8,
    observationsCount: 3,
    highComparabilityCount: 2,
    hasRealObservations: true,
    latestRealPriceExTax: 6.1,
    components: [
      {
        observationId: 'obs-1',
        sourceId: 'src-makro',
        sourceName: 'Makro Adeje',
        sourceType: 'b2b_wholesale',
        rawName: 'Pechuga de Pollo 2kg',
        regionCode: 'ES_TENERIFE_TF',
        observedAt: '2026-11-18',
        rawPrice: 9.8,
        taxMode: 'ex_tax',
        taxRate: 0.03,
        normalizedPriceExTax: 4.9,
        normalizedUnit: 'EUR_PER_KG',
        comparabilityGrade: 'HIGH',
        weight: 1.0,
        isStale: false,
        isPromo: false,
        isTenantOwned: false,
      },
      {
        observationId: 'obs-real-1',
        sourceId: 'src-tenant-inv',
        sourceName: 'Avícola Canaria S.L.',
        sourceType: 'b2b_wholesale',
        rawName: 'Pechuga de Pollo Fresca',
        regionCode: 'ES_TENERIFE_TF',
        observedAt: '2026-11-20',
        rawPrice: 6.1,
        taxMode: 'ex_tax',
        taxRate: 0.03,
        normalizedPriceExTax: 6.1,
        normalizedUnit: 'EUR_PER_KG',
        comparabilityGrade: 'HIGH',
        weight: 1.0,
        isStale: false,
        isPromo: false,
        isTenantOwned: true,
      },
    ],
  };

  const sampleOpportunities: OpportunityItem[] = [
    {
      ingredientId: 'ing-1',
      ingredientName: 'Pechuga de Pollo',
      category: 'Carnes / Aves',
      unit: 'kg',
      effectiveWacExTax: 6.0,
      benchmarkPriceExTax: 5.2,
      variancePct: 15.4,
      annualVolume: 1200,
      potentialAnnualSavingsEur: 960.0,
      actionabilityGrade: 'DIRECT_ACTION',
      calculation: sampleCalculation,
      hasRealPurchaseObservation: true,
      latestRealPriceExTax: 6.1,
      realObservationSource: 'Avícola Canaria S.L.',
    },
  ];

  it('renders nothing when opportunities list is empty or all items have variance <= 2%', () => {
    const html = renderToString(
      <StrategicOpportunityCards
        opportunities={[]}
        onInjectSimulation={() => {}}
        onOpenBrief={() => {}}
        onOpenSpread={() => {}}
        onOpenInquiry={() => {}}
      />
    );
    expect(html).toBe('');
  });

  it('renders top opportunity cards with actionability badge, variance, and floor price', () => {
    const html = renderToString(
      <StrategicOpportunityCards
        opportunities={sampleOpportunities}
        onInjectSimulation={() => {}}
        onOpenBrief={() => {}}
        onOpenSpread={() => {}}
        onOpenInquiry={() => {}}
      />
    );

    expect(html).toContain('Pechuga de Pollo');
    expect(html).toContain('Acción Directa');
    expect(html).toContain('15.4');
    expect(html).toContain('Sobreprecio');
    expect(html).toContain('WAC Actual [REAL]:');
    expect(html).toContain('6.00');
    expect(html).toContain('Benchmark [OBSERVADO]:');
    expect(html).toContain('5.20');
    expect(html).toContain('Suelo:');
    expect(html).toContain('4.90');
    expect(html).toContain('960.00 €');
  });

  it('displays the explicit "Basado en facturas reales" badge and latest invoiced price when real purchase observations exist', () => {
    const html = renderToString(
      <StrategicOpportunityCards
        opportunities={sampleOpportunities}
        onInjectSimulation={() => {}}
        onOpenBrief={() => {}}
        onOpenSpread={() => {}}
        onOpenInquiry={() => {}}
      />
    );

    expect(html).toContain('Basado en facturas reales');
    expect(html).toContain('Última Factura [REAL]:');
    expect(html).toContain('6.10');
    expect(html).toContain('Avícola Canaria S.L.');
  });
});
