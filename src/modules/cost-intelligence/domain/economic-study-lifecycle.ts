// ============================================================================
// YOURMEAL OS — ECONOMIC STUDY LIFECYCLE (CR-COST-07A)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// State Machine & Invariants Enforcement
// ============================================================================

import type {
  StudyStatus,
  EconomicStudy,
  StudyVersion,
  StudyIngredient,
  ConclusionTier,
} from './product-economics-types';

export class EconomicStudyLifecycle {
  private static readonly VALID_TRANSITIONS: Record<StudyStatus, StudyStatus[]> = {
    BORRADOR: ['EN_CONFIGURACION', 'BORRADOR'],
    EN_CONFIGURACION: ['LISTO_SIMULAR', 'BORRADOR', 'EN_CONFIGURACION'],
    LISTO_SIMULAR: ['ESTUDIADO', 'EN_CONFIGURACION', 'LISTO_SIMULAR'],
    ESTUDIADO: ['DECISION', 'LISTO_SIMULAR', 'ESTUDIADO'],
    DECISION: ['ESTUDIADO', 'DECISION'],
  };

  /**
   * Evaluates whether a transition from current status to next status is permitted.
   */
  public static canTransition(current: StudyStatus, next: StudyStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[current] ?? [];
    return allowed.includes(next);
  }

  /**
   * Determines the appropriate status for a study based on completeness of data.
   */
  public static evaluateStudyReadiness(
    study: EconomicStudy,
    version: StudyVersion,
    ingredients: StudyIngredient[]
  ): {
    recommendedStatus: StudyStatus;
    canSimulate: boolean;
    missingFields: string[];
  } {
    const missing: string[] = [];

    if (!study.productName || study.productName.trim() === '') {
      missing.push('product_name');
    }

    if (ingredients.length === 0) {
      missing.push('ingredients');
    }

    if (!version.batchNominalYield || version.batchNominalYield <= 0) {
      missing.push('batch_nominal_yield');
    }

    const hasPricedIngredients = ingredients.some((i) => i.unitPrice > 0);
    if (!hasPricedIngredients && ingredients.length > 0) {
      missing.push('priced_ingredients');
    }

    if (missing.length === 0) {
      return {
        recommendedStatus: 'LISTO_SIMULAR',
        canSimulate: true,
        missingFields: [],
      };
    }

    if (ingredients.length > 0) {
      return {
        recommendedStatus: 'EN_CONFIGURACION',
        canSimulate: false,
        missingFields: missing,
      };
    }

    return {
      recommendedStatus: 'BORRADOR',
      canSimulate: false,
      missingFields: missing,
    };
  }

  /**
   * Asserts that a version is mutable. Throws if frozen.
   */
  public static assertVersionMutable(version: StudyVersion): void {
    if (version.isFrozen) {
      throw new Error(
        `Version ${version.versionNumber} is frozen and immutable. Create a new version to modify parameters.`
      );
    }
  }

  /**
   * Evaluates the conclusion tier based on data completeness (Right to say NO SÉ).
   */
  public static evaluateConclusionTier(
    ingredients: StudyIngredient[],
    targetPvp: number | null
  ): {
    tier: ConclusionTier;
    label: string;
    reason: string;
  } {
    if (!targetPvp || targetPvp <= 0) {
      return {
        tier: 'INSUFFICIENT_DATA',
        label: 'Información Insuficiente',
        reason: 'El PVP objetivo no ha sido definido.',
      };
    }

    if (ingredients.length === 0) {
      return {
        tier: 'INSUFFICIENT_DATA',
        label: 'Información Insuficiente',
        reason: 'La receta no contiene ingredientes.',
      };
    }

    const missingPrices = ingredients.filter((i) => i.unitPrice <= 0);
    if (missingPrices.length > 0) {
      return {
        tier: 'INSUFFICIENT_DATA',
        label: 'Información Insuficiente',
        reason: `Existen ${missingPrices.length} ingredientes sin precio registrado.`,
      };
    }

    const manualCount = ingredients.filter((i) => i.priceProvenance === 'MANUAL').length;
    if (manualCount > 0) {
      return {
        tier: 'CONDITIONED',
        label: 'Conclusión Condicionada',
        reason: `Existen ${manualCount} ingredientes con precios manuales no verificados por mercado.`,
      };
    }

    return {
      tier: 'CERTIFIED',
      label: 'Conclusión Certificada',
      reason: 'Todos los ingredientes disponen de precios observables o reales auditados.',
    };
  }
}
