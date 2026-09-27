import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarketSourceSpreadCard } from './MarketSourceSpreadCard';
import { BenchmarkComponent } from '../../domain/types';

describe('MarketSourceSpreadCard Component', () => {
  it('renders source spread and components with wholesale floor and retail ceiling', () => {
    const components: BenchmarkComponent[] = [
      {
        observationId: 'obs_1',
        sourceId: 'src_makro',
        sourceName: 'Makro España',
        sourceType: 'cash_carry',
        rawName: 'Pechuga Pollo Entera 5kg',
        regionCode: 'ES_TENERIFE_TF',
        observedAt: new Date().toISOString(),
        rawPrice: 29.0,
        taxMode: 'ex_tax',
        taxRate: 0.03,
        normalizedPriceExTax: 5.80,
        normalizedUnit: 'EUR_PER_KG',
        comparabilityGrade: 'HIGH',
        weight: 0.6,
        isStale: false,
        isPromo: false,
      },
      {
        observationId: 'obs_2',
        sourceId: 'src_mercadona',
        sourceName: 'Mercadona',
        sourceType: 'retail_ceiling',
        rawName: 'Pechuga Pollo Fileteada 500g',
        regionCode: 'ES_TENERIFE_TF',
        observedAt: new Date().toISOString(),
        rawPrice: 3.60,
        taxMode: 'inc_tax',
        taxRate: 0.0,
        normalizedPriceExTax: 7.20,
        normalizedUnit: 'EUR_PER_KG',
        comparabilityGrade: 'HIGH',
        weight: 0.4,
        isStale: false,
        isPromo: false,
      },
    ];

    const html = renderToString(
      <MarketSourceSpreadCard
        ingredientName="Pechuga de Pollo"
        components={components}
        benchmarkPriceExTax={6.36}
        effectiveWacExTax={6.50}
        unit="kg"
      />
    );

    expect(html).toContain('Pechuga de Pollo');
    expect(html).toContain('Makro España');
    expect(html).toContain('Mercadona');
    expect(html).toContain('5.80');
    expect(html).toContain('7.20');
    expect(html).toContain('Suelo Mayorista');
    expect(html).toContain('Techo Minorista');
    expect(html).toContain('Dispersión:');
  });

  it('renders empty state message when no components exist', () => {
    const html = renderToString(
      <MarketSourceSpreadCard
        ingredientName="Sal Marina"
        components={[]}
        benchmarkPriceExTax={0}
        unit="kg"
      />
    );

    expect(html).toContain('No hay observaciones de mercado registradas para este ingrediente.');
  });
});
