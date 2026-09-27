import {
  MarketPriceObservation,
  MarketProduct,
  MarketSource,
  ProductMapping,
} from '../../domain/types';
import { BenchmarkInputObservation } from '../../domain/benchmark-calculator';
import { IMarketIntelligenceRepository } from './market-repository-interface';

export class InMemoryMarketRepository implements IMarketIntelligenceRepository {
  private sources = new Map<string, MarketSource>();
  private products = new Map<string, MarketProduct>();
  private observations = new Map<string, MarketPriceObservation>();
  private observationFingerprints = new Map<string, string>(); // fingerprint -> observationId
  private mappings = new Map<string, ProductMapping>(); // key: `${tenantId}:${tenantIngredientId}:${marketProductId}`

  constructor() {
    this.seedDefaultSources();
  }

  public async getSources(): Promise<MarketSource[]> {
    return Array.from(this.sources.values()).filter((s) => s.isActive);
  }

  public async getSourceById(id: string): Promise<MarketSource | null> {
    return this.sources.get(id) || null;
  }

  public async getSourceByName(name: string): Promise<MarketSource | null> {
    const clean = name.trim().toLowerCase();
    for (const source of this.sources.values()) {
      if (
        source.name.toLowerCase() === clean ||
        source.name.toLowerCase().includes(clean) ||
        clean.includes(source.name.toLowerCase())
      ) {
        return source;
      }
    }
    return null;
  }

  public async saveSource(source: MarketSource): Promise<void> {
    this.sources.set(source.id, { ...source });
  }

  public async getProductById(id: string): Promise<MarketProduct | null> {
    return this.products.get(id) || null;
  }

  public async getProductsBySource(sourceId: string): Promise<MarketProduct[]> {
    return Array.from(this.products.values()).filter((p) => p.sourceId === sourceId);
  }

  public async findProductBySku(sourceId: string, sku: string): Promise<MarketProduct | null> {
    for (const product of this.products.values()) {
      if (product.sourceId === sourceId && product.externalSku === sku) {
        return product;
      }
    }
    return null;
  }

  public async findProductByName(sourceId: string, rawName: string): Promise<MarketProduct | null> {
    const clean = rawName.trim().toLowerCase();
    for (const product of this.products.values()) {
      if (product.sourceId === sourceId && product.rawName.toLowerCase() === clean) {
        return product;
      }
    }
    return null;
  }

  public async saveProduct(product: MarketProduct): Promise<void> {
    this.products.set(product.id, { ...product });
  }

  public async getObservationById(id: string): Promise<MarketPriceObservation | null> {
    return this.observations.get(id) || null;
  }

  public async getObservationsByProduct(productId: string): Promise<MarketPriceObservation[]> {
    return Array.from(this.observations.values()).filter((o) => o.marketProductId === productId);
  }

  public async findObservationByFingerprint(
    fingerprint: string
  ): Promise<MarketPriceObservation | null> {
    const obsId = this.observationFingerprints.get(fingerprint);
    if (!obsId) return null;
    return this.observations.get(obsId) || null;
  }

  public async saveObservation(
    observation: MarketPriceObservation,
    fingerprint: string
  ): Promise<void> {
    this.observations.set(observation.id, { ...observation });
    this.observationFingerprints.set(fingerprint, observation.id);
  }

  public async getMappingsByTenant(tenantId: string): Promise<ProductMapping[]> {
    return Array.from(this.mappings.values()).filter((m) => m.tenantId === tenantId);
  }

  public async getMapping(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<ProductMapping | null> {
    for (const m of this.mappings.values()) {
      if (m.tenantId === tenantId && m.tenantIngredientId === tenantIngredientId) {
        return m;
      }
    }
    return null;
  }

  public async saveMapping(mapping: ProductMapping): Promise<void> {
    const key = `${mapping.tenantId}:${mapping.tenantIngredientId}:${mapping.marketProductId}`;
    this.mappings.set(key, { ...mapping });
  }

  public async getBenchmarkInputsForIngredient(
    tenantId: string,
    tenantIngredientId: string
  ): Promise<BenchmarkInputObservation[]> {
    const activeMappings = Array.from(this.mappings.values()).filter(
      (m) =>
        m.tenantId === tenantId &&
        m.tenantIngredientId === tenantIngredientId &&
        m.matchStatus === 'confirmed' &&
        m.comparabilityGrade !== 'UNKNOWN'
    );

    const results: BenchmarkInputObservation[] = [];

    for (const mapping of activeMappings) {
      const product = this.products.get(mapping.marketProductId);
      if (!product) continue;

      const source = this.sources.get(product.sourceId);
      if (!source || !source.isActive) continue;

      const productObs = Array.from(this.observations.values())
        .filter((o) => o.marketProductId === product.id)
        .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

      if (productObs.length > 0) {
        // Take latest active observation
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

  private seedDefaultSources(): void {
    const defaultSources: MarketSource[] = [
      {
        id: 'src-makro',
        name: 'Makro',
        sourceType: 'b2b_wholesale',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        notes: 'Professional B2B / HORECA Cash & Carry',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'src-gmcash',
        name: 'GM Cash',
        sourceType: 'cash_carry',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        notes: 'HORECA Cash & Carry Transgourmet',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'src-5oceanos',
        name: '5 Océanos',
        sourceType: 'regional_specialist',
        defaultTaxMode: 'ex_tax',
        defaultRegion: 'ES_TENERIFE_TF',
        isActive: true,
        notes: 'Canary Islands Frozen & Protein Specialist',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'src-mercadona',
        name: 'Mercadona',
        sourceType: 'retail_ceiling',
        defaultTaxMode: 'inc_tax',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        isActive: true,
        notes: 'Consumer Supermarket Retail Reference Ceiling',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    for (const src of defaultSources) {
      this.sources.set(src.id, src);
    }
  }
}
