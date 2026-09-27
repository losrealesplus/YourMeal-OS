import { describe, it, expect, beforeEach } from 'vitest';
import { ProductMappingService } from './product-mapping-service';
import { InMemoryMarketRepository } from '../infrastructure/repositories/in-memory-market-repository';
import { MarketCatalogIngestionService } from './market-catalog-ingestion-service';
import { TenantIngredientEconomicRef } from '../domain/types';

describe('ProductMappingService (CR-COST-05 Phase 2)', () => {
  let repository: InMemoryMarketRepository;
  let ingestionService: MarketCatalogIngestionService;
  let mappingService: ProductMappingService;

  const tenantId = 'tenant-eatclean';

  beforeEach(async () => {
    repository = new InMemoryMarketRepository();
    ingestionService = new MarketCatalogIngestionService(repository);
    mappingService = new ProductMappingService(repository);

    // Seed market catalog
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,cut_spec,thermal_state
Makro,Pechuga de Pollo Limpia 2kg,10.50,2,kg,ex_tax,limpia,fresh
GM Cash,Pechuga Pollo Fresca 1.5kg,8.025,1.5,kg,ex_tax,limpia,fresh
5 Océanos,Pechuga Pollo Congelada,5.60,1,kg,ex_tax,entera,frozen
Mercadona,Filetes Pechuga Pollo 500g,3.344,500,g,inc_tax,fileteada,fresh
Makro,Aceite de Oliva 5L,38.50,5,l,ex_tax,,ambient
    `.trim();

    await ingestionService.ingestCsv(csvData, { importedBy: 'admin-1' });
  });

  it('categorizes match candidates into 4 distinct policy tiers', async () => {
    const ingredient: TenantIngredientEconomicRef = {
      id: 'ing-chicken-001',
      tenantId,
      name: 'Pechuga de Pollo Limpia',
      category: 'Aves',
      thermalState: 'fresh',
      unit: 'kg',
      effectiveWacExTax: 6.04,
    };

    const overview = await mappingService.getSuggestionsForIngredient(tenantId, ingredient);

    expect(overview.tenantIngredientName).toBe('Pechuga de Pollo Limpia');

    // Makro & GM Cash match cleanly on name, fresh thermal state, unit kg, and limpia spec (>= 90%)
    expect(overview.highMatchSuggestions.length).toBeGreaterThanOrEqual(1);
    expect(overview.highMatchSuggestions[0].marketProduct.rawName).toContain('Pechuga');
    expect(overview.highMatchSuggestions[0].matchResult.classification).toBe('HIGH_MATCH');

    // 5 Océanos (frozen) or Mercadona (different format) fall into Medium or Low tiers
    const hasAlternatives =
      overview.mediumMatchReviewNeeded.length > 0 || overview.lowMatchAlternatives.length > 0;
    expect(hasAlternatives).toBe(true);

    // Aceite de Oliva (kg vs l) is UNMATCHED (< 50%) and completely excluded from suggestions
    const hasOil = [...overview.highMatchSuggestions, ...overview.mediumMatchReviewNeeded, ...overview.lowMatchAlternatives]
      .some((s) => s.marketProduct.rawName.includes('Aceite'));
    expect(hasOil).toBe(false);
  });

  it('confirms mapping with human verification and custom comparability grade', async () => {
    const makroProds = await repository.getProductsBySource('src-makro');
    const chickenProd = makroProds.find((p) => p.rawName.includes('Pechuga'))!;

    const mapping = await mappingService.confirmMapping(
      tenantId,
      'ing-chicken-001',
      chickenProd.id,
      {
        overrideComparability: 'HIGH',
        verifiedBy: 'Alex Procurement Manager',
      }
    );

    expect(mapping.matchStatus).toBe('confirmed');
    expect(mapping.comparabilityGrade).toBe('HIGH');
    expect(mapping.verifiedBy).toBe('Alex Procurement Manager');

    // Verify retrieval
    const retrieved = await repository.getMapping(tenantId, 'ing-chicken-001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.marketProductId).toBe(chickenProd.id);
    expect(retrieved?.matchStatus).toBe('confirmed');
  });

  it('allows rejecting a candidate mapping', async () => {
    const makroProds = await repository.getProductsBySource('src-makro');
    const chickenProd = makroProds.find((p) => p.rawName.includes('Pechuga'))!;

    await mappingService.confirmMapping(tenantId, 'ing-chicken-001', chickenProd.id);
    await mappingService.rejectMapping(tenantId, 'ing-chicken-001', chickenProd.id);

    const retrieved = await repository.getMapping(tenantId, 'ing-chicken-001');
    expect(retrieved?.matchStatus).toBe('rejected');
  });
});
