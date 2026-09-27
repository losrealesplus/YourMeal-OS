/**
 * CR-COST-05: Market Benchmark Application Service
 * Orchestrates benchmark retrieval, variance analysis against tenant WAC,
 * and negotiation brief generation.
 */

import { BenchmarkCalculator } from '../domain/benchmark-calculator';
import {
  BenchmarkCalculation,
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
}
