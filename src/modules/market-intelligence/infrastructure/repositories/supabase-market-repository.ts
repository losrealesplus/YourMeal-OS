/**
 * YOURMEAL-OS — SUPABASE MARKET INTELLIGENCE REPOSITORY (CR-COST-05)
 * PostgreSQL / Supabase persistence implementation for Shared Core Market Data
 * and Tenant-Scoped Product Mappings.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  MarketVolumeTier,
  ProductMapping,
  SourceType,
  TaxMode,
  RegionCode,
  ThermalState,
  StandardUnit,
  NormalizedUnit,
  PromotionStatus,
  CaptureMethod,
  QualityStatus,
  MatchStatus,
  ComparabilityGrade,
} from '../../domain/types';
import { BenchmarkInputObservation } from '../../domain/benchmark-calculator';
import { IMarketIntelligenceRepository } from './market-repository-interface';

export class SupabaseMarketRepository implements IMarketIntelligenceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  // --------------------------------------------------------------------------
  // Sources
  // --------------------------------------------------------------------------

  public async getSources(): Promise<MarketSource[]> {
    const { data, error } = await this.supabase
      .from('market_sources')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapSourceFromDb);
  }

  public async getSourceById(id: string): Promise<MarketSource | null> {
    const { data, error } = await this.supabase
      .from('market_sources')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapSourceFromDb(data);
  }

  public async getSourceByName(name: string): Promise<MarketSource | null> {
    const clean = name.trim();
    const { data, error } = await this.supabase
      .from('market_sources')
      .select('*')
      .ilike('name', `%${clean}%`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapSourceFromDb(data);
  }

  public async saveSource(source: MarketSource): Promise<void> {
    const { error } = await this.supabase.from('market_sources').upsert({
      id: source.id,
      name: source.name,
      source_type: source.sourceType,
      default_tax_mode: source.defaultTaxMode,
      default_region: source.defaultRegion,
      is_active: source.isActive,
      notes: source.notes,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Products
  // --------------------------------------------------------------------------

  public async getProductById(id: string): Promise<MarketProduct | null> {
    const { data, error } = await this.supabase
      .from('market_products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapProductFromDb(data);
  }

  public async getProductsBySource(sourceId: string): Promise<MarketProduct[]> {
    const { data, error } = await this.supabase
      .from('market_products')
      .select('*')
      .eq('source_id', sourceId)
      .order('raw_name');

    if (error) throw error;
    return (data || []).map(this.mapProductFromDb);
  }

  public async findProductBySku(sourceId: string, sku: string): Promise<MarketProduct | null> {
    const { data, error } = await this.supabase
      .from('market_products')
      .select('*')
      .eq('source_id', sourceId)
      .eq('external_sku', sku)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapProductFromDb(data);
  }

  public async findProductByName(sourceId: string, rawName: string): Promise<MarketProduct | null> {
    const { data, error } = await this.supabase
      .from('market_products')
      .select('*')
      .eq('source_id', sourceId)
      .ilike('raw_name', rawName.trim())
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapProductFromDb(data);
  }

  public async saveProduct(product: MarketProduct): Promise<void> {
    const { error } = await this.supabase.from('market_products').upsert({
      id: product.id,
      source_id: product.sourceId,
      external_sku: product.externalSku || `SKU-${product.id.slice(0, 8)}`,
      raw_name: product.rawName,
      brand: product.brand,
      category: product.category || 'General Food',
      thermal_state: product.thermalState || 'ambient',
      standard_quantity: product.standardQuantity || 1.0,
      standard_unit: product.standardUnit || 'kg',
      cut_specification: product.cutSpecification,
      quality_grade: product.qualityGrade || 'standard',
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Observations & Tiers
  // --------------------------------------------------------------------------

  public async getObservationById(id: string): Promise<MarketPriceObservation | null> {
    const { data: obsData, error: obsErr } = await this.supabase
      .from('market_price_observations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (obsErr) throw obsErr;
    if (!obsData) return null;

    const { data: tierData, error: tierErr } = await this.supabase
      .from('market_volume_tiers')
      .select('*')
      .eq('observation_id', id);

    if (tierErr) throw tierErr;

    const tiers = (tierData || []).map(this.mapTierFromDb);
    return this.mapObservationFromDb(obsData, tiers);
  }

  public async getObservationsByProduct(productId: string): Promise<MarketPriceObservation[]> {
    const { data: obsData, error: obsErr } = await this.supabase
      .from('market_price_observations')
      .select('*')
      .eq('market_product_id', productId)
      .order('observed_at', { ascending: false });

    if (obsErr) throw obsErr;
    if (!obsData || obsData.length === 0) return [];

    const obsIds = obsData.map((o) => o.id);
    const { data: tierData } = await this.supabase
      .from('market_volume_tiers')
      .select('*')
      .in('observation_id', obsIds);

    const tiersByObs = new Map<string, MarketVolumeTier[]>();
    for (const t of tierData || []) {
      const mapped = this.mapTierFromDb(t);
      const list = tiersByObs.get(t.observation_id) || [];
      list.push(mapped);
      tiersByObs.set(t.observation_id, list);
    }

    return obsData.map((o) => this.mapObservationFromDb(o, tiersByObs.get(o.id) || []));
  }

  public async findObservationByFingerprint(
    fingerprint: string
  ): Promise<MarketPriceObservation | null> {
    const { data, error } = await this.supabase
      .from('market_price_observations')
      .select('*')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: tierData } = await this.supabase
      .from('market_volume_tiers')
      .select('*')
      .eq('observation_id', data.id);

    const tiers = (tierData || []).map(this.mapTierFromDb);
    return this.mapObservationFromDb(data, tiers);
  }

  public async saveObservation(
    observation: MarketPriceObservation,
    fingerprint: string
  ): Promise<void> {
    const { error: obsErr } = await this.supabase.from('market_price_observations').insert({
      id: observation.id,
      market_product_id: observation.marketProductId,
      fingerprint,
      observed_at: observation.observedAt,
      valid_from: observation.validFrom,
      valid_to: observation.validTo,
      price_raw: observation.priceRaw,
      currency: observation.currency,
      tax_mode: observation.taxMode,
      tax_rate: observation.taxRate,
      normalized_price_ex_tax: observation.normalizedPriceExTax,
      normalized_unit: observation.normalizedUnit,
      promotion_status: observation.promotionStatus,
      region_code: observation.regionCode,
      location_name: observation.locationName || 'Central Warehouse',
      capture_method: observation.captureMethod,
      quality_status: observation.qualityStatus,
    });

    if (obsErr) throw obsErr;

    if (observation.volumeTiers && observation.volumeTiers.length > 0) {
      const tierRows = observation.volumeTiers.map((t) => ({
        id: t.id,
        observation_id: observation.id,
        min_quantity: t.minQuantity,
        tier_normalized_price_ex_tax: t.tierNormalizedPriceExTax,
      }));

      const { error: tierErr } = await this.supabase
        .from('market_volume_tiers')
        .insert(tierRows);

      if (tierErr) throw tierErr;
    }
  }

  // --------------------------------------------------------------------------
  // Product Mappings
  // --------------------------------------------------------------------------

  public async getMappingsByTenant(tenantId: string): Promise<ProductMapping[]> {
    const { data, error } = await this.supabase
      .from('product_mappings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapMappingFromDb);
  }

  public async getMapping(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<ProductMapping | null> {
    const { data, error } = await this.supabase
      .from('product_mappings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tenant_ingredient_id', tenantIngredientId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapMappingFromDb(data);
  }

  public async saveMapping(mapping: ProductMapping): Promise<void> {
    const { error } = await this.supabase.from('product_mappings').upsert(
      {
        id: mapping.id,
        tenant_id: mapping.tenantId,
        tenant_ingredient_id: mapping.tenantIngredientId,
        market_product_id: mapping.marketProductId,
        match_confidence: mapping.matchConfidence,
        match_status: mapping.matchStatus,
        comparability_grade: mapping.comparabilityGrade,
        verified_by: mapping.verifiedBy,
        verified_at: mapping.verifiedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,tenant_ingredient_id,market_product_id' }
    );

    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Benchmark Inputs for Calculator
  // --------------------------------------------------------------------------

  public async getBenchmarkInputsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<BenchmarkInputObservation[]> {
    const { data: mappingsData, error: mapErr } = await this.supabase
      .from('product_mappings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tenant_ingredient_id', tenantIngredientId)
      .eq('match_status', 'confirmed')
      .neq('comparability_grade', 'UNKNOWN');

    if (mapErr) throw mapErr;
    if (!mappingsData || mappingsData.length === 0) return [];

    const productIds = mappingsData.map((m) => m.market_product_id);
    const { data: productsData, error: prodErr } = await this.supabase
      .from('market_products')
      .select('*')
      .in('id', productIds);

    if (prodErr) throw prodErr;
    if (!productsData || productsData.length === 0) return [];

    const sourceIds = Array.from(new Set(productsData.map((p) => p.source_id)));
    const { data: sourcesData, error: srcErr } = await this.supabase
      .from('market_sources')
      .select('*')
      .in('id', sourceIds)
      .eq('is_active', true);

    if (srcErr) throw srcErr;
    const sourcesMap = new Map((sourcesData || []).map((s) => [s.id, this.mapSourceFromDb(s)]));
    const productsMap = new Map(productsData.map((p) => [p.id, this.mapProductFromDb(p)]));

    const { data: obsData, error: obsErr } = await this.supabase
      .from('market_price_observations')
      .select('*')
      .in('market_product_id', productIds)
      .order('observed_at', { ascending: false });

    if (obsErr) throw obsErr;

    const obsByProduct = new Map<string, MarketPriceObservation[]>();
    for (const o of obsData || []) {
      const mappedObs = this.mapObservationFromDb(o, []);
      const list = obsByProduct.get(o.market_product_id) || [];
      list.push(mappedObs);
      obsByProduct.set(o.market_product_id, list);
    }

    const results: BenchmarkInputObservation[] = [];

    for (const rawMap of mappingsData) {
      const mapping = this.mapMappingFromDb(rawMap);
      const product = productsMap.get(mapping.marketProductId);
      if (!product) continue;

      const source = sourcesMap.get(product.sourceId);
      if (!source) continue;

      const productObs = obsByProduct.get(product.id) || [];
      if (productObs.length > 0) {
        results.push({
          source,
          product,
          observation: productObs[0],
          mapping,
        });
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Internal Row Mappers
  // --------------------------------------------------------------------------

  private mapSourceFromDb(row: any): MarketSource {
    return {
      id: row.id,
      name: row.name,
      sourceType: row.source_type as SourceType,
      defaultTaxMode: row.default_tax_mode as TaxMode,
      defaultRegion: row.default_region as RegionCode,
      isActive: Boolean(row.is_active),
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapProductFromDb(row: any): MarketProduct {
    return {
      id: row.id,
      sourceId: row.source_id,
      externalSku: row.external_sku || undefined,
      rawName: row.raw_name,
      brand: row.brand || undefined,
      category: row.category,
      thermalState: row.thermal_state as ThermalState,
      standardQuantity: Number(row.standard_quantity || 1.0),
      standardUnit: row.standard_unit as StandardUnit,
      cutSpecification: row.cut_specification || undefined,
      qualityGrade: row.quality_grade || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapObservationFromDb(row: any, tiers: MarketVolumeTier[]): MarketPriceObservation {
    return {
      id: row.id,
      marketProductId: row.market_product_id,
      observedAt: row.observed_at,
      validFrom: row.valid_from || undefined,
      validTo: row.valid_to || undefined,
      priceRaw: Number(row.price_raw),
      currency: 'EUR',
      taxMode: row.tax_mode as TaxMode,
      taxRate: Number(row.tax_rate || 0),
      normalizedPriceExTax: Number(row.normalized_price_ex_tax),
      normalizedUnit: row.normalized_unit as NormalizedUnit,
      promotionStatus: row.promotion_status as PromotionStatus,
      regionCode: row.region_code as RegionCode,
      locationName: row.location_name || undefined,
      captureMethod: row.capture_method as CaptureMethod,
      qualityStatus: row.quality_status as QualityStatus,
      volumeTiers: tiers.length > 0 ? tiers : undefined,
      createdAt: row.created_at,
    };
  }

  private mapTierFromDb(row: any): MarketVolumeTier {
    return {
      id: row.id,
      observationId: row.observation_id,
      minQuantity: Number(row.min_quantity),
      tierNormalizedPriceExTax: Number(row.tier_normalized_price_ex_tax),
    };
  }

  private mapMappingFromDb(row: any): ProductMapping {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      tenantIngredientId: row.tenant_ingredient_id,
      marketProductId: row.market_product_id,
      matchConfidence: Number(row.match_confidence || 0),
      matchStatus: row.match_status as MatchStatus,
      comparabilityGrade: row.comparability_grade as ComparabilityGrade,
      verifiedAt: row.verified_at || undefined,
      verifiedBy: row.verified_by || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
