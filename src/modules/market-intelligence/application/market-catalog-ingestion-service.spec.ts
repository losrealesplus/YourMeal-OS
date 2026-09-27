import { describe, it, expect, beforeEach } from 'vitest';
import { MarketCatalogIngestionService } from './market-catalog-ingestion-service';
import { InMemoryMarketRepository } from '../infrastructure/repositories/in-memory-market-repository';

describe('MarketCatalogIngestionService (CR-COST-05 Phase 2)', () => {
  let repository: InMemoryMarketRepository;
  let service: MarketCatalogIngestionService;

  beforeEach(() => {
    repository = new InMemoryMarketRepository();
    service = new MarketCatalogIngestionService(repository);
  });

  it('ingests structured CSV with multiple sources and normalizes prices', async () => {
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,region_code,cut_spec,thermal_state
Makro,Pechuga de Pollo Fresca 2.5kg,13.125,2.5,kg,ex_tax,ES_TENERIFE_TF,limpia,fresh
GM Cash,Pechuga de Pollo Fileteada 1.5kg,8.025,1.5,kg,ex_tax,ES_TENERIFE_TF,fileteada,fresh
5 Océanos,Pechuga Pollo Congelada 1kg,5.60,1000,g,ex_tax,ES_TENERIFE_TF,entera,frozen
Mercadona,Filetes Pechuga Pollo 500g,3.344,500,g,inc_tax,ES_CANARIAS_REGIONAL,fileteada,fresh
    `.trim();

    const report = await service.ingestCsv(csvData, {
      importedBy: 'user-procurement-1',
      fileName: 'precios_septiembre_2026.csv',
    });

    expect(report.totalRows).toBe(4);
    expect(report.validCount).toBe(4);
    expect(report.quarantinedCount).toBe(0);
    expect(report.createdObservationsCount).toBe(4);

    // Verify Makro product created and normalized
    const makroProds = await repository.getProductsBySource('src-makro');
    expect(makroProds.length).toBe(1);
    expect(makroProds[0].rawName).toBe('Pechuga de Pollo Fresca 2.5kg');

    const makroObs = await repository.getObservationsByProduct(makroProds[0].id);
    expect(makroObs.length).toBe(1);
    expect(makroObs[0].normalizedPriceExTax).toBe(5.25);
    expect(makroObs[0].normalizedUnit).toBe('EUR_PER_KG');

    // Verify Mercadona Inc-Tax 7% IGIC was stripped to Ex-Tax
    // 3.344 € for 500g -> ~6.25 €/kg ex-tax
    const mercadonaProds = await repository.getProductsBySource('src-mercadona');
    const mercadonaObs = await repository.getObservationsByProduct(mercadonaProds[0].id);
    expect(mercadonaObs[0].normalizedPriceExTax).toBeCloseTo(6.25, 2);
  });

  it('quarantines invalid rows without silently dropping or failing the whole batch', async () => {
    const csvWithErrors = `
source_name,product_name,raw_price,quantity,unit,tax_mode
Makro,Aceite de Oliva 5L,38.50,5,l,ex_tax
UnknownSource,Arroz 1kg,1.20,1,kg,ex_tax
GM Cash,Carne Picada,-5.00,1,kg,ex_tax
5 Océanos,Pescado Congelado,8.50,0,kg,ex_tax
Makro,Papas Antiguas,4.50,2,saco_invalido,ex_tax
    `.trim();

    const report = await service.ingestCsv(csvWithErrors, {
      importedBy: 'user-procurement-1',
    });

    expect(report.totalRows).toBe(5);
    expect(report.validCount).toBe(1); // Only Aceite de Oliva is valid
    expect(report.quarantinedCount).toBe(4);

    expect(report.quarantinedRows[0].reason).toContain('Unrecognized source');
    expect(report.quarantinedRows[1].reason).toContain('Invalid raw_price');
    expect(report.quarantinedRows[2].reason).toContain('Invalid quantity');
    expect(report.quarantinedRows[3].reason).toContain('Normalization error');
  });

  it('handles re-import idempotently without duplicating observation rows', async () => {
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,location_name,promotion_status
Makro,Arroz Redondo 5kg,6.25,5,kg,ex_tax,Adeje,standard
    `.trim();

    const report1 = await service.ingestCsv(csvData, {
      importedBy: 'user-procurement-1',
    });
    expect(report1.createdObservationsCount).toBe(1);
    expect(report1.updatedObservationsCount).toBe(0);

    // Re-import identical catalog
    const report2 = await service.ingestCsv(csvData, {
      importedBy: 'user-procurement-1',
    });
    expect(report2.createdObservationsCount).toBe(0);
    expect(report2.updatedObservationsCount).toBe(1);

    const prods = await repository.getProductsBySource('src-makro');
    const obs = await repository.getObservationsByProduct(prods[0].id);
    expect(obs.length).toBe(1); // No duplicated observation row!
  });

  it('ingests assisted manual entry (Level 0)', async () => {
    const result = await service.ingestManualEntry(
      {
        sourceIdOrName: 'Makro',
        productName: 'Atún Claro en Aceite 1kg (650g escurrido)',
        rawPrice: 6.5,
        quantity: 1000,
        unit: 'g',
        netDrainedQuantity: 650,
        taxMode: 'ex_tax',
      },
      {
        importedBy: 'user-chef-1',
      }
    );

    expect(result.normalizedPriceExTax).toBe(10.0);
  });
});
