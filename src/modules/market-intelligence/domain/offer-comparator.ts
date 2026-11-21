/**
 * CR-COST-05 Bloque 3: Market Offer Comparator & Explainable Ranking Engine
 * Pure mathematical, rule-based comparison engine for evaluating market offers,
 * applying volume tiers, computing landed costs vs origin prices, enforcing
 * anti-deception gates for Top 1 recommendations, and generating transparent rankings.
 *
 * Core-First Principle: Country-agnostic, tenant-neutral.
 * ADR 0010: Code in English; business notes, reasons and diagnostics in Spanish.
 */

import {
  ComparisonContext,
  ComparisonInputObservation,
  DisqualifiedOffer,
  MarketOfferRanking,
  MarketVolumeTier,
  NormalizedUnit,
  OfferUncertaintyFlag,
  PricingComparisonMode,
  RankedMarketOffer,
  MarketTenantConfig,
} from './types';
import { PriceNormalizer } from './price-normalizer';
import { evaluateDeliveryCoverage } from './geo-coverage';

export class OfferComparator {
  /**
   * Evaluates all candidate market observations for a tenant ingredient and produces
   * an explainable ranking with Top 1, up to 2-3 alternatives, and disqualified offers.
   */
  public static compareOffers(
    ingredient: {
      id: string;
      name: string;
      effectiveWacExTax?: number | null;
      unit?: string;
    },
    inputs: ComparisonInputObservation[],
    context: ComparisonContext = {},
    tenantConfig?: MarketTenantConfig | null
  ): MarketOfferRanking {
    const refDate = context.referenceDate ?? new Date();
    const maxFreshnessDays = context.maxFreshnessDays ?? 14;
    const comparisonMode: PricingComparisonMode =
      context.comparisonMode ?? tenantConfig?.pricingComparisonMode ?? 'landed_cost';
    const batchQuantity =
      context.batchQuantity != null && context.batchQuantity > 0 ? context.batchQuantity : null;
    const batchUnit = context.batchUnit || ingredient.unit || 'kg';
    const canonicalUnit: NormalizedUnit =
      inputs[0]?.observation.normalizedUnit || 'EUR_PER_KG';

    const disqualifiedOffers: DisqualifiedOffer[] = [];
    const candidateOffers: RankedMarketOffer[] = [];

    for (const item of inputs) {
      const { source, product, observation, mapping } = item;

      // 1. Comparability pre-filter
      if (mapping.comparabilityGrade === 'UNKNOWN') {
        disqualifiedOffers.push({
          observationId: observation.id,
          sourceId: source.id,
          sourceName: source.name,
          productName: product.rawName,
          reason: 'COMPARABILITY_GRADE_EXCLUDED',
          diagnosticNote: 'Grado de comparabilidad excluido o no evaluado (UNKNOWN).',
        });
        continue;
      }

      // 2. Thermal state compatibility
      if (
        context.targetThermalState &&
        product.thermalState &&
        context.targetThermalState !== product.thermalState
      ) {
        disqualifiedOffers.push({
          observationId: observation.id,
          sourceId: source.id,
          sourceName: source.name,
          productName: product.rawName,
          reason: 'THERMAL_STATE_INCOMPATIBLE',
          diagnosticNote: `Incompatibilidad térmica: se requiere "${context.targetThermalState}" y la oferta es "${product.thermalState}".`,
        });
        continue;
      }

      // 3. Minimum Order Quantity (MOQ)
      if (
        batchQuantity != null &&
        observation.minOrderQty != null &&
        observation.minOrderQty > batchQuantity
      ) {
        disqualifiedOffers.push({
          observationId: observation.id,
          sourceId: source.id,
          sourceName: source.name,
          productName: product.rawName,
          reason: 'MIN_ORDER_QTY_EXCEEDED',
          diagnosticNote: `Pedido mínimo de ${observation.minOrderQty} ${observation.minOrderUnit || 'uds'} supera el lote solicitado de ${batchQuantity} ${batchUnit}.`,
        });
        continue;
      }

      const uncertaintyFlags: OfferUncertaintyFlag[] = [];
      let isEligibleTop1 = true;
      const ineligibilityReasons: string[] = [];

      // 4. Geographic delivery evaluation
      let deliveryCoverageState = observation.deliveryCoverageState || 'unknown';
      let fulfillmentMode = undefined;

      if (context.targetLocation) {
        const geoResult = evaluateDeliveryCoverage({
          sourceId: source.id,
          establishmentId: observation.establishmentId,
          observationRegionCode: observation.regionCode,
          coverages: item.coverages || [],
          target: context.targetLocation,
          referenceDate: refDate,
        });

        deliveryCoverageState = geoResult.state;
        fulfillmentMode = geoResult.fulfillmentMode;

        if (geoResult.state === 'unavailable_in_target') {
          disqualifiedOffers.push({
            observationId: observation.id,
            sourceId: source.id,
            sourceName: source.name,
            productName: product.rawName,
            reason: 'OUT_OF_GEOGRAPHIC_COVERAGE',
            diagnosticNote: geoResult.reason,
          });
          continue;
        }

        if (geoResult.state === 'unknown') {
          uncertaintyFlags.push('UNVERIFIED_GEO_COVERAGE');
          isEligibleTop1 = false;
          ineligibilityReasons.push(
            'Cobertura geográfica de entrega no confirmada documentalmente en el destino solicitado.'
          );
        }
      }

      // 5. Freshness and Expiration check
      if (
        observation.validTo != null &&
        new Date(observation.validTo).getTime() < refDate.getTime()
      ) {
        uncertaintyFlags.push('STALE_OBSERVATION');
        isEligibleTop1 = false;
        ineligibilityReasons.push(
          `Oferta caducada (fecha límite de validez: ${observation.validTo}).`
        );
      }

      const ageDays =
        (refDate.getTime() - new Date(observation.observedAt).getTime()) / (1000 * 3600 * 24);
      const isStale = ageDays > maxFreshnessDays || observation.qualityStatus === 'STALE';
      if (isStale) {
        if (!uncertaintyFlags.includes('STALE_OBSERVATION')) {
          uncertaintyFlags.push('STALE_OBSERVATION');
        }
        isEligibleTop1 = false;
        ineligibilityReasons.push(
          `Observación no reciente (antigüedad de ${Math.floor(ageDays)} días, umbral máximo: ${maxFreshnessDays} días).`
        );
      }

      // 6. Quality and Promotional status
      if (
        observation.qualityStatus === 'ESTIMATED' ||
        observation.qualityStatus === 'LOW_CONFIDENCE'
      ) {
        uncertaintyFlags.push('ESTIMATED_QUALITY');
        isEligibleTop1 = false;
        ineligibilityReasons.push('Calidad de observación estimada o de baja confianza.');
      }

      const isPromo =
        observation.promotionStatus === 'temporary_discount' ||
        observation.promotionStatus === 'clearance' ||
        observation.qualityStatus === 'PROMOTIONAL';
      if (isPromo) {
        uncertaintyFlags.push('PROMOTIONAL_TEMPORARY');
      }

      // 7. Volume Tier Selection
      let appliedTier: MarketVolumeTier | null = null;
      let baseNormalizedPriceExTax: number | null = null;
      let effectiveQuantityUnit: string = observation.normalizedUnit;

      if (batchQuantity != null && observation.volumeTiers && observation.volumeTiers.length > 0) {
        const qualifyingTiers = observation.volumeTiers
          .filter((t) => batchQuantity >= t.minQuantity)
          .sort((a, b) => b.minQuantity - a.minQuantity);

        if (qualifyingTiers.length > 0) {
          appliedTier = qualifyingTiers[0];
          effectiveQuantityUnit = appliedTier.tierQuantityUnit || 'unit';

          if (
            appliedTier.taxMode === 'unknown' ||
            appliedTier.tierNormalizedPriceExTax === null
          ) {
            // Tier price cannot be computed under D-010.
            // Fall back to base observation price if available, but flag uncertainty and block Top 1
            baseNormalizedPriceExTax = observation.normalizedPriceExTax;
            uncertaintyFlags.push('UNQUANTIFIED_SURCHARGE');
            isEligibleTop1 = false;
            ineligibilityReasons.push(
              'Escalado de volumen aplicable con fiscalidad desconocida (D-010); precio de escalado no computable.'
            );
          } else {
            baseNormalizedPriceExTax = appliedTier.tierNormalizedPriceExTax;
          }
        }
      }

      if (appliedTier == null) {
        baseNormalizedPriceExTax = observation.normalizedPriceExTax;
      }

      // 8. Fiscal Integrity Gate (D-010)
      if (baseNormalizedPriceExTax === null || observation.taxMode === 'unknown') {
        isEligibleTop1 = false;
        ineligibilityReasons.push(
          'Fiscalidad de la oferta no resuelta o precio ex-tax nulo (D-010).'
        );
        disqualifiedOffers.push({
          observationId: observation.id,
          sourceId: source.id,
          sourceName: source.name,
          productName: product.rawName,
          reason: 'UNRESOLVED_TAX_MODE',
          diagnosticNote:
            'Precio sin impuestos incalculable por fiscalidad desconocida o incompleta (D-010).',
        });
        continue;
      }

      // 9. Landed Cost Calculation
      const landedResult = PriceNormalizer.calculateLandedCost(
        {
          normalizedPriceExTax: baseNormalizedPriceExTax,
          freightInclusion: observation.freightInclusion || 'unknown',
          freightCostRaw: observation.freightCostRaw,
          freeFreightMinOrderAmount: observation.freeFreightMinOrderAmount,
          batchQuantity: batchQuantity ?? undefined,
          orderAmount:
            batchQuantity != null
              ? batchQuantity * (observation.priceRaw || baseNormalizedPriceExTax)
              : undefined,
        },
        comparisonMode
      );

      const originPriceExTax = landedResult.originPriceExTax as number;
      const freightSurchargePerUnit = landedResult.freightSurchargePerUnit ?? 0;
      const landedCostExTax = landedResult.landedCostExTax ?? originPriceExTax;
      const freightStatus = landedResult.freightStatus;

      if (comparisonMode === 'landed_cost' && freightStatus === 'unknown_freight') {
        uncertaintyFlags.push('UNKNOWN_FREIGHT');
        isEligibleTop1 = false;
        ineligibilityReasons.push(
          'Coste puesto en destino indeterminado: portes excluidos o no cuantificados en la oferta.'
        );
      }

      // 10. AIEM Uncertainty in Canary Islands
      if (observation.aiemStatus === 'applicable_inclusion_unknown') {
        uncertaintyFlags.push('AIEM_INCLUSION_UNKNOWN');
      }

      // 11. Effective Comparable Price
      const effectiveComparablePriceExTax =
        comparisonMode === 'landed_cost' ? landedCostExTax : originPriceExTax;

      // 12. Tie-break Scoring:
      // Higher score indicates better certainty, freshness, mapping grade and provider channel.
      const uncertaintyScore = Math.max(0, 100 - uncertaintyFlags.length * 25);
      const freshnessScore = Math.max(0, 100 - Math.min(ageDays, 50) * 2);
      const compGradeScore =
        mapping.comparabilityGrade === 'HIGH' ? 100 : mapping.comparabilityGrade === 'MEDIUM' ? 60 : 20;
      const channelScore =
        source.sourceType === 'b2b_wholesale'
          ? 40
          : source.sourceType === 'cash_carry'
          ? 30
          : source.sourceType === 'regional_specialist'
          ? 20
          : 10;

      const tieBreakScore =
        uncertaintyScore * 10000 + compGradeScore * 100 + freshnessScore * 10 + channelScore;

      // Explanatory note
      const explanationParts: string[] = [
        `Fuente: ${source.name} (${source.sourceType}).`,
        appliedTier
          ? `Aplica escalado por volumen desde ${appliedTier.minQuantity} ${appliedTier.tierQuantityUnit || 'uds'}.`
          : 'Tarifa unitaria base.',
        comparisonMode === 'landed_cost'
          ? `Landed cost: ${landedCostExTax.toFixed(2)} € (Origen: ${originPriceExTax.toFixed(2)} € + Portes: ${freightSurchargePerUnit.toFixed(2)} €).`
          : `Precio origen: ${originPriceExTax.toFixed(2)} €.`,
      ];
      if (uncertaintyFlags.length > 0) {
        explanationParts.push(`Avisos de incertidumbre: [${uncertaintyFlags.join(', ')}].`);
      }

      candidateOffers.push({
        observationId: observation.id,
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.sourceType,
        channelType: source.channelType,
        productId: product.id,
        rawName: product.rawName,
        brand: product.brand,
        origin: product.origin,
        thermalState: product.thermalState,
        comparabilityGrade: mapping.comparabilityGrade,
        appliedTier,
        effectiveQuantityUnit,
        originPriceExTax: this.round(originPriceExTax, 4),
        freightSurchargePerUnit: this.round(freightSurchargePerUnit, 4),
        landedCostExTax: this.round(landedCostExTax, 4),
        effectiveComparablePriceExTax: this.round(effectiveComparablePriceExTax, 4),
        taxMode: observation.taxMode,
        taxRate: observation.taxRate,
        taxRegime: observation.taxRegime,
        aiemStatus: observation.aiemStatus,
        freightStatus,
        deliveryCoverageState,
        fulfillmentMode,
        observedAt: observation.observedAt,
        validTo: observation.validTo,
        qualityStatus: observation.qualityStatus,
        isStale,
        isPromo,
        uncertaintyFlags,
        isEligibleTop1,
        ineligibilityReason:
          ineligibilityReasons.length > 0 ? ineligibilityReasons.join(' ') : undefined,
        tieBreakScore,
        explanationNote: explanationParts.join(' '),
      });
    }

    // 13. Deterministic Sorting:
    // Primary: Lowest effectiveComparablePriceExTax
    // Secondary: Highest tieBreakScore (least uncertainty, freshest, highest grade)
    candidateOffers.sort((a, b) => {
      const priceDiff = a.effectiveComparablePriceExTax - b.effectiveComparablePriceExTax;
      if (Math.abs(priceDiff) >= 0.0001) {
        return priceDiff;
      }
      return b.tieBreakScore - a.tieBreakScore;
    });

    // 14. Top 1 Selection vs Alternatives
    const top1Index = candidateOffers.findIndex((o) => o.isEligibleTop1);
    let top1: RankedMarketOffer | null = null;
    let top1Explanation: string;
    let alternatives: RankedMarketOffer[] = [];

    if (top1Index !== -1) {
      top1 = candidateOffers[top1Index];
      // Remaining candidates form the alternatives list (up to 3)
      alternatives = candidateOffers.filter((_, idx) => idx !== top1Index).slice(0, 3);
      top1Explanation =
        `Opción de compra recomendada (Top 1): ${top1.sourceName} - "${top1.rawName}" ` +
        `a ${top1.effectiveComparablePriceExTax.toFixed(2)} €/ud (${comparisonMode}). ` +
        `Cumple todos los requisitos de certeza fiscal, vigencia documental y cobertura logística confirmada.`;
    } else {
      top1 = null;
      alternatives = candidateOffers.slice(0, 3);
      top1Explanation =
        'Ninguna oferta observable cumple todos los requisitos de elegibilidad para Top 1 ' +
        '(certeza fiscal ex-tax, portes cuantificados y vigencia documental sin caducidad). ' +
        'Se presentan las mejores alternativas disponibles con sus advertencias de incertidumbre.';
    }

    // 15. Honest Savings Calculation (Rule 4: Do not invent savings under uncertainty)
    let tenantWacExTax: number | null = null;
    let savingsVsWacEurPerUnit: number | null = null;
    let savingsVsWacPct: number | null = null;
    let savingsVsAlternativeEurPerUnit: number | null = null;
    let savingsConfidence: 'VERIFIED' | 'UNCERTAIN' | 'NOT_COMPUTABLE' = 'NOT_COMPUTABLE';
    let savingsExplanation = '';

    if (ingredient.effectiveWacExTax != null && ingredient.effectiveWacExTax > 0) {
      tenantWacExTax = this.round(ingredient.effectiveWacExTax, 4);

      if (top1 != null) {
        const rawGap = tenantWacExTax - top1.effectiveComparablePriceExTax;
        if (top1.uncertaintyFlags.length === 0) {
          savingsVsWacEurPerUnit = this.round(rawGap, 4);
          savingsVsWacPct = this.round((rawGap / tenantWacExTax) * 100, 2);
          savingsConfidence = 'VERIFIED';
          savingsExplanation =
            rawGap > 0
              ? `Ahorro potencial confirmado de ${savingsVsWacEurPerUnit.toFixed(2)} €/ud (${savingsVsWacPct.toFixed(1)}%) frente al WAC actual del restaurante (${tenantWacExTax.toFixed(2)} €/ud).`
              : `La oferta recomendada (${top1.effectiveComparablePriceExTax.toFixed(2)} €/ud) no genera ahorro frente al coste actual (${tenantWacExTax.toFixed(2)} €/ud).`;
        } else {
          savingsConfidence = 'UNCERTAIN';
          savingsExplanation =
            `Existe una diferencia estimada de ${rawGap.toFixed(2)} €/ud frente al WAC (${tenantWacExTax.toFixed(2)} €/ud), ` +
            `pero no se declara ahorro garantizado debido a incertidumbres en la oferta ganadora: [${top1.uncertaintyFlags.join(', ')}].`;
        }
      } else {
        savingsConfidence = 'NOT_COMPUTABLE';
        savingsExplanation =
          'No se puede cuantificar ahorro garantizado al no haber una oferta calificada como Top 1.';
      }
    } else {
      savingsConfidence = 'NOT_COMPUTABLE';
      savingsExplanation =
        'El ingrediente del tenant no tiene un coste medio ponderado (WAC) registrado para comparar.';
    }

    if (top1 != null && alternatives.length > 0) {
      const bestAlt = alternatives[0];
      savingsVsAlternativeEurPerUnit = this.round(
        bestAlt.effectiveComparablePriceExTax - top1.effectiveComparablePriceExTax,
        4
      );
    }

    return {
      tenantIngredientId: ingredient.id,
      tenantIngredientName: ingredient.name,
      calculatedAt: refDate.toISOString(),
      comparisonMode,
      batchQuantity,
      batchUnit,
      canonicalUnit,
      top1,
      top1Explanation,
      alternatives,
      disqualifiedOffers,
      totalObservationsEvaluated: inputs.length,
      tenantWacExTax,
      savingsVsWacEurPerUnit,
      savingsVsWacPct,
      savingsVsAlternativeEurPerUnit,
      savingsConfidence,
      savingsExplanation,
    };
  }

  private static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
