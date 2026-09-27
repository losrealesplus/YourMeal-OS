import { describe, it, expect } from 'vitest';
import { ProductMatcher } from './product-matcher';
import { MarketProduct } from './types';

describe('ProductMatcher (CR-COST-05)', () => {
  const baseMarketProduct: MarketProduct = {
    id: 'mp-101',
    sourceId: 'src-makro',
    externalSku: 'MK-12345',
    rawName: 'Pechuga de Pollo Fresca Limpia 2kg',
    category: 'Aves',
    thermalState: 'fresh',
    standardQuantity: 2.0,
    standardUnit: 'kg',
    cutSpecification: 'limpia',
    qualityGrade: 'standard',
    createdAt: '2026-09-27T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
  };

  it('evaluates HIGH_MATCH for identical specification and thermal state', () => {
    const result = ProductMatcher.evaluateMatch(
      {
        tenantIngredientName: 'Pechuga de Pollo Limpia',
        tenantThermalState: 'fresh',
        tenantUnit: 'kg',
        tenantCutSpec: 'limpia',
        tenantQualityGrade: 'standard',
      },
      baseMarketProduct
    );

    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.9);
    expect(result.classification).toBe('HIGH_MATCH');
    expect(result.suggestedComparability).toBe('HIGH');
    expect(result.breakdown.thermalStateScore).toBe(1.0);
    expect(result.breakdown.unitScore).toBe(1.0);
  });

  it('penalizes Fresh vs Frozen mismatch heavily', () => {
    const frozenProduct: MarketProduct = {
      ...baseMarketProduct,
      id: 'mp-frozen-5oc',
      rawName: 'Pechuga de Pollo Congelada Bolsa 1kg',
      thermalState: 'frozen',
      cutSpecification: 'entera',
    };

    const result = ProductMatcher.evaluateMatch(
      {
        tenantIngredientName: 'Pechuga de Pollo Fresca Fileteada',
        tenantThermalState: 'fresh',
        tenantUnit: 'kg',
        tenantCutSpec: 'fileteada',
      },
      frozenProduct
    );

    expect(result.breakdown.thermalStateScore).toBe(0.0);
    expect(result.confidenceScore).toBeLessThan(0.7);
    expect(result.classification).not.toBe('HIGH_MATCH');
  });

  it('drops unit score to 0 on incompatible physical measurement types (kg vs l)', () => {
    const liquidProduct: MarketProduct = {
      ...baseMarketProduct,
      id: 'mp-liquid',
      rawName: 'Aceite de Oliva Virgen Extra 5L',
      standardUnit: 'l',
    };

    const result = ProductMatcher.evaluateMatch(
      {
        tenantIngredientName: 'Aceite de Oliva Virgen Extra',
        tenantUnit: 'kg', // Tenant uses kg
      },
      liquidProduct
    );

    expect(result.breakdown.unitScore).toBe(0.0);
  });

  it('penalizes quality grade differences (Campero vs Standard)', () => {
    const standardEggs: MarketProduct = {
      id: 'mp-eggs-std',
      sourceId: 'src-mercadona',
      rawName: 'Huevos Clase M Standard',
      category: 'Huevos',
      thermalState: 'ambient',
      standardQuantity: 12,
      standardUnit: 'unit',
      qualityGrade: 'standard',
      createdAt: '2026-09-27T00:00:00Z',
      updatedAt: '2026-09-27T00:00:00Z',
    };

    const result = ProductMatcher.evaluateMatch(
      {
        tenantIngredientName: 'Huevos Camperos Granja',
        tenantThermalState: 'ambient',
        tenantUnit: 'unit',
        tenantQualityGrade: 'campero',
      },
      standardEggs
    );

    expect(result.breakdown.gradeScore).toBe(0.0);
  });

  it('normalizes diacritics and culinary stop words correctly', () => {
    const score = ProductMatcher.computeNameOverlapScore(
      'Salmón Noruego Fresco Limpio',
      'Salmon de Noruega Fresco en Rodajas'
    );

    expect(score).toBeGreaterThan(0.7);
  });
});
