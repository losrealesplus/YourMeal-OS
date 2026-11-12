/**
 * YOURMEAL-OS — SUPABASE MARKET INTELLIGENCE REPOSITORY (CR-COST-05)
 * PostgreSQL / Supabase persistence implementation for Shared Core Market Data
 * and Tenant-Scoped Product Mappings.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import {
  AiemStatus,
  AvailabilityStatus,
  CaptureMethod,
  ChannelKind,
  ComparabilityGrade,
  ContentUnit,
  CoverageStatus,
  DeliveryCoverageState,
  FreightInclusion,
  FulfillmentMode,
  MarketDeliveryCoverage,
  MarketEstablishment,
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  MarketVolumeTier,
  MatchStatus,
  MeasurementDimension,
  MinOrderUnit,
  NormalizationBasis,
  NormalizationStatus,
  NormalizedUnit,
  ObservedChannel,
  ObservedPriceBasis,
  PackPresentation,
  ProductMapping,
  PromotionStatus,
  QualityStatus,
  RegionCode,
  SourceChannelType,
  SourceType,
  StandardUnit,
  TaxMode,
  TaxRateSource,
  TaxRegime,
  ThermalState,
  ValiditySource,
} from '../../domain/types';
import { BenchmarkInputObservation } from '../../domain/benchmark-calculator';
import { sanitizeRawPayloadForScope } from '../../application/market-catalog-ingestion-service';
import { generateMarketEntityUuid, isValidUuid } from '../../domain/uuid';
import { IMarketIntelligenceRepository } from './market-repository-interface';

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  return parseNullableNumber(value);
}

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
      provider_code: source.providerCode ?? null,
      country_code: source.countryCode ?? null,
      channel_type: source.channelType ?? null,
      default_tax_mode: source.defaultTaxMode,
      default_region: source.defaultRegion,
      is_active: source.isActive,
      notes: source.notes,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Establishments & Delivery Coverages
  // --------------------------------------------------------------------------

  public async getEstablishmentsBySource(sourceId: string): Promise<MarketEstablishment[]> {
    const { data, error } = await this.supabase
      .from('market_establishments')
      .select('*')
      .eq('source_id', sourceId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []).map(this.mapEstablishmentFromDb);
  }

  public async saveEstablishment(establishment: MarketEstablishment): Promise<void> {
    const estId = isValidUuid(establishment.id)
      ? establishment.id
      : generateMarketEntityUuid();
    const { error } = await this.supabase.from('market_establishments').insert({
      id: estId,
      source_id: establishment.sourceId,
      owner_tenant_id: establishment.ownerTenantId ?? null,
      establishment_code: establishment.establishmentCode,
      name: establishment.name,
      channel_kind: establishment.channelKind || 'unknown',
      country_code: establishment.countryCode ?? null,
      region_code: establishment.regionCode ?? null,
      subdivision_code: establishment.subdivisionCode ?? null,
      province_code: establishment.provinceCode ?? null,
      island_code: establishment.islandCode ?? null,
      postal_code: establishment.postalCode ?? null,
      city: establishment.city ?? null,
      is_active: establishment.isActive,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  public async getCoveragesBySource(sourceId: string): Promise<MarketDeliveryCoverage[]> {
    const { data, error } = await this.supabase
      .from('market_delivery_coverages')
      .select('*')
      .eq('source_id', sourceId)
      .order('country_code');

    if (error) throw error;
    return (data || []).map(this.mapCoverageFromDb);
  }

  public async saveCoverage(coverage: MarketDeliveryCoverage): Promise<void> {
    const covId = isValidUuid(coverage.id) ? coverage.id : generateMarketEntityUuid();
    const { error } = await this.supabase.from('market_delivery_coverages').insert({
      id: covId,
      source_id: coverage.sourceId,
      establishment_id: coverage.establishmentId ?? null,
      owner_tenant_id: coverage.ownerTenantId ?? null,
      fulfillment_mode: coverage.fulfillmentMode,
      coverage_status: coverage.coverageStatus,
      country_code: coverage.countryCode,
      region_code: coverage.regionCode ?? null,
      subdivision_code: coverage.subdivisionCode ?? null,
      province_code: coverage.provinceCode ?? null,
      island_code: coverage.islandCode ?? null,
      postal_code_prefix: coverage.postalCodePrefix ?? null,
      valid_from: coverage.validFrom ?? null,
      valid_to: coverage.validTo ?? null,
      evidence_note: coverage.evidenceNote ?? null,
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
    const productId = isValidUuid(product.id) ? product.id : generateMarketEntityUuid();
    const { error } = await this.supabase.from('market_products').insert({
      id: productId,
      source_id: product.sourceId,
      external_sku: product.externalSku || `SKU-${productId.slice(0, 8)}`,
      gtin: product.gtin ?? null,
      raw_name: product.rawName,
      brand: product.brand,
      category: product.category || 'General Food',
      thermal_state: product.thermalState || 'ambient',
      measurement_dimension: product.measurementDimension ?? null,
      standard_quantity: product.standardQuantity || 1.0,
      standard_unit: product.standardUnit || 'kg',
      pack_presentation: product.packPresentation ?? null,
      pack_count: product.packCount ?? null,
      unit_content_qty: product.unitContentQty ?? null,
      unit_content_unit: product.unitContentUnit ?? null,
      net_content_qty: product.netContentQty ?? null,
      net_content_unit: product.netContentUnit ?? null,
      drained_weight_qty: product.drainedWeightQty ?? null,
      drained_weight_unit: product.drainedWeightUnit ?? null,
      density_kg_per_l: product.densityKgPerL ?? null,
      cut_specification: product.cutSpecification,
      quality_grade: product.qualityGrade || 'standard',
      origin: product.origin ?? null,
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
    const observationId = isValidUuid(observation.id)
      ? observation.id
      : generateMarketEntityUuid();
    const ownerTenantId = observation.ownerTenantId ?? null;
    const sanitizedPayload = sanitizeRawPayloadForScope(observation.rawPayload, ownerTenantId);

    const { error: obsErr } = await this.supabase.from('market_price_observations').insert({
      id: observationId,
      market_product_id: observation.marketProductId,
      owner_tenant_id: ownerTenantId,
      establishment_id: observation.establishmentId ?? null,
      fingerprint,
      observed_at: observation.observedAt,
      valid_from: observation.validFrom,
      valid_to: observation.validTo ?? null,
      validity_source: observation.validitySource ?? 'inferred_default',
      price_raw: observation.priceRaw,
      currency: observation.currency,
      tax_mode: observation.taxMode,
      tax_rate: observation.taxRate,
      tax_regime: observation.taxRegime ?? 'UNKNOWN',
      tax_rate_source: observation.taxRateSource ?? 'unknown',
      tax_rule_ref: observation.taxRuleRef ?? null,
      tax_effective_from: observation.taxEffectiveFrom ?? null,
      tax_effective_to: observation.taxEffectiveTo ?? null,
      aiem_status: observation.aiemStatus ?? 'unknown',
      aiem_evidence: observation.aiemEvidence ?? null,
      aiem_rate: observation.aiemRate ?? null,
      aiem_amount_raw: observation.aiemAmountRaw ?? null,
      normalized_price_ex_tax: observation.normalizedPriceExTax,
      normalized_unit: observation.normalizedUnit,
      observed_price_basis: observation.observedPriceBasis ?? 'unknown',
      normalization_basis: observation.normalizationBasis ?? 'unknown',
      normalization_status: observation.normalizationStatus ?? 'computed',
      promotion_status: observation.promotionStatus,
      promotion_condition: observation.promotionCondition ?? null,
      promotion_valid_to: observation.promotionValidTo ?? null,
      freight_inclusion: observation.freightInclusion ?? 'unknown',
      freight_cost_raw: observation.freightCostRaw ?? null,
      free_freight_min_order_amount: observation.freeFreightMinOrderAmount ?? null,
      min_order_qty: observation.minOrderQty ?? null,
      min_order_unit: observation.minOrderUnit ?? null,
      region_code: observation.regionCode,
      location_name: observation.locationName || 'Central Warehouse',
      observation_country_code: observation.observationCountryCode ?? null,
      observation_subdivision_code: observation.observationSubdivisionCode ?? null,
      observation_province_code: observation.observationProvinceCode ?? null,
      observation_island_code: observation.observationIslandCode ?? null,
      observation_postal_code: observation.observationPostalCode ?? null,
      observed_channel: observation.observedChannel ?? 'unknown',
      delivery_coverage_state: observation.deliveryCoverageState ?? 'unknown',
      availability_status: observation.availabilityStatus ?? 'unknown',
      capture_method: observation.captureMethod,
      quality_status: observation.qualityStatus,
      raw_payload: sanitizedPayload ?? null,
      imported_by:
        observation.importedBy && isValidUuid(observation.importedBy)
          ? observation.importedBy
          : null,
    });

    if (obsErr) throw obsErr;

    if (observation.volumeTiers && observation.volumeTiers.length > 0) {
      const tierRows = observation.volumeTiers.map((t) => ({
        id: isValidUuid(t.id) ? t.id : generateMarketEntityUuid(),
        observation_id: observationId,
        min_quantity: t.minQuantity,
        tier_normalized_price_ex_tax: t.tierNormalizedPriceExTax,
      }));

      const { error: tierErr } = await this.supabase
        .from('market_volume_tiers')
        .insert(tierRows);

      if (tierErr) throw tierErr;
    }
  }

  public async updateObservationValidity(
    observationId: string,
    validTo: string,
    rawPayload?: Record<string, unknown>
  ): Promise<void> {
    const patch: Record<string, unknown> = { valid_to: validTo };
    if (rawPayload !== undefined) {
      patch.raw_payload = rawPayload;
    }

    const { error } = await this.supabase
      .from('market_price_observations')
      .update(patch)
      .eq('id', observationId);

    if (error) throw error;
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

  public async getMappingsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<ProductMapping[]> {
    const { data, error } = await this.supabase
      .from('product_mappings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tenant_ingredient_id', tenantIngredientId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapMappingFromDb);
  }

  public async getMappingForProduct(
    tenantId: string,
    tenantIngredientId: string,
    marketProductId: string
  ): Promise<ProductMapping | null> {
    const { data, error } = await this.supabase
      .from('product_mappings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tenant_ingredient_id', tenantIngredientId)
      .eq('market_product_id', marketProductId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapMappingFromDb(data);
  }

  public async getMapping(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<ProductMapping | null> {
    const mappings = await this.getMappingsForIngredient(tenantId, tenantIngredientId);
    if (mappings.length === 0) return null;
    return mappings.find((m) => m.matchStatus === 'confirmed') || mappings[0];
  }

  public async saveMapping(mapping: ProductMapping): Promise<void> {
    const mappingId = isValidUuid(mapping.id) ? mapping.id : generateMarketEntityUuid();
    const { error } = await this.supabase.from('product_mappings').upsert(
      {
        id: mappingId,
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
    for (const list of obsByProduct.values()) {
      list.sort((a, b) => {
        const tsDiff = new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime();
        if (tsDiff !== 0) return tsDiff;
        const aOwned = a.ownerTenantId === tenantId ? 1 : 0;
        const bOwned = b.ownerTenantId === tenantId ? 1 : 0;
        return bOwned - aOwned;
      });
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
      providerCode: row.provider_code,
      countryCode: row.country_code,
      channelType: row.channel_type as SourceChannelType | null | undefined,
      defaultTaxMode: row.default_tax_mode as TaxMode,
      defaultRegion: row.default_region as RegionCode,
      isActive: Boolean(row.is_active),
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapEstablishmentFromDb(
    row: Database['public']['Tables']['market_establishments']['Row']
  ): MarketEstablishment {
    return {
      id: row.id,
      sourceId: row.source_id,
      ownerTenantId: row.owner_tenant_id ?? null,
      establishmentCode: row.establishment_code,
      name: row.name,
      channelKind: (row.channel_kind as ChannelKind) || 'unknown',
      countryCode: row.country_code ?? null,
      regionCode: (row.region_code as RegionCode) ?? null,
      subdivisionCode: row.subdivision_code ?? null,
      provinceCode: row.province_code ?? null,
      islandCode: row.island_code ?? null,
      postalCode: row.postal_code ?? null,
      city: row.city ?? null,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCoverageFromDb(
    row: Database['public']['Tables']['market_delivery_coverages']['Row']
  ): MarketDeliveryCoverage {
    return {
      id: row.id,
      sourceId: row.source_id,
      establishmentId: row.establishment_id ?? null,
      ownerTenantId: row.owner_tenant_id ?? null,
      fulfillmentMode: (row.fulfillment_mode as FulfillmentMode) || 'unknown',
      coverageStatus: (row.coverage_status as CoverageStatus) || 'unknown',
      countryCode: row.country_code,
      regionCode: (row.region_code as RegionCode) ?? null,
      subdivisionCode: row.subdivision_code ?? null,
      provinceCode: row.province_code ?? null,
      islandCode: row.island_code ?? null,
      postalCodePrefix: row.postal_code_prefix ?? null,
      validFrom: row.valid_from ?? null,
      validTo: row.valid_to ?? null,
      evidenceNote: row.evidence_note ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapProductFromDb(row: any): MarketProduct {
    return {
      id: row.id,
      sourceId: row.source_id,
      externalSku: row.external_sku || undefined,
      gtin: row.gtin,
      rawName: row.raw_name,
      brand: row.brand || undefined,
      category: row.category,
      thermalState: row.thermal_state as ThermalState,
      measurementDimension: row.measurement_dimension as
        | MeasurementDimension
        | null
        | undefined,
      standardQuantity: Number(row.standard_quantity || 1.0),
      standardUnit: row.standard_unit as StandardUnit,
      packPresentation: row.pack_presentation as PackPresentation | null | undefined,
      packCount: parseOptionalNumber(row.pack_count),
      unitContentQty: parseOptionalNumber(row.unit_content_qty),
      unitContentUnit: row.unit_content_unit as ContentUnit | null | undefined,
      netContentQty: parseOptionalNumber(row.net_content_qty),
      netContentUnit: row.net_content_unit as ContentUnit | null | undefined,
      drainedWeightQty: parseOptionalNumber(row.drained_weight_qty),
      drainedWeightUnit: row.drained_weight_unit as 'kg' | 'g' | null | undefined,
      densityKgPerL: parseOptionalNumber(row.density_kg_per_l),
      cutSpecification: row.cut_specification || undefined,
      qualityGrade: row.quality_grade || undefined,
      origin: row.origin || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapObservationFromDb(row: any, tiers: MarketVolumeTier[]): MarketPriceObservation {
    const taxMode = row.tax_mode as TaxMode;
    return {
      id: row.id,
      marketProductId: row.market_product_id,
      ownerTenantId: row.owner_tenant_id ?? null,
      observedAt: row.observed_at,
      validFrom: row.valid_from || undefined,
      validTo: row.valid_to ?? null,
      validitySource: row.validity_source as ValiditySource | undefined,
      priceRaw: Number(row.price_raw),
      currency: row.currency || 'EUR',
      taxMode,
      taxInclusion:
        taxMode === 'inc_tax' ? 'included' : taxMode === 'ex_tax' ? 'excluded' : 'unknown',
      taxRate: parseNullableNumber(row.tax_rate),
      taxRegime: row.tax_regime as TaxRegime | undefined,
      taxRateSource: row.tax_rate_source as TaxRateSource | undefined,
      taxRuleRef: row.tax_rule_ref,
      taxEffectiveFrom: row.tax_effective_from,
      taxEffectiveTo: row.tax_effective_to,
      aiemStatus: row.aiem_status as AiemStatus | undefined,
      aiemEvidence: row.aiem_evidence,
      aiemRate: parseOptionalNumber(row.aiem_rate),
      aiemAmountRaw: parseOptionalNumber(row.aiem_amount_raw),
      normalizedPriceExTax: parseNullableNumber(row.normalized_price_ex_tax),
      normalizedUnit: row.normalized_unit as NormalizedUnit,
      observedPriceBasis: row.observed_price_basis as ObservedPriceBasis | undefined,
      normalizationBasis: row.normalization_basis as NormalizationBasis | undefined,
      normalizationStatus: row.normalization_status as NormalizationStatus | undefined,
      promotionStatus: row.promotion_status as PromotionStatus,
      promotionCondition: row.promotion_condition,
      promotionValidTo: row.promotion_valid_to,
      freightInclusion: row.freight_inclusion as FreightInclusion | undefined,
      freightCostRaw: parseOptionalNumber(row.freight_cost_raw),
      freeFreightMinOrderAmount: parseOptionalNumber(row.free_freight_min_order_amount),
      minOrderQty: parseOptionalNumber(row.min_order_qty),
      minOrderUnit: row.min_order_unit as MinOrderUnit | null | undefined,
      regionCode: row.region_code as RegionCode,
      locationName: row.location_name || undefined,
      establishmentId: row.establishment_id,
      observationCountryCode: row.observation_country_code,
      observationSubdivisionCode: row.observation_subdivision_code,
      observationProvinceCode: row.observation_province_code,
      observationIslandCode: row.observation_island_code,
      observationPostalCode: row.observation_postal_code,
      observedChannel: row.observed_channel as ObservedChannel | undefined,
      deliveryCoverageState: row.delivery_coverage_state as DeliveryCoverageState | undefined,
      availabilityStatus: row.availability_status as AvailabilityStatus | undefined,
      captureMethod: row.capture_method as CaptureMethod,
      qualityStatus: row.quality_status as QualityStatus,
      rawPayload: row.raw_payload || undefined,
      importedBy: row.imported_by || undefined,
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
