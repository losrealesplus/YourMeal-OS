import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarketBenchmarkBadge } from './MarketBenchmarkBadge';

describe('MarketBenchmarkBadge Component', () => {
  it('renders "Sin Mapeo" badge when isMapped is false or benchmarkPrice is null', () => {
    const htmlUnmapped = renderToString(
      <MarketBenchmarkBadge isMapped={false} />
    );
    expect(htmlUnmapped).toContain('Sin Mapeo');

    const htmlNullBench = renderToString(
      <MarketBenchmarkBadge isMapped={true} benchmarkPriceExTax={null} />
    );
    expect(htmlNullBench).toContain('Sin Mapeo');
  });

  it('renders Reference price badge when effective WAC is not provided', () => {
    const html = renderToString(
      <MarketBenchmarkBadge
        isMapped={true}
        benchmarkPriceExTax={4.25}
        unit="kg"
      />
    );
    expect(html).toContain('Ref. Mercado:');
    expect(html).toContain('4.25');
  });

  it('renders favorable variance in green when buying below market (-10%)', () => {
    const html = renderToString(
      <MarketBenchmarkBadge
        isMapped={true}
        benchmarkPriceExTax={5.0}
        effectiveWacExTax={4.5}
        unit="kg"
        comparabilityGrade="HIGH"
      />
    );
    // (4.5 - 5.0)/5.0 * 100 = -10.0%
    expect(html).toContain('-10.0%');
    expect(html).toContain('vs Mercado');
    expect(html).toContain('text-emerald-700');
  });

  it('renders unfavorable variance in amber/red when buying above market (+15%)', () => {
    const html = renderToString(
      <MarketBenchmarkBadge
        isMapped={true}
        benchmarkPriceExTax={4.0}
        effectiveWacExTax={4.6}
        unit="kg"
        comparabilityGrade="MEDIUM"
      />
    );
    // (4.6 - 4.0)/4.0 * 100 = +15.0%
    expect(html).toContain('+15.0%');
    expect(html).toContain('vs Mercado');
    expect(html).toContain('text-rose-700');
  });

  it('renders at-par variance when variance is within +/-2%', () => {
    const html = renderToString(
      <MarketBenchmarkBadge
        isMapped={true}
        benchmarkPriceExTax={5.0}
        effectiveWacExTax={5.05}
        unit="kg"
        comparabilityGrade="HIGH"
      />
    );
    // (5.05 - 5.0)/5.0 * 100 = +1.0%
    expect(html).toContain('+1.0%');
    expect(html).toContain('text-slate-700');
  });
});
