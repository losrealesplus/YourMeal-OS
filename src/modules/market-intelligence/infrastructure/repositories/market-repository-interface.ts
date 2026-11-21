import {
  MarketDeliveryCoverage,
  MarketEstablishment,
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  MarketTenantConfig,
  ProductMapping,
} from '../../domain/types';
import { BenchmarkInputObservation } from '../../domain/benchmark-calculator';

export interface IMarketIntelligenceRepository {
  getSources(): Promise<MarketSource[]>;
  getSourceById(id: string): Promise<MarketSource | null>;
  getSourceByName(name: string): Promise<MarketSource | null>;
  saveSource(source: MarketSource): Promise<void>;

  getEstablishmentsBySource(
    sourceId: string,
    tenantId?: string | null
  ): Promise<MarketEstablishment[]>;
  saveEstablishment(establishment: MarketEstablishment): Promise<void>;

  getCoveragesBySource(
    sourceId: string,
    tenantId?: string | null
  ): Promise<MarketDeliveryCoverage[]>;
  saveCoverage(coverage: MarketDeliveryCoverage): Promise<void>;

  getProductById(id: string): Promise<MarketProduct | null>;
  getProductsBySource(sourceId: string, tenantId?: string | null): Promise<MarketProduct[]>;
  findProductBySku(
    sourceId: string,
    sku: string,
    tenantId?: string | null
  ): Promise<MarketProduct | null>;
  findProductByName(
    sourceId: string,
    rawName: string,
    tenantId?: string | null
  ): Promise<MarketProduct | null>;
  saveProduct(product: MarketProduct): Promise<void>;

  getObservationById(id: string): Promise<MarketPriceObservation | null>;
  getObservationsByProduct(
    productId: string,
    tenantId?: string | null
  ): Promise<MarketPriceObservation[]>;
  findObservationByFingerprint(fingerprint: string): Promise<MarketPriceObservation | null>;
  saveObservation(observation: MarketPriceObservation, fingerprint: string): Promise<void>;
  updateObservationValidity(
    observationId: string,
    validTo: string,
    rawPayload?: Record<string, unknown>
  ): Promise<void>;

  getMappingsByTenant(tenantId: string): Promise<ProductMapping[]>;
  getMappingsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<ProductMapping[]>;
  getMappingForProduct(
    tenantId: string,
    tenantIngredientId: string,
    marketProductId: string
  ): Promise<ProductMapping | null>;
  getMapping(tenantId: string, tenantIngredientId: string): Promise<ProductMapping | null>;
  saveMapping(mapping: ProductMapping): Promise<void>;

  getBenchmarkInputsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<BenchmarkInputObservation[]>;

  getTenantConfig(tenantId: string): Promise<MarketTenantConfig | null>;
  saveTenantConfig(config: MarketTenantConfig): Promise<void>;
}
