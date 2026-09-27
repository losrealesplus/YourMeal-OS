/**
 * CR-COST-05: Market Benchmark & Negotiation Intelligence Engine
 * Pure mathematical engine for computing comparability-weighted medians,
 * price variances, annual spend risk, and structured negotiation briefs.
 */

import {
  BenchmarkCalculation,
  BenchmarkComponent,
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
      throw new Error(`No market observations provided for ingredient ${ingredient.name}`);
    }

    const canonicalUnit = inputs[0].observation.normalizedUnit;
    const components: BenchmarkComponent[] = [];

    for (const item of inputs) {
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
        normalizedPriceExTax: observation.normalizedPriceExTax,
        normalizedUnit: observation.normalizedUnit,
        comparabilityGrade: mapping.comparabilityGrade,
        weight: finalWeight,
        isStale,
        isPromo,
      });
    }

    // Filter valid weighted components (weight > 0)
    const activeComponents = components.filter((c) => c.weight > 0);

    if (activeComponents.length === 0) {
      throw new Error(
        `All provided market observations have zero comparability weight for ingredient ${ingredient.name}`
      );
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

    return {
      tenantIngredientId: ingredient.id,
      tenantIngredientName: ingredient.name,
      calculatedAt: referenceDate.toISOString(),
      canonicalUnit,
      benchmarkPriceExTax,
      minPriceExTax,
      maxPriceExTax,
      dispersionSpreadPct,
      observationsCount: components.length,
      highComparabilityCount: highCompCount,
      components,
    };
  }

  /**
   * Calculates price variance between tenant's internal economic WAC / invoice and the market benchmark.
   */
  public static analyzeVariance(
    tenantRef: TenantIngredientEconomicRef,
    benchmark: BenchmarkCalculation
  ): VarianceAnalysis {
    if (benchmark.benchmarkPriceExTax <= 0) {
      throw new Error('Benchmark price must be greater than zero to compute variance');
    }

    const variancePct = this.round(
      ((tenantRef.effectiveWacExTax - benchmark.benchmarkPriceExTax) /
        benchmark.benchmarkPriceExTax) *
        100,
      2
    );

    const invoicedRef = tenantRef.currentInvoicedPriceExTax ?? tenantRef.effectiveWacExTax;
    const supplierPriceGapEur = this.round(invoicedRef - benchmark.benchmarkPriceExTax, 4);

    let annualSpendAtRiskEur: number | undefined;
    if (tenantRef.annualVolume && tenantRef.annualVolume > 0) {
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
   */
  public static generateNegotiationBrief(
    tenant: { id: string; name: string },
    tenantRef: TenantIngredientEconomicRef,
    benchmark: BenchmarkCalculation,
    variance: VarianceAnalysis,
    referenceDate: Date = new Date()
  ): NegotiationBrief {
    const consumptionVol = tenantRef.annualVolume ?? 1000;
    const invoicedPrice = tenantRef.currentInvoicedPriceExTax ?? tenantRef.effectiveWacExTax;
    const projectedAnnualSpend = this.round(consumptionVol * invoicedPrice, 2);

    // Target re-negotiation price: midpoint between benchmark and current invoice if overpaying,
    // or benchmark itself
    const targetPrice =
      variance.supplierPriceGapEur > 0
        ? this.round(benchmark.benchmarkPriceExTax + variance.supplierPriceGapEur * 0.25, 4)
        : invoicedPrice;

    const potentialSavings =
      variance.supplierPriceGapEur > 0
        ? this.round(consumptionVol * (invoicedPrice - targetPrice), 2)
        : 0;

    const talkingPoints: NegotiationTalkingPoint[] = [];

    // Point 1: Volume leverage
    if (consumptionVol > 0) {
      talkingPoints.push({
        topic: 'Volume Scale',
        point: `Our annual volume of ${consumptionVol.toLocaleString()} ${tenantRef.unit} qualifies for Tier-2 wholesale baseline pricing.`,
        evidence: `Tenant annual consumption: ${consumptionVol} ${tenantRef.unit}.`,
        impactEur: potentialSavings,
      });
    }

    // Point 2: Market gap
    if (variance.marketVariancePct > 0) {
      const wholesaleRef = benchmark.components.find((c) => c.sourceType === 'b2b_wholesale');
      talkingPoints.push({
        topic: 'Wholesale Market Gap',
        point: `Observable B2B wholesale prices in this region are currently ${benchmark.benchmarkPriceExTax.toFixed(2)} €/${tenantRef.unit}, creating an uncompetitive spread of ${variance.marketVariancePct.toFixed(1)}%.`,
        evidence: wholesaleRef
          ? `Observed at ${wholesaleRef.sourceName} on ${wholesaleRef.observedAt.slice(0, 10)}.`
          : `Benchmark across ${benchmark.observationsCount} regional observations.`,
        impactEur: potentialSavings,
      });
    }

    // Point 3: Fair Target Proposal
    talkingPoints.push({
      topic: 'Target Alignment',
      point: `We propose adjusting our unit rate to ${targetPrice.toFixed(2)} €/${tenantRef.unit} to maintain supplier exclusivity while closing the market divergence.`,
      evidence: `Target price incorporates quality overhead while delivering competitive market parity.`,
      impactEur: potentialSavings,
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
