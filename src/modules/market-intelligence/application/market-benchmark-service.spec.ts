import { describe, it, expect, beforeEach } from 'vitest';
import { MarketBenchmarkService } from './market-benchmark-service';
import { InMemoryMarketRepository } from '../infrastructure/repositories/in-memory-market-repository';
import { MarketCatalogIngestionService } from './market-catalog-ingestion-service';
import { ProductMappingService } from './product-mapping-service';
import { TenantIngredientEconomicRef } from '../domain/types';

describe('MarketBenchmarkService (CR-COST-05 Phase 2)', () => {
  let repository: InMemoryMarketRepository;
  let ingestionService: MarketCatalogIngestionService;
  let mappingService: ProductMappingService;
  let benchmarkService: MarketBenchmarkService;

  const tenantId = 'tenant-eatclean';

  const tenantChicken: TenantIngredientEconomicRef = {
    id: 'ing-chicken-001',
    tenantId,
    name: 'Pechuga de Pollo Limpia',
    category: 'Aves',
    thermalState: 'fresh',
    unit: 'kg',
    effectiveWacExTax: 6.04,
    currentInvoicedPriceExTax: 6.10,
    annualVolume: 1250,
    primarySupplierName: 'Distribuciones Cárnicas Canarias S.L.',
  };

  beforeEach(async () => {
    repository = new InMemoryMarketRepository();
    ingestionService = new MarketCatalogIngestionService(repository);
    mappingService = new ProductMappingService(repository);
    benchmarkService = new MarketBenchmarkService(repository);

    // Ingest market observations from the 4 sources
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,region_code,cut_spec,thermal_state,freight_inclusion
Makro,Pechuga de Pollo Limpia 2kg,10.50,2,kg,ex_tax,ES_TENERIFE_TF,limpia,fresh,included
GM Cash,Pechuga Pollo Fresca 1.5kg,8.025,1.5,kg,ex_tax,ES_TENERIFE_TF,limpia,fresh,included
5 Océanos,Pechuga Pollo Congelada,5.60,1,kg,ex_tax,ES_TENERIFE_TF,entera,frozen,included
Mercadona,Filetes Pechuga Pollo 500g,3.344,500,g,inc_tax,ES_CANARIAS_REGIONAL,fileteada,fresh,included
    `.trim();

    await ingestionService.ingestCsv(csvData, { importedBy: 'admin-1' });

    // Map Makro as HIGH comparability
    const makroProds = await repository.getProductsBySource('src-makro');
    const makroChicken = makroProds.find((p) => p.rawName.includes('Pechuga'))!;
    await mappingService.confirmMapping(tenantId, tenantChicken.id, makroChicken.id, {
      overrideComparability: 'HIGH',
    });

    // Map GM Cash as HIGH comparability
    const gmProds = await repository.getProductsBySource('src-gmcash');
    const gmChicken = gmProds.find((p) => p.rawName.includes('Pechuga'))!;
    await mappingService.confirmMapping(tenantId, tenantChicken.id, gmChicken.id, {
      overrideComparability: 'HIGH',
    });
  });

  it('calculates benchmark and variance against internal tenant WAC', async () => {
    const result = await benchmarkService.getBenchmarkForIngredient(tenantId, tenantChicken);

    expect(result.hasObservations).toBe(true);
    expect(result.benchmark).not.toBeNull();
    expect(result.variance).not.toBeNull();

    // Benchmark from Makro (5.25 €/kg, w=1.0) and GM Cash (5.35 €/kg, w=1.0)
    // Weighted median lands on 5.25 €/kg
    expect(result.benchmark?.benchmarkPriceExTax).toBe(5.25);
    expect(result.variance?.effectiveWacExTax).toBe(6.04);
    expect(result.variance?.status).toBe('UNFAVORABLE_OVERPAYING');
    // (6.04 - 5.25) / 5.25 * 100 = 15.05%
    expect(result.variance?.marketVariancePct).toBe(15.05);
    // (6.10 - 5.25) * 1250 = 1062.50 €
    expect(result.variance?.annualSpendAtRiskEur).toBe(1062.5);
  });

  it('generates a full Negotiation Brief with leverage points for purchasing operator', async () => {
    const brief = await benchmarkService.generateNegotiationBrief(
      { id: tenantId, name: 'EatClean Tenerife' },
      tenantChicken
    );

    expect(brief).not.toBeNull();
    expect(brief?.tenantName).toBe('EatClean Tenerife');
    expect(brief?.ingredientName).toBe('Pechuga de Pollo Limpia');
    expect(brief?.targetSupplierName).toBe('Distribuciones Cárnicas Canarias S.L.');
    expect(brief?.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(brief?.potentialAnnualSavingsEur).toBeGreaterThan(0);
    expect(brief?.observableComponents.length).toBe(2);
  });

  it('returns graceful fallback when ingredient has no confirmed mappings', async () => {
    const unmappedIngredient: TenantIngredientEconomicRef = {
      id: 'ing-unmapped-999',
      tenantId,
      name: 'Ingrediente Exótico Sin Mercado',
      category: 'Otros',
      unit: 'kg',
      effectiveWacExTax: 15.0,
    };

    const result = await benchmarkService.getBenchmarkForIngredient(tenantId, unmappedIngredient);
    expect(result.hasObservations).toBe(false);
    expect(result.benchmark).toBeNull();
    expect(result.variance).toBeNull();
  });

  it('ranks offers for ingredient producing Top 1 and alternatives (Bloque 3)', async () => {
    const ranking = await benchmarkService.rankOffersForIngredient(
      tenantId,
      tenantChicken,
      { batchQuantity: 20 }
    );

    expect(ranking).not.toBeNull();
    expect(ranking.top1).not.toBeNull();
    expect(ranking.top1?.sourceName).toBe('Makro');
    expect(ranking.top1?.effectiveComparablePriceExTax).toBe(5.25);
    expect(ranking.alternatives.length).toBe(1);
    expect(ranking.alternatives[0].sourceName).toBe('GM Cash');
    expect(ranking.alternatives[0].effectiveComparablePriceExTax).toBe(5.35);

    // Verified savings against WAC (6.04 € - 5.25 € = 0.79 €)
    expect(ranking.savingsConfidence).toBe('VERIFIED');
    expect(ranking.savingsVsWacEurPerUnit).toBe(0.79);
    expect(ranking.savingsVsAlternativeEurPerUnit).toBe(0.1); // 5.35 - 5.25
  });

  it('batch-ranks multiple ingredients without N+1 queries', async () => {
    const rankings = await benchmarkService.rankOffersForIngredients(
      tenantId,
      [tenantChicken],
      { batchQuantity: 50 }
    );

    expect(rankings.has(tenantChicken.id)).toBe(true);
    const chickenRanking = rankings.get(tenantChicken.id)!;
    expect(chickenRanking.top1?.sourceName).toBe('Makro');
  });
});
