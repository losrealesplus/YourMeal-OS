/**
 * CR-COST-05: Market Benchmark & Negotiation Intelligence Engine
 * Pure mathematical engine for computing comparability-weighted medians,
 * price variances, annual spend risk, and structured negotiation briefs.
 *
 * PR3A Invariants (D-010 + Human Decisions 1-5):
 * - No synthetic volume fallback (eliminate ?? 1000)
 * - Observations with unknown tax / pending normalization are never treated as current price
 * - Prior computable observations are placed strictly into historicalReferences with diagnostics
 * - If prior observation is expired, return PENDING_NORMALIZATION without comparable price
 */

import {
  BenchmarkCalculation,
  BenchmarkComponent,
  BenchmarkStatus,
  ComparabilityGrade,
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  NegotiationBrief,
  NegotiationTalkingPoint,
  NormalizedUnit,
  ProductMapping,
  SourceType,
  TenantIngredientEconomicRef,
  VarianceAnalysis,
} from './types';

export interface BenchmarkInputObservation {
  source: MarketSource;
  product: MarketProduct;
  observation: MarketPriceObservation;
  mapping: ProductMapping;
}

export class BenchmarkCalculator {
  private static readonly SOURCE_WEIGHTS: Record<SourceType, number> = {
    b2b_wholesale: 1.0,
    cash_carry: 1.0,
    regional_specialist: 0.9,
    retail_ceiling: 0.3, // Retail is only a ceiling reference
  };

  private static readonly COMPARABILITY_WEIGHTS: Record<ComparabilityGrade, number> = {
    HIGH: 1.0,
    MEDIUM: 0.6,
    LOW: 0.2,
    UNKNOWN: 0.0, // Excluded
  };

