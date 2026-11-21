/**
 * CR-COST-05: Market Benchmark Application Service
 * Orchestrates benchmark retrieval, variance analysis against tenant WAC,
 * and negotiation brief generation.
 */

import { BenchmarkCalculator } from '../domain/benchmark-calculator';
import { OfferComparator } from '../domain/offer-comparator';
import {
  BenchmarkCalculation,
  ComparisonContext,
  MarketOfferRanking,
  NegotiationBrief,
  TenantIngredientEconomicRef,
  VarianceAnalysis,
} from '../domain/types';
import { IMarketIntelligenceRepository } from '../infrastructure/repositories/market-repository-interface';

export class MarketBenchmarkService {
  constructor(private readonly repository: IMarketIntelligenceRepository) {}

  /**
   * Computes the market benchmark and variance analysis for a tenant ingredient.
   */
  public async getBenchmarkForIngredient(
    tenantId: string,
    tenantRef: TenantIngredientEconomicRef,
    referenceDate: Date = new Date()
  ): Promise<{
    benchmark: BenchmarkCalculation | null;
    variance: VarianceAnalysis | null;
    hasObservations: boolean;
  }> {
    const inputs = await this.repository.getBenchmarkInputsForIngredient(
      tenantId,
      tenantRef.id
    );

    if (inputs.length === 0) {
      return {
        benchmark: null,
        variance: null,
        hasObservations: false,
      };
    }

    try {
      const benchmark = BenchmarkCalculator.calculateBenchmark(
        { id: tenantRef.id, name: tenantRef.name },
        inputs,
        referenceDate
      );

      const variance = BenchmarkCalculator.analyzeVariance(tenantRef, benchmark);

      return {
        benchmark,
        variance,
        hasObservations: true,
      };
    } catch {
      return {
        benchmark: null,
        variance: null,
        hasObservations: false,
      };
    }
  }

  /**
   * Generates a formal negotiation brief for an ingredient.
   */
  public async generateNegotiationBrief(
    tenant: { id: string; name: string },
    tenantRef: TenantIngredientEconomicRef,
    referenceDate: Date = new Date()
  ): Promise<NegotiationBrief | null> {
    const { benchmark, variance, hasObservations } = await this.getBenchmarkForIngredient(
      tenant.id,
      tenantRef,
      referenceDate
    );

    if (!hasObservations || !benchmark || !variance) {
      return null;
    }

    return BenchmarkCalculator.generateNegotiationBrief(
      tenant,
      tenantRef,
      benchmark,
      variance,
      referenceDate
    );
  }

  /**
   * Compares and ranks observable market offers for a single tenant ingredient (Bloque 3).
   */
  public async rankOffersForIngredient(
    tenantId: string,
    tenantRef: TenantIngredientEconomicRef,
    context: ComparisonContext = {}
  ): Promise<MarketOfferRanking> {
    const inputsMap = await this.repository.getComparisonInputsForIngredients(tenantId, [
      tenantRef.id,
    ]);
    const inputs = inputsMap.get(tenantRef.id) || [];
    const tenantConfig = await this.repository.getTenantConfig(tenantId);

    return OfferComparator.compareOffers(
      {
        id: tenantRef.id,
        name: tenantRef.name,
        effectiveWacExTax: tenantRef.effectiveWacExTax,
        unit: tenantRef.unit,
      },
      inputs,
      context,
      tenantConfig
    );
  }

  /**
   * Batch-compares and ranks observable market offers for multiple tenant ingredients (Bloque 3).
   */
  public async rankOffersForIngredients(
    tenantId: string,
    tenantRefs: TenantIngredientEconomicRef[],
    context: ComparisonContext = {}
  ): Promise<Map<string, MarketOfferRanking>> {
    const ingredientIds = tenantRefs.map((r) => r.id);
    const inputsMap = await this.repository.getComparisonInputsForIngredients(
      tenantId,
      ingredientIds
    );
    const tenantConfig = await this.repository.getTenantConfig(tenantId);

    const resultMap = new Map<string, MarketOfferRanking>();
    for (const ref of tenantRefs) {
      const inputs = inputsMap.get(ref.id) || [];
      const ranking = OfferComparator.compareOffers(
        {
          id: ref.id,
          name: ref.name,
          effectiveWacExTax: ref.effectiveWacExTax,
          unit: ref.unit,
        },
        inputs,
        context,
        tenantConfig
      );
      resultMap.set(ref.id, ranking);
    }

    return resultMap;
  }
}
