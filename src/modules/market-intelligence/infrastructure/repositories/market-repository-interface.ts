import {
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  ProductMapping,
} from '../../domain/types';
import { BenchmarkInputObservation } from '../../domain/benchmark-calculator';

export interface IMarketIntelligenceRepository {
  getSources(): Promise<MarketSource[]>;
  getSourceById(id: string): Promise<MarketSource | null>;
  getSourceByName(name: string): Promise<MarketSource | null>;
  saveSource(source: MarketSource): Promise<void>;

  getProductById(id: string): Promise<MarketProduct | null>;
  getProductsBySource(sourceId: string): Promise<MarketProduct[]>;
  findProductBySku(sourceId: string, sku: string): Promise<MarketProduct | null>;
  findProductByName(sourceId: string, rawName: string): Promise<MarketProduct | null>;
  saveProduct(product: MarketProduct): Promise<void>;

  getObservationById(id: string): Promise<MarketPriceObservation | null>;
  getObservationsByProduct(productId: string): Promise<MarketPriceObservation[]>;
  findObservationByFingerprint(fingerprint: string): Promise<MarketPriceObservation | null>;
  saveObservation(observation: MarketPriceObservation, fingerprint: string): Promise<void>;

  getMappingsByTenant(tenantId: string): Promise<ProductMapping[]>;
  getMapping(tenantId: string, tenantIngredientId: string): Promise<ProductMapping | null>;
  saveMapping(mapping: ProductMapping): Promise<void>;

  getBenchmarkInputsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<BenchmarkInputObservation[]>;
}