  /**
   * Calculates the comparability-weighted market benchmark for a tenant ingredient.
   */
  public static calculateBenchmark(
    ingredient: { id: string; name: string },
    inputs: BenchmarkInputObservation[],
    referenceDate: Date = new Date()
  ): BenchmarkCalculation {
    if (inputs.length === 0) {
      return {
        tenantIngredientId: ingredient.id,
        tenantIngredientName: ingredient.name,
        calculatedAt: referenceDate.toISOString(),
        canonicalUnit: 'EUR_PER_KG',
        benchmarkStatus: 'NO_VALID_OBSERVATIONS',
        benchmarkPriceExTax: null,
        minPriceExTax: null,
        maxPriceExTax: null,
        dispersionSpreadPct: null,
        observationsCount: 0,
        highComparabilityCount: 0,
        components: [],
        historicalReferences: [],
        diagnosticNote: `No market observations provided for ingredient ${ingredient.name}`,
      };
    }

    // Group observations by product ID to detect pending normalization on the latest observation
    const inputsByProduct = new Map<string, BenchmarkInputObservation[]>();
    for (const item of inputs) {
      const list = inputsByProduct.get(item.product.id) || [];
      list.push(item);
      inputsByProduct.set(item.product.id, list);
    }

    const activeComputableInputs: BenchmarkInputObservation[] = [];
    const historicalReferences: BenchmarkComponent[] = [];
    const diagnosticNotes: string[] = [];

    for (const productInputs of inputsByProduct.values()) {
      // Sort newest to oldest
      productInputs.sort(
        (a, b) =>
          new Date(b.observation.observedAt).getTime() -
          new Date(a.observation.observedAt).getTime()
      );

      const latestItem = productInputs[0];
      const isLatestComputable =
        latestItem.observation.normalizedPriceExTax !== null &&
        Number.isFinite(latestItem.observation.normalizedPriceExTax) &&
        latestItem.observation.taxMode !== 'unknown';

      if (isLatestComputable) {
        activeComputableInputs.push(latestItem);
      } else {
        // Human Decision 4: Latest observation is pending normalization / unknown tax
        // Look for the last prior computable observation for this product
        const priorComputableItem = productInputs.slice(1).find(
          (item) =>
            item.observation.normalizedPriceExTax !== null &&
            Number.isFinite(item.observation.normalizedPriceExTax) &&
            item.observation.taxMode !== 'unknown'
        );

        if (priorComputableItem) {
          const priorObs = priorComputableItem.observation;
          const observedDate = new Date(priorObs.observedAt);
          const ageDays = (referenceDate.getTime() - observedDate.getTime()) / (1000 * 3600 * 24);
          const isStale =
            ageDays > 14 ||
            priorObs.qualityStatus === 'STALE' ||
            (priorObs.validTo != null && new Date(priorObs.validTo).getTime() < referenceDate.getTime());

          const sourceWeight = this.SOURCE_WEIGHTS[priorComputableItem.source.sourceType] ?? 0.5;
          const compWeight = this.COMPARABILITY_WEIGHTS[priorComputableItem.mapping.comparabilityGrade] ?? 0.0;
          const freshnessFactor = isStale ? 0.5 : 1.0;
          const finalWeight = this.round(sourceWeight * compWeight * freshnessFactor, 4);

          historicalReferences.push({
            observationId: priorObs.id,
            sourceId: priorComputableItem.source.id,
            sourceName: priorComputableItem.source.name,
            sourceType: priorComputableItem.source.sourceType,
            rawName: priorComputableItem.product.rawName,
            regionCode: priorObs.regionCode,
            observedAt: priorObs.observedAt,
            rawPrice: priorObs.priceRaw,
            taxMode: priorObs.taxMode,
            taxRate: priorObs.taxRate,
            normalizedPriceExTax: priorObs.normalizedPriceExTax as number,
            normalizedUnit: priorObs.normalizedUnit,
            comparabilityGrade: priorComputableItem.mapping.comparabilityGrade,
            weight: finalWeight,
            isStale,
            isPromo:
              priorObs.promotionStatus === 'temporary_discount' ||
              priorObs.promotionStatus === 'clearance' ||
              priorObs.qualityStatus === 'PROMOTIONAL',
          });

          if (isStale) {
            diagnosticNotes.push(
              `Producto "${latestItem.product.rawName}": observación más reciente (${latestItem.observation.observedAt.slice(0, 10)}) pendiente de normalización fiscal. La referencia previa (${priorObs.observedAt.slice(0, 10)}) está caducada y no es computable como precio actual.`
            );
          } else {
            diagnosticNotes.push(
              `Producto "${latestItem.product.rawName}": observación más reciente (${latestItem.observation.observedAt.slice(0, 10)}) pendiente de normalización fiscal. La referencia previa (${priorObs.observedAt.slice(0, 10)}) se conserva únicamente como referencia histórica y no como precio actual.`
            );
          }
        } else {
          diagnosticNotes.push(
            `Producto "${latestItem.product.rawName}": observación más reciente (${latestItem.observation.observedAt.slice(0, 10)}) pendiente de normalización fiscal. No existe observación previa computable.`
          );
        }
      }
    }

    // Determine canonical unit from first available observation
    const canonicalUnit: NormalizedUnit =
      activeComputableInputs[0]?.observation.normalizedUnit ||
      historicalReferences[0]?.normalizedUnit ||
      inputs[0].observation.normalizedUnit ||
      'EUR_PER_KG';

    // If no active computable inputs remain:
    if (activeComputableInputs.length === 0) {
      const benchmarkStatus: BenchmarkStatus =
        diagnosticNotes.length > 0 ? 'PENDING_NORMALIZATION' : 'NO_VALID_OBSERVATIONS';

      return {
        tenantIngredientId: ingredient.id,
        tenantIngredientName: ingredient.name,
        calculatedAt: referenceDate.toISOString(),
        canonicalUnit,
        benchmarkStatus,
        benchmarkPriceExTax: null,
        minPriceExTax: null,
        maxPriceExTax: null,
        dispersionSpreadPct: null,
        observationsCount: inputs.length,
        highComparabilityCount: 0,
        components: [],
        historicalReferences,
        diagnosticNote: diagnosticNotes.join(' ') || 'Sin observaciones computables disponibles.',
      };
    }

    const components: BenchmarkComponent[] = [];

    for (const item of activeComputableInputs) {
      const { source, product, observation, mapping } = item;

      if (observation.normalizedUnit !== canonicalUnit) {
        throw new Error(
          `Unit mismatch in benchmark inputs: expected ${canonicalUnit}, received ${observation.normalizedUnit}`
        );
      }

      // Check freshness TTL (Default: 14 days)
      const observedDate = new Date(observation.observedAt);
      const ageDays = (referenceDate.getTime() - observedDate.getTime()) / (1000 * 3600 * 24);
      const isStale = ageDays > 14 || observation.qualityStatus === 'STALE';
      const isPromo =
        observation.promotionStatus === 'temporary_discount' ||
        observation.promotionStatus === 'clearance' ||
        observation.qualityStatus === 'PROMOTIONAL';

      const sourceWeight = this.SOURCE_WEIGHTS[source.sourceType] ?? 0.5;
      const compWeight = this.COMPARABILITY_WEIGHTS[mapping.comparabilityGrade] ?? 0.0;
      const freshnessFactor = isStale ? 0.5 : 1.0;

      const finalWeight = this.round(sourceWeight * compWeight * freshnessFactor, 4);

      components.push({
        observationId: observation.id,
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.sourceType,
        rawName: product.rawName,
        regionCode: observation.regionCode,
        observedAt: observation.observedAt,
        rawPrice: observation.priceRaw,
        taxMode: observation.taxMode,
        taxRate: observation.taxRate,
        normalizedPriceExTax: observation.normalizedPriceExTax as number,
        normalizedUnit: observation.normalizedUnit,
        comparabilityGrade: mapping.comparabilityGrade,
        weight: finalWeight,
        isStale,
        isPromo,
        isTenantOwned: Boolean(observation.ownerTenantId),
      });
    }

    // Filter valid weighted components (weight > 0)
    const activeComponents = components.filter((c) => c.weight > 0);

    if (activeComponents.length === 0) {
      return {
        tenantIngredientId: ingredient.id,
        tenantIngredientName: ingredient.name,
        calculatedAt: referenceDate.toISOString(),
        canonicalUnit,
        benchmarkStatus: 'NO_VALID_OBSERVATIONS',
        benchmarkPriceExTax: null,
        minPriceExTax: null,
        maxPriceExTax: null,
        dispersionSpreadPct: null,
        observationsCount: inputs.length,
        highComparabilityCount: 0,
        components,
        historicalReferences,
        hasRealObservations: false,
        latestRealPriceExTax: null,
        diagnosticNote:
          'Todas las observaciones de mercado tienen peso de comparabilidad nulo (UNKNOWN). ' +
          (diagnosticNotes.join(' ') || ''),
      };
    }

    // Sort ascending by price
    activeComponents.sort((a, b) => a.normalizedPriceExTax - b.normalizedPriceExTax);

    const benchmarkPriceExTax = this.calculateWeightedMedian(activeComponents);
    const minPriceExTax = activeComponents[0].normalizedPriceExTax;
    const maxPriceExTax = activeComponents[activeComponents.length - 1].normalizedPriceExTax;

    const dispersionSpreadPct =
      benchmarkPriceExTax > 0
        ? this.round(((maxPriceExTax - minPriceExTax) / benchmarkPriceExTax) * 100, 2)
        : 0;

    const highCompCount = components.filter((c) => c.comparabilityGrade === 'HIGH').length;
    const realComponents = components.filter((c) => c.isTenantOwned);
    const hasRealObservations = realComponents.length > 0;
    const latestRealPriceExTax = hasRealObservations ? realComponents[0].normalizedPriceExTax : null;

    return {
      tenantIngredientId: ingredient.id,
      tenantIngredientName: ingredient.name,
      calculatedAt: referenceDate.toISOString(),
      canonicalUnit,
      benchmarkStatus: 'COMPUTED',
      benchmarkPriceExTax,
      minPriceExTax,
      maxPriceExTax,
      dispersionSpreadPct,
      observationsCount: inputs.length,
      highComparabilityCount: highCompCount,
      components,
      historicalReferences,
      hasRealObservations,
      latestRealPriceExTax,
      diagnosticNote: diagnosticNotes.length > 0 ? diagnosticNotes.join(' ') : null,
    };
  }

