/**
 * YOURMEAL-OS · useMarketIntelligence Hook (CR-COST-05)
 * Connects UI to SupabaseMarketRepository, MarketBenchmarkService,
 * MarketCatalogIngestionService, and ProductMappingService.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseMarketRepository } from '../../infrastructure/repositories/supabase-market-repository';
import { MarketBenchmarkService } from '../../application/market-benchmark-service';
import { MarketCatalogIngestionService } from '../../application/market-catalog-ingestion-service';
import { ProductMappingService } from '../../application/product-mapping-service';
import {
  MarketSource,
  MarketProduct,
  ProductMapping,
  BenchmarkCalculation,
  NegotiationBrief,
  StandardUnit,
  TenantIngredientEconomicRef,
} from '../../domain/types';

export interface MarketIngredientMetadataRef {
  id: string;
  name?: string;
  unit?: string;
  cost?: number;
  category?: string;
}

export interface IngredientBenchmarkItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  category?: string;
  currentWacExTax: number;
  benchmarkExTax: number | null;
  variancePct: number | null;
  spreadPct: number | null;
  highComparabilityCount: number;
  observationsCount: number;
  isMapped: boolean;
  mapping: ProductMapping | null;
  calculation: BenchmarkCalculation | null;
}

function normalizeUnit(raw?: string): StandardUnit {
  if (raw === 'l' || raw === 'unit') return raw;
  return 'kg';
}

export function useMarketIntelligence(
  tenantId: string | null | undefined,
  ingredientRefs?: MarketIngredientMetadataRef[]
) {
  const [sources, setSources] = useState<MarketSource[]>([]);
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([]);
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [benchmarksByIngredient, setBenchmarksByIngredient] = useState<
    Map<string, BenchmarkCalculation>
  >(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ingredientRefsRef = useRef(ingredientRefs);
  ingredientRefsRef.current = ingredientRefs;

  const repository = useMemo(() => new SupabaseMarketRepository(supabase), []);
  const benchmarkService = useMemo(() => new MarketBenchmarkService(repository), [repository]);
  const ingestionService = useMemo(
    () => new MarketCatalogIngestionService(repository),
    [repository]
  );
  const mappingService = useMemo(() => new ProductMappingService(repository), [repository]);

  const loadData = useCallback(async () => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch sources
      const fetchedSources = await repository.getSources();
      setSources(fetchedSources);

      // 2. Fetch all active market products across sources
      const allProducts: MarketProduct[] = [];
      for (const src of fetchedSources) {
        const prods = await repository.getProductsBySource(src.id);
        allProducts.push(...prods);
      }
      setMarketProducts(allProducts);

      // 3. Fetch tenant mappings (supports 1:N mappings per ingredient)
      const tenantMappings = await repository.getMappingsByTenant(tenantId);
      setMappings(tenantMappings);

      // 4. Calculate benchmarks once per mapped ingredient
      const confirmedMappings = tenantMappings.filter((m) => m.matchStatus === 'confirmed');
      const uniqueIngredientIds = Array.from(
        new Set(confirmedMappings.map((m) => m.tenantIngredientId))
      );
      const refsById = new Map((ingredientRefsRef.current || []).map((r) => [r.id, r]));
      const benchmarkMap = new Map<string, BenchmarkCalculation>();

      for (const ingredientId of uniqueIngredientIds) {
        const refMeta = refsById.get(ingredientId);
        const tenantRef: TenantIngredientEconomicRef = {
          id: ingredientId,
          tenantId,
          name: refMeta?.name || ingredientId,
          category: refMeta?.category || 'General',
          unit: normalizeUnit(refMeta?.unit),
          effectiveWacExTax: refMeta?.cost ?? 0,
        };

        const result = await benchmarkService.getBenchmarkForIngredient(tenantId, tenantRef);
        if (result.benchmark) {
          benchmarkMap.set(ingredientId, result.benchmark);
        }
      }

      setBenchmarksByIngredient(benchmarkMap);
    } catch (err: any) {
      console.error('Failed to load market intelligence data:', err);
      setError(err.message || 'Error cargando datos de mercado.');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, repository, benchmarkService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateNegotiationBrief = useCallback(
    async (
      tenantName: string,
      ingredientRef: TenantIngredientEconomicRef,
      referenceDate: Date = new Date()
    ): Promise<NegotiationBrief | null> => {
      if (!tenantId) return null;
      return benchmarkService.generateNegotiationBrief(
        { id: tenantId, name: tenantName },
        ingredientRef,
        referenceDate
      );
    },
    [tenantId, benchmarkService]
  );

  return {
    sources,
    marketProducts,
    mappings,
    benchmarksByIngredient,
    isLoading,
    error,
    refetch: loadData,
    repository,
    benchmarkService,
    ingestionService,
    mappingService,
    generateNegotiationBrief,
  };
}
