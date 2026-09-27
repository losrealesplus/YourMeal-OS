import { describe, it, expect } from 'vitest';
import { YieldCascadeCalculator } from './yield-cascade-calculator';
import type { StudyIngredient, StudyYieldStage } from './product-economics-types';

describe('YieldCascadeCalculator (CR-COST-07A — Strict Epistemic Precision)', () => {
  it('converts mass units directly and rejects assumed densities for volume/units', () => {
    // Mass units convert directly
    expect(YieldCascadeCalculator.calculateIngredientMassKg(2.5, 'kg')).toBe(2.5);
    expect(YieldCascadeCalculator.calculateIngredientMassKg(500, 'g')).toBe(0.5);

    // Volumetric units WITHOUT density: PROHIBITED from assuming 1.0 kg/L
    expect(YieldCascadeCalculator.calculateIngredientMassKg(1.0, 'l')).toBeNull();
    expect(YieldCascadeCalculator.calculateIngredientMassKg(250, 'ml')).toBeNull();

    // Volumetric units WITH explicit density: calculates exact mass
    // Aceite de oliva: 1 L @ 0.92 kg/L = 0.92 kg
    expect(YieldCascadeCalculator.calculateIngredientMassKg(1.0, 'l', 0.92)).toBe(0.92);
    // Jarabe: 500 ml @ 1.35 kg/L = 0.675 kg
    expect(YieldCascadeCalculator.calculateIngredientMassKg(500, 'ml', 1.35)).toBe(0.675);

    // Units WITHOUT piece mass: PROHIBITED from assuming 0.06 kg
    expect(YieldCascadeCalculator.calculateIngredientMassKg(4, 'unit')).toBeNull();

    // Units WITH explicit piece mass: calculates exact mass
    // 4 huevos @ 0.055 kg/huevo = 0.22 kg
    expect(YieldCascadeCalculator.calculateIngredientMassKg(4, 'unit', undefined, 0.055)).toBe(0.22);
  });

  it('strictly distinguishes between null trimming loss [NO CONFIGURADO] and explicit 0% [CERO MERMA]', () => {
    // NULL / undefined trimming loss -> returns null (NEVER ASSUME 0%)
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(2.0, null)).toBeNull();
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(2.0, undefined)).toBeNull();

    // Explicit 0% trimming loss (e.g. Harina, Azúcar) -> returns 100% of gross
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(0.5, 0.0)).toBe(0.5);

    // Explicit positive trimming loss (e.g. 10% Zanahoria) -> 1.80 kg
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(2.0, 10.0)).toBe(1.8);

    // Zero gross returns 0
    expect(YieldCascadeCalculator.calculateIngredientNetUsable(0, 10.0)).toBe(0);
  });

  it('calculates full multi-stage yield cascade for Carrot Cake with all explicit parameters', () => {
    const ingredients: StudyIngredient[] = [
      {
        id: 'ing-1',
        versionId: 'ver-1',
        ingredientName: 'Zanahoria fresca',
        grossQuantity: 2.0,
        grossUnit: 'kg',
        unitPrice: 1.15,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: 10.0,
        netUsableQuantity: 1.8,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-2',
        versionId: 'ver-1',
        ingredientName: 'Harina de trigo',
        grossQuantity: 0.5,
        grossUnit: 'kg',
        unitPrice: 0.9,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: 0.0, // explicit 0%
        netUsableQuantity: 0.5,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-3',
        versionId: 'ver-1',
        ingredientName: 'Huevos medianos',
        grossQuantity: 4,
        grossUnit: 'unit',
        unitPrice: 0.25,
        priceProvenance: 'OBSERVADO',
        pieceMassKg: 0.06, // explicit configured piece mass
        trimmingLossPct: 12.0, // explicit shell loss
        netUsableQuantity: 4 * (1 - 0.12),
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-4',
        versionId: 'ver-1',
        ingredientName: 'Azúcar y Canela',
        grossQuantity: 0.3,
        grossUnit: 'kg',
        unitPrice: 1.2,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: 0.0, // explicit 0%
        netUsableQuantity: 0.3,
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'ing-5',
        versionId: 'ver-1',
        ingredientName: 'Queso crema cobertura',
        grossQuantity: 0.5,
        grossUnit: 'kg',
        unitPrice: 4.5,
        priceProvenance: 'MANUAL',
        trimmingLossPct: 2.0,
        netUsableQuantity: 0.49,
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const stages: StudyYieldStage[] = [
      {
        id: 'stage-1',
        versionId: 'ver-1',
        stageOrder: 1,
        stageName: 'Cocción y horneado (evaporación)',
        lossPercentage: 6.0,
        provenance: 'OBSERVADO',
        createdAt: '2026-09-27T20:00:00Z',
      },
      {
        id: 'stage-2',
        versionId: 'ver-1',
        stageOrder: 2,
        stageName: 'Porcionado y recorte de bordes',
        lossPercentage: 3.0,
        provenance: 'MANUAL',
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const result = YieldCascadeCalculator.calculateYieldCascade(ingredients, stages, 12);

    expect(result.epistemicWarnings).toHaveLength(0);
    expect(result.totalGrossMaterialCost).toBeCloseTo(6.36, 2);
    expect(result.totalGrossWeightKg).not.toBeNull();
    expect(result.totalGrossWeightKg!).toBeCloseTo(3.54, 2);
    expect(result.finishedProductMassKg).not.toBeNull();
    expect(result.rawMaterialCostPerNominalPortion).toBeCloseTo(0.53, 2);
    expect(result.effectiveCostPerKgVendible).not.toBeNull();
  });

  it('refuses to fabricate mass when liquid density is unconfigured, but keeps exact EUR cost', () => {
    const ingredients: StudyIngredient[] = [
      {
        id: 'ing-oil',
        versionId: 'ver-1',
        ingredientName: 'Aceite vegetal',
        grossQuantity: 1.0,
        grossUnit: 'l',
        unitPrice: 2.4,
        priceProvenance: 'OBSERVADO',
        densityKgPerL: null, // UNCONFIGURED DENSITY
        trimmingLossPct: 0.0,
        netUsableQuantity: 1.0,
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const result = YieldCascadeCalculator.calculateYieldCascade(ingredients, [], 10);

    // Monetary cost is EXACT: 1.0 L * 2.40 €/L = 2.40 €
    expect(result.totalGrossMaterialCost).toBe(2.4);
    expect(result.rawMaterialCostPerNominalPortion).toBe(0.24);

    // Mass balance CANNOT be calculated without density: must be null
    expect(result.totalGrossWeightKg).toBeNull();
    expect(result.totalNetUsableWeightKg).toBeNull();
    expect(result.finishedProductMassKg).toBeNull();
    expect(result.effectiveCostPerKgVendible).toBeNull();

    // Emits explicit epistemic warning
    expect(result.epistemicWarnings.some((w) => w.includes('DENSIDAD NO CONFIGURADA'))).toBe(true);
  });

  it('refuses to assume 0% trimming loss when trimming is unconfigured (null)', () => {
    const ingredients: StudyIngredient[] = [
      {
        id: 'ing-carrot',
        versionId: 'ver-1',
        ingredientName: 'Zanahoria',
        grossQuantity: 2.0,
        grossUnit: 'kg',
        unitPrice: 1.15,
        priceProvenance: 'OBSERVADO',
        trimmingLossPct: null, // UNCONFIGURED TRIMMING LOSS
        netUsableQuantity: null,
        createdAt: '2026-09-27T20:00:00Z',
      },
    ];

    const result = YieldCascadeCalculator.calculateYieldCascade(ingredients, [], 10);

    // Cost in EUR is exact
    expect(result.totalGrossMaterialCost).toBe(2.3);

    // Net usable weight cannot be assumed to be 2.0 kg! Must be null
    expect(result.totalNetUsableWeightKg).toBeNull();
    expect(result.trimmingYieldPct).toBeNull();
    expect(result.finishedProductMassKg).toBeNull();

    // Emits explicit epistemic warning
    expect(result.epistemicWarnings.some((w) => w.includes('MERMA DE LIMPIEZA NO CONFIGURADA'))).toBe(
      true
    );
  });
});
