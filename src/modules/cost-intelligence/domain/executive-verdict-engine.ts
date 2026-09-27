// ============================================================================
// YOURMEAL OS — EXECUTIVE VERDICT & NARRATIVE SYNTHESIS (CR-COST-07C)
// Subsystem: Core Cost Intelligence (E9) · Food Vertical
// "Cero Falsas Certezas: Derecho Constitucional a decir NO SÉ."
// Tríada de Conclusión: CERTIFIED / CONDITIONED / INSUFFICIENT_DATA
// ============================================================================

import type {
  StudyVersion,
  StudyIngredient,
} from './product-economics-types';
import type { StudyOperationConfig } from './production-operational-types';
import type {
  BreakEvenAnalysisResult,
  EvaluatedScenario,
  ExecutiveVerdictResult,
  ExecutiveVerdictStatus,
  ScenarioEvaluationMatrix,
} from './decision-intelligence-types';

export class ExecutiveVerdictEngine {
  /**
   * Generates deterministic executive conclusion and human narrative explanation.
   * Right to say "I DON'T KNOW" (INSUFFICIENT_DATA) when critical information is missing.
   */
  public static synthesizeVerdict(
    productName: string,
    activeVersion: StudyVersion,
    ingredients: StudyIngredient[],
    operationConfig: StudyOperationConfig | null,
    scenariosMatrix: ScenarioEvaluationMatrix,
    breakEven: BreakEvenAnalysisResult
  ): ExecutiveVerdictResult {
    const epistemicGaps: string[] = [];
    const sensitivityFactors: string[] = [];

    // 1. Audit Epistemic Gaps
    if (activeVersion.targetPvp == null) {
      epistemicGaps.push('PVP objetivo no establecido.');
    }

    const hasUnconfiguredSurplus = scenariosMatrix.scenarios.some(
      (s) => s.surplusUnits > 0 && s.surplusStatus === 'UNCONFIGURED'
    );
    if (hasUnconfiguredSurplus) {
      epistemicGaps.push(
        'Destino de excedentes [NO CONFIGURADO]; bloquea el cálculo de coste por unidad vendida.'
      );
    }

    if (ingredients.length === 0) {
      epistemicGaps.push('El estudio carece de ingredientes configurados.');
    }

    const unpricedIngredients = ingredients.filter((i) => i.unitPrice <= 0);
    if (unpricedIngredients.length > 0) {
      epistemicGaps.push(
        `Existen ${unpricedIngredients.length} ingrediente(s) sin precio de mercado contrastado.`
      );
    }

    if (operationConfig) {
      const fixedMin =
        (operationConfig.laborSetupMinutes || 0) +
        (operationConfig.laborCleaningMinutes || 0);
      const varMin =
        (operationConfig.laborBatchMinutes || 0) +
        (operationConfig.laborUnitMinutes || 0);
      if ((fixedMin > 0 || varMin > 0) && operationConfig.laborHourlyRate == null) {
        epistemicGaps.push('Tarifa horaria de mano de obra [NO CONFIGURADA].');
      }
      if (operationConfig.energyMethod === 'UNCONFIGURED') {
        epistemicGaps.push('Método de coste energético [NO CONFIGURADO].');
      }
      if (operationConfig.packagingMode === 'UNCONFIGURED') {
        epistemicGaps.push('Coste de envases y packaging [NO CONFIGURADO].');
      }
    } else {
      epistemicGaps.push('Costes operativos de fábrica [NO CONFIGURADOS].');
    }

    // 2. Audit Sensitivity Factors
    const manualIngredients = ingredients.filter((i) => i.priceProvenance === 'MANUAL');
    if (manualIngredients.length > 0) {
      const names = manualIngredients.map((i) => `'${i.ingredientName}' (${i.unitPrice} €)`).join(', ');
      sensitivityFactors.push(`Precios de ingredientes introducidos de forma [MANUAL]: ${names}.`);
    }

    const rec = scenariosMatrix.recommendedScenario;
    if (rec && rec.surplusUnits > 0) {
      sensitivityFactors.push(
        `El escenario recomendado genera ${rec.surplusUnits} unidad(es) de excedente bajo destino [${rec.surplusStatus}]. Si se pierde, impactará negativamente en el margen real.`
      );
    }

    if (rec && rec.capacity.capacityLoadPct != null && rec.capacity.capacityLoadPct >= 85) {
      sensitivityFactors.push(
        `Carga operativa del ${rec.capacity.capacityLoadPct}% cercana al límite de capacidad de cocina.`
      );
    }

    if (
      breakEven.batchMetrics.isReachable &&
      breakEven.batchMetrics.breakEvenBatchUnits != null &&
      rec &&
      breakEven.batchMetrics.breakEvenBatchUnits > rec.demandUnits
    ) {
      sensitivityFactors.push(
        `Punto de amortización de tirada elevado: se necesitan ${breakEven.batchMetrics.breakEvenBatchUnits} unidades para cubrir costes fijos, superior a la demanda recomendada de ${rec.demandUnits} unidades.`
      );
    }

    // 3. Determine Final Status & Triad Conclusion Tier
    let status: ExecutiveVerdictStatus = 'VIABLE';
    let conclusionTier: 'CERTIFIED' | 'CONDITIONED' | 'INSUFFICIENT_DATA' = 'CERTIFIED';
    let headline = '';
    let narrativeSummary = '';
    let recommendedAction = '';

    // Critical failure: missing essential data
    if (
      activeVersion.targetPvp == null ||
      hasUnconfiguredSurplus ||
      ingredients.length === 0 ||
      unpricedIngredients.length > 0
    ) {
      status = 'INSUFFICIENT_DATA';
      conclusionTier = 'INSUFFICIENT_DATA';
      headline = '⚪ INFORMACIÓN INSUFICIENTE / NO DETERMINABLE';
      narrativeSummary = `El motor económico no puede certificar la viabilidad de ${productName} debido a la ausencia de datos críticos: ${epistemicGaps.join(' ')}`;
      recommendedAction =
        'Complete los parámetros obligatorios (PVP objetivo, precios de ingredientes y destino de excedentes) para emitir una recomendación.';
    } else if (!rec) {
      // Inviable because no scenario meets operational constraints
      status = 'NOT_VIABLE';
      conclusionTier = 'CONDITIONED';
      headline = '🔴 PRODUCTO OPERACIONALMENTE INVIABLE';
      narrativeSummary = `Para el producto ${productName}, ningún escenario de producción satisface simultáneamente las restricciones de capacidad instalada y margen económico.`;
      recommendedAction =
        'Revise los tiempos de elaboración, aumente el lote nominal o incremente el PVP de venta para viabilizar el producto.';
    } else if (rec.grossMarginPct != null && rec.grossMarginPct < 50) {
      status = 'NOT_VIABLE';
      conclusionTier = 'CONDITIONED';
      headline = '🔴 MARGEN BRUTO INSUFICIENTE (< 50%)';
      narrativeSummary = `A un PVP de ${activeVersion.targetPvp?.toFixed(2)} €, el margen obtenido en el escenario recomendado (${rec.grossMarginPct.toFixed(1)}%) es insuficiente para absorber la estructura operativa del negocio.`;
      recommendedAction = `Se recomienda un PVP mínimo de ${breakEven.pvpRecommendation.minimumViablePvp?.toFixed(2)} € para alcanzar el 70% de margen objetivo.`;
    } else if (epistemicGaps.length > 0 || sensitivityFactors.length > 0) {
      status = 'VIABLE_CONDITIONED';
      conclusionTier = 'CONDITIONED';
      headline = '🟡 PRODUCTO VIABLE CON CONDICIONANTES';
      narrativeSummary = `A un PVP de ${activeVersion.targetPvp?.toFixed(2)} €, ${productName} es viable en el escenario recomendado de ${rec.demandUnits} unidades (coste: ${rec.costPerSoldUnit?.toFixed(2)} €/ud, margen: ${rec.grossMarginPct?.toFixed(1)}%), pero sujeto a supuestos operativos que deben validarse en cocina.`;
      recommendedAction =
        'Autorizar prueba piloto en cocina supervisando los factores de sensibilidad declarados.';
    } else {
      status = 'VIABLE';
      conclusionTier = 'CERTIFIED';
      headline = '🟢 PRODUCTO VIABLE Y CERTIFICADO';
      narrativeSummary = `A un PVP de ${activeVersion.targetPvp?.toFixed(2)} €, ${productName} está completamente certificado. El escenario recomendado de ${rec.demandUnits} unidades ofrece un coste unitario de ${rec.costPerSoldUnit?.toFixed(2)} € y un margen robusto del ${rec.grossMarginPct?.toFixed(1)}%.`;
      recommendedAction = 'Aprobado para inclusión inmediata en oferta gastronómica y carta.';
    }

    return {
      status,
      conclusionTier,
      headline,
      narrativeSummary,
      sensitivityFactors,
      epistemicGaps,
      recommendedAction,
    };
  }
}
