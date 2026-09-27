import { describe, it, expect } from 'vitest';
import { EconomicStudyLifecycle } from './economic-study-lifecycle';
import type { EconomicStudy, StudyVersion, StudyIngredient } from './product-economics-types';

describe('EconomicStudyLifecycle (CR-COST-07A)', () => {
  it('validates allowed state transitions according to governance rules', () => {
    // Valid transitions
    expect(EconomicStudyLifecycle.canTransition('BORRADOR', 'EN_CONFIGURACION')).toBe(true);
    expect(EconomicStudyLifecycle.canTransition('EN_CONFIGURACION', 'LISTO_SIMULAR')).toBe(true);
    expect(EconomicStudyLifecycle.canTransition('LISTO_SIMULAR', 'ESTUDIADO')).toBe(true);
    expect(EconomicStudyLifecycle.canTransition('ESTUDIADO', 'DECISION')).toBe(true);

    // Backward transition to reconfigure
    expect(EconomicStudyLifecycle.canTransition('EN_CONFIGURACION', 'BORRADOR')).toBe(true);
    expect(EconomicStudyLifecycle.canTransition('LISTO_SIMULAR', 'EN_CONFIGURACION')).toBe(true);

    // Invalid jumps
    expect(EconomicStudyLifecycle.canTransition('BORRADOR', 'ESTUDIADO')).toBe(false);
    expect(EconomicStudyLifecycle.canTransition('BORRADOR', 'DECISION')).toBe(false);
  });

  it('correctly evaluates readiness for draft and simulation', () => {
    const study: EconomicStudy = {
      id: 's-1',
      tenantId: 't-1',
      productName: 'Tarta Zanahoria',
      productCategory: 'postres',
      currentStatus: 'BORRADOR',
      activeVersionNumber: 1,
      createdAt: '2026-09-27T20:00:00Z',
      updatedAt: '2026-09-27T20:00:00Z',
    };

    const version: StudyVersion = {
      id: 'v-1',
      studyId: 's-1',
      versionNumber: 1,
      versionStatus: 'BORRADOR',
      targetPvp: 4.0,
      salesUnit: 'ración',
      salesUnitSize: 1,
      batchUnitName: 'tarta',
      batchNominalYield: 12,
      isFractionalAllowed: false,
      surplusDestination: 'UNCONFIGURED',
      conclusionTier: 'INSUFFICIENT_DATA',
      provenanceSummary: 'MANUAL',
      marketPricesSnapshot: {},
      isFrozen: false,
      createdAt: '2026-09-27T20:00:00Z',
    };

    // Case 1: No ingredients -> stays BORRADOR
    const r1 = EconomicStudyLifecycle.evaluateStudyReadiness(study, version, []);
    expect(r1.recommendedStatus).toBe('BORRADOR');
    expect(r1.canSimulate).toBe(false);
    expect(r1.missingFields).toContain('ingredients');

    // Case 2: Ingredients present but 0 price -> EN_CONFIGURACION
    const ingUnpriced: StudyIngredient = {
      id: 'ing-1',
      versionId: 'v-1',
      ingredientName: 'Zanahoria',
      grossQuantity: 2.0,
      grossUnit: 'kg',
      unitPrice: 0,
      priceProvenance: 'MANUAL',
      trimmingLossPct: 10,
      netUsableQuantity: 1.8,
      createdAt: '2026-09-27T20:00:00Z',
    };
    const r2 = EconomicStudyLifecycle.evaluateStudyReadiness(study, version, [ingUnpriced]);
    expect(r2.recommendedStatus).toBe('EN_CONFIGURACION');
    expect(r2.canSimulate).toBe(false);
    expect(r2.missingFields).toContain('priced_ingredients');

    // Case 3: Ingredients priced and yield defined -> LISTO_SIMULAR
    const ingPriced: StudyIngredient = {
      ...ingUnpriced,
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
    };
    const r3 = EconomicStudyLifecycle.evaluateStudyReadiness(study, version, [ingPriced]);
    expect(r3.recommendedStatus).toBe('LISTO_SIMULAR');
    expect(r3.canSimulate).toBe(true);
    expect(r3.missingFields).toHaveLength(0);
  });

  it('enforces immutability on frozen versions', () => {
    const mutableVersion: StudyVersion = {
      id: 'v-1',
      studyId: 's-1',
      versionNumber: 1,
      versionStatus: 'BORRADOR',
      targetPvp: 4.0,
      salesUnit: 'ración',
      salesUnitSize: 1,
      batchUnitName: 'tarta',
      batchNominalYield: 12,
      isFractionalAllowed: false,
      surplusDestination: 'UNCONFIGURED',
      conclusionTier: 'INSUFFICIENT_DATA',
      provenanceSummary: 'MANUAL',
      marketPricesSnapshot: {},
      isFrozen: false,
      createdAt: '2026-09-27T20:00:00Z',
    };

    expect(() => EconomicStudyLifecycle.assertVersionMutable(mutableVersion)).not.toThrow();

    const frozenVersion: StudyVersion = {
      ...mutableVersion,
      isFrozen: true,
      versionStatus: 'CONGELADA',
    };

    expect(() => EconomicStudyLifecycle.assertVersionMutable(frozenVersion)).toThrow(
      /frozen and immutable/
    );
  });

  it('evaluates conclusion tier respecting the constitutional right to say NO SÉ', () => {
    // 1. Missing PVP -> INSUFFICIENT_DATA
    const c1 = EconomicStudyLifecycle.evaluateConclusionTier([], null);
    expect(c1.tier).toBe('INSUFFICIENT_DATA');
    expect(c1.reason).toContain('PVP');

    // 2. Unpriced ingredient -> INSUFFICIENT_DATA
    const unpricedIng: StudyIngredient = {
      id: 'i-1',
      versionId: 'v-1',
      ingredientName: 'Harina',
      grossQuantity: 1,
      grossUnit: 'kg',
      unitPrice: 0,
      priceProvenance: 'MANUAL',
      trimmingLossPct: 0,
      netUsableQuantity: 1,
      createdAt: '2026-09-27T20:00:00Z',
    };
    const c2 = EconomicStudyLifecycle.evaluateConclusionTier([unpricedIng], 4.0);
    expect(c2.tier).toBe('INSUFFICIENT_DATA');
    expect(c2.reason).toContain('sin precio');

    // 3. Has manual ingredient -> CONDITIONED
    const manualIng: StudyIngredient = {
      ...unpricedIng,
      unitPrice: 4.5,
      priceProvenance: 'MANUAL',
    };
    const c3 = EconomicStudyLifecycle.evaluateConclusionTier([manualIng], 4.0);
    expect(c3.tier).toBe('CONDITIONED');
    expect(c3.reason).toContain('manuales');

    // 4. All observed/real -> CERTIFIED
    const observedIng: StudyIngredient = {
      ...unpricedIng,
      unitPrice: 1.15,
      priceProvenance: 'OBSERVADO',
    };
    const c4 = EconomicStudyLifecycle.evaluateConclusionTier([observedIng], 4.0);
    expect(c4.tier).toBe('CERTIFIED');
  });
});
