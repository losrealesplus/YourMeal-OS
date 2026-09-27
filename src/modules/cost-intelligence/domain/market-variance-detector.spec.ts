import { describe, it, expect } from 'vitest';
import { MarketVarianceDetector } from './market-variance-detector';
import type { MarketPriceSnapshotEntry } from './product-economics-types';

describe('MarketVarianceDetector Domain Engine (CR-COST-07C)', () => {
  const snapshot: Record<string, MarketPriceSnapshotEntry> = {
    'harina-trigo': {
      priceId: 'p-1',
      marketProductId: 'mp-1',
      sourceId: 's-1',
      sourceName: 'Harina de Trigo Makro 5kg',
      unitPrice: 1.1,
      unit: 'kg',
      observedAt: '2026-09-20T10:00:00Z',
    },
    zanahoria: {
      priceId: 'p-2',
      marketProductId: 'mp-2',
      sourceId: 's-2',
      sourceName: 'Zanahoria Granel Mercadona',
      unitPrice: 0.95,
      unit: 'kg',
      observedAt: '2026-09-20T10:00:00Z',
    },
  };

  it('detects when prices have changed and identifies deltas', () => {
    // Current prices: Harina increased to 1.25, Zanahoria dropped to 0.90
    const currentPrices = {
      'p-1': 1.25,
      'p-2': 0.9,
    };

    const result = MarketVarianceDetector.checkVariance(snapshot, currentPrices);

    expect(result.isOutdated).toBe(true);
    expect(result.hasPriceIncreases).toBe(true);
    expect(result.impactedIngredients.length).toBe(2);

    const flourDelta = result.impactedIngredients.find((i) => i.marketPriceId === 'p-1');
    expect(flourDelta?.deltaAmount).toBe(0.15);
    expect(flourDelta?.deltaPercentage).toBe(13.64); // +13.64%

    const carrotDelta = result.impactedIngredients.find((i) => i.marketPriceId === 'p-2');
    expect(carrotDelta?.deltaAmount).toBe(-0.05);
    expect(carrotDelta?.deltaPercentage).toBe(-5.26);

    expect(result.explanation).toContain('Harina de Trigo');
    expect(result.explanation).toContain('+13.64%');
  });

  it('reports isOutdated = false when current prices match snapshot', () => {
    const currentPrices = {
      'p-1': 1.1,
      'p-2': 0.95,
    };

    const result = MarketVarianceDetector.checkVariance(snapshot, currentPrices);

    expect(result.isOutdated).toBe(false);
    expect(result.hasPriceIncreases).toBe(false);
    expect(result.impactedIngredients.length).toBe(0);
    expect(result.explanation).toContain('coinciden');
  });
});
