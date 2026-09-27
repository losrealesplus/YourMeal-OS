/**
 * CR-COST-05: Product Mapping Service
 * Handles multi-factor candidate matching, 4-tier categorization, and human operator confirmation.
 */

import { ProductMatcher } from '../domain/product-matcher';
import {
  ComparabilityGrade,
  MarketProduct,
  MatchConfidenceResult,
  ProductMapping,
  TenantIngredientEconomicRef,
} from '../domain/types';
import { IMarketIntelligenceRepository } from '../infrastructure/repositories/market-repository-interface';

export interface MappingSuggestion {
  marketProduct: MarketProduct;
  sourceName: string;
  matchResult: MatchConfidenceResult;
  latestNormalizedPriceExTax?: number;
  latestPriceUnit?: string;
  isConfirmed: boolean;
}

export interface IngredientMappingOverview {
  tenantIngredientId: string;
  tenantIngredientName: string;
  highMatchSuggestions: MappingSuggestion[];
  mediumMatchReviewNeeded: MappingSuggestion[];
  lowMatchAlternatives: MappingSuggestion[];
  confirmedMapping: MappingSuggestion | null;
}

export class ProductMappingService {
  constructor(private readonly repository: IMarketIntelligenceRepository) {}

  /**
   * Generates 4-tier candidate suggestions for a tenant ingredient.
   */
  public async getSuggestionsForIngredient(
    tenantId: string,
    ingredient: TenantIngredientEconomicRef
  ): Promise<IngredientMappingOverview> {
    const sources = await this.repository.getSources();
    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    const existingMapping = await this.repository.getMapping(tenantId, ingredient.id);

    const allProducts: MarketProduct[] = [];
    for (const s of sources) {
      const prods = await this.repository.getProductsBySource(s.id);
      allProducts.push(...prods);
    }

    const highMatchSuggestions: MappingSuggestion[] = [];
    const mediumMatchReviewNeeded: MappingSuggestion[] = [];
    const lowMatchAlternatives: MappingSuggestion[] = [];
    let confirmedMapping: MappingSuggestion | null = null;

    for (const product of allProducts) {
      const matchResult = ProductMatcher.evaluateMatch(
        {
          tenantIngredientName: ingredient.name,
          tenantThermalState: ingredient.thermalState,
          tenantUnit: ingredient.unit,
        },
        product
      );

      const observations = await this.repository.getObservationsByProduct(product.id);
      const latestObs =
        observations.length > 0
          ? observations.sort(
              (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
            )[0]
          : undefined;

      const isThisConfirmed =
        existingMapping !== null &&
        existingMapping.marketProductId === product.id &&
        existingMapping.matchStatus === 'confirmed';

      const suggestion: MappingSuggestion = {
        marketProduct: product,
        sourceName: sourceMap.get(product.sourceId) || product.sourceId,
        matchResult,
        latestNormalizedPriceExTax: latestObs?.normalizedPriceExTax,
        latestPriceUnit: latestObs?.normalizedUnit,
        isConfirmed: isThisConfirmed,
      };

      if (isThisConfirmed) {
        confirmedMapping = suggestion;
      }

      // Categorize according to 4-tier policy
      if (matchResult.classification === 'HIGH_MATCH') {
        highMatchSuggestions.push(suggestion);
      } else if (matchResult.classification === 'MEDIUM_MATCH') {
        mediumMatchReviewNeeded.push(suggestion);
      } else if (matchResult.classification === 'LOW_MATCH') {
        lowMatchAlternatives.push(suggestion);
      }
      // < 50% UNMATCHED is discarded from suggestions
    }

    // Sort descending by confidence score
    highMatchSuggestions.sort((a, b) => b.matchResult.confidenceScore - a.matchResult.confidenceScore);
    mediumMatchReviewNeeded.sort((a, b) => b.matchResult.confidenceScore - a.matchResult.confidenceScore);
    lowMatchAlternatives.sort((a, b) => b.matchResult.confidenceScore - a.matchResult.confidenceScore);

    return {
      tenantIngredientId: ingredient.id,
      tenantIngredientName: ingredient.name,
      highMatchSuggestions,
      mediumMatchReviewNeeded,
      lowMatchAlternatives,
      confirmedMapping,
    };
  }

  /**
   * Confirms a mapping between a tenant ingredient and an observable market product.
   */
  public async confirmMapping(
    tenantId: string,
    tenantIngredientId: string,
    marketProductId: string,
    options?: {
      overrideComparability?: ComparabilityGrade;
      verifiedBy?: string;
    }
  ): Promise<ProductMapping> {
    const product = await this.repository.getProductById(marketProductId);
    if (!product) {
      throw new Error(`Market product not found: ${marketProductId}`);
    }

    const nowIso = new Date().toISOString();
    const existing = await this.repository.getMapping(tenantId, tenantIngredientId);

    const mapping: ProductMapping = {
      id: existing ? existing.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000000'),
      tenantId,
      tenantIngredientId,
      marketProductId,
      matchConfidence: 1.0, // Confirmed by human
      matchStatus: 'confirmed',
      comparabilityGrade: options?.overrideComparability || 'HIGH',
      verifiedAt: nowIso,
      verifiedBy: options?.verifiedBy || 'Human Operator',
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
    };

    await this.repository.saveMapping(mapping);
    return mapping;
  }

  /**
   * Rejects a mapping suggestion.
   */
  public async rejectMapping(
    tenantId: string,
    tenantIngredientId: string,
    marketProductId: string
  ): Promise<void> {
    const existing = await this.repository.getMapping(tenantId, tenantIngredientId);
    if (existing && existing.marketProductId === marketProductId) {
      await this.repository.saveMapping({
        ...existing,
        matchStatus: 'rejected',
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