  /**
   * Calculates price variance between tenant's internal economic WAC / invoice and the market benchmark.
   */
  public static analyzeVariance(
    tenantRef: TenantIngredientEconomicRef,
    benchmark: BenchmarkCalculation
  ): VarianceAnalysis {
    if (benchmark.benchmarkPriceExTax === null || benchmark.benchmarkPriceExTax <= 0) {
      return {
        tenantIngredientId: tenantRef.id,
        tenantIngredientName: tenantRef.name,
        unit: benchmark.canonicalUnit,
        effectiveWacExTax: tenantRef.effectiveWacExTax,
        currentInvoicedPriceExTax: tenantRef.currentInvoicedPriceExTax,
        benchmarkPriceExTax: null,
        marketVariancePct: null,
        supplierPriceGapEur: null,
        annualSpendAtRiskEur: null,
        status: 'PENDING_DATA',
        confidenceSummary: 'UNKNOWN',
      };
    }

    const variancePct = this.round(
      ((tenantRef.effectiveWacExTax - benchmark.benchmarkPriceExTax) /
        benchmark.benchmarkPriceExTax) *
        100,
      2
    );

    const invoicedRef = tenantRef.currentInvoicedPriceExTax ?? tenantRef.effectiveWacExTax;
    const supplierPriceGapEur = this.round(invoicedRef - benchmark.benchmarkPriceExTax, 4);

    let annualSpendAtRiskEur: number | null = null;
    if (tenantRef.annualVolume != null && tenantRef.annualVolume > 0) {
      annualSpendAtRiskEur = this.round(tenantRef.annualVolume * supplierPriceGapEur, 2);
    }

    let status: 'FAVORABLE' | 'AT_PAR' | 'UNFAVORABLE_OVERPAYING';
    if (variancePct > 2.0) {
      status = 'UNFAVORABLE_OVERPAYING';
    } else if (variancePct < -2.0) {
      status = 'FAVORABLE';
    } else {
      status = 'AT_PAR';
    }

    const confidenceSummary: ComparabilityGrade =
      benchmark.highComparabilityCount > 0
        ? 'HIGH'
        : benchmark.components.some((c) => c.comparabilityGrade === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW';

    return {
      tenantIngredientId: tenantRef.id,
      tenantIngredientName: tenantRef.name,
      unit: benchmark.canonicalUnit,
      effectiveWacExTax: tenantRef.effectiveWacExTax,
      currentInvoicedPriceExTax: tenantRef.currentInvoicedPriceExTax,
      benchmarkPriceExTax: benchmark.benchmarkPriceExTax,
      marketVariancePct: variancePct,
      supplierPriceGapEur,
      annualSpendAtRiskEur,
      status,
      confidenceSummary,
    };
  }

  /**
   * Generates a structured Negotiation Brief for procurement operators.
   * D-010 Integrity: No synthetic fallback volume (never invent 1000 kg).
   */
  public static generateNegotiationBrief(
    tenant: { id: string; name: string },
    tenantRef: TenantIngredientEconomicRef,
    benchmark: BenchmarkCalculation,
    variance: VarianceAnalysis,
    referenceDate: Date = new Date()
  ): NegotiationBrief {
    const hasVolume = tenantRef.annualVolume != null && tenantRef.annualVolume > 0;
    const consumptionVol = hasVolume ? (tenantRef.annualVolume as number) : null;
    const invoicedPrice = tenantRef.currentInvoicedPriceExTax ?? tenantRef.effectiveWacExTax;
    const projectedAnnualSpend = hasVolume
      ? this.round((consumptionVol as number) * invoicedPrice, 2)
      : null;

    // Target re-negotiation price: midpoint between benchmark and current invoice if overpaying,
    // or benchmark itself
    const targetPrice =
      benchmark.benchmarkPriceExTax !== null &&
      variance.supplierPriceGapEur !== null &&
      variance.supplierPriceGapEur > 0
        ? this.round(benchmark.benchmarkPriceExTax + variance.supplierPriceGapEur * 0.25, 4)
        : invoicedPrice;

    const potentialSavings =
      hasVolume &&
      variance.supplierPriceGapEur !== null &&
      variance.supplierPriceGapEur > 0
        ? this.round((consumptionVol as number) * (invoicedPrice - targetPrice), 2)
        : hasVolume
        ? 0
        : null;

    const talkingPoints: NegotiationTalkingPoint[] = [];

    // Point 1: Volume leverage (Only when real annual volume is documented)
    if (consumptionVol !== null && consumptionVol > 0) {
      talkingPoints.push({
        topic: 'Volume Scale',
        point: `Our annual volume of ${consumptionVol.toLocaleString()} ${tenantRef.unit} qualifies for Tier-2 wholesale baseline pricing.`,
        evidence: `Tenant annual consumption: ${consumptionVol} ${tenantRef.unit}.`,
        impactEur: potentialSavings ?? undefined,
      });
    }

    // Point 2: Market gap
    if (
      variance.marketVariancePct !== null &&
      variance.marketVariancePct > 0 &&
      benchmark.benchmarkPriceExTax !== null
    ) {
      const wholesaleRef = benchmark.components.find((c) => c.sourceType === 'b2b_wholesale');
      talkingPoints.push({
        topic: 'Wholesale Market Gap',
        point: `Observable B2B wholesale prices in this region are currently ${benchmark.benchmarkPriceExTax.toFixed(2)} €/${tenantRef.unit}, creating an uncompetitive spread of ${variance.marketVariancePct.toFixed(1)}%.`,
        evidence: wholesaleRef
          ? `Observed at ${wholesaleRef.sourceName} on ${wholesaleRef.observedAt.slice(0, 10)}.`
          : `Benchmark across ${benchmark.observationsCount} regional observations.`,
        impactEur: potentialSavings ?? undefined,
      });
    }

    // Point 3: Fair Target Proposal
    talkingPoints.push({
      topic: 'Target Alignment',
      point: `We propose adjusting our unit rate to ${targetPrice.toFixed(2)} €/${tenantRef.unit} to maintain supplier exclusivity while closing the market divergence.`,
      evidence: `Target price incorporates quality overhead while delivering competitive market parity.`,
      impactEur: potentialSavings ?? undefined,
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      generatedAt: referenceDate.toISOString(),
      ingredientId: tenantRef.id,
      ingredientName: tenantRef.name,
      targetSupplierName: tenantRef.primarySupplierName,
      currentInvoicedPriceExTax: invoicedPrice,
      effectiveWacExTax: tenantRef.effectiveWacExTax,
      consumptionVolume: consumptionVol,
      unit: tenantRef.unit,
      projectedAnnualSpendEur: projectedAnnualSpend,
      benchmarkPriceExTax: benchmark.benchmarkPriceExTax,
      potentialAnnualSavingsEur: potentialSavings,
      targetRenegotiationPriceExTax: targetPrice,
      varianceAnalysis: variance,
      observableComponents: benchmark.components,
      talkingPoints,
    };
  }

  /**
   * Internal weighted median calculation.
   */
  private static calculateWeightedMedian(
    sortedComponents: { normalizedPriceExTax: number; weight: number }[]
  ): number {
    const totalWeight = sortedComponents.reduce((acc, c) => acc + c.weight, 0);
    if (totalWeight <= 0) {
      return sortedComponents[0].normalizedPriceExTax;
    }

    const halfWeight = totalWeight / 2;
    let cumulativeWeight = 0;

    for (let i = 0; i < sortedComponents.length; i++) {
      cumulativeWeight += sortedComponents[i].weight;
      if (cumulativeWeight >= halfWeight) {
        return this.round(sortedComponents[i].normalizedPriceExTax, 4);
      }
    }

    return this.round(sortedComponents[sortedComponents.length - 1].normalizedPriceExTax, 4);
  }

  private static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
