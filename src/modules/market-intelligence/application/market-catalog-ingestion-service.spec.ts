import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MarketCatalogIngestionService,
  sanitizeRawPayloadForScope,
} from "./market-catalog-ingestion-service";
import { InMemoryMarketRepository } from "../infrastructure/repositories/in-memory-market-repository";
import { isValidUuid } from "../domain/uuid";

describe("MarketCatalogIngestionService (CR-COST-05 Phase 2 & Block 2)", () => {
  let repository: InMemoryMarketRepository;
  let service: MarketCatalogIngestionService;

  beforeEach(() => {
    repository = new InMemoryMarketRepository();
    service = new MarketCatalogIngestionService(repository);
  });

  it("ingests structured CSV with multiple sources, normalizes prices, assigns UUIDs, and persists audit fields", async () => {
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,tax_rate,region_code,cut_spec,thermal_state
Makro,Pechuga de Pollo Fresca 2.5kg,13.125,2.5,kg,ex_tax,0.0,ES_TENERIFE_TF,limpia,fresh
GM Cash,Pechuga de Pollo Fileteada 1.5kg,8.025,1.5,kg,ex_tax,0.0,ES_TENERIFE_TF,fileteada,fresh
5 Océanos,Pechuga Pollo Congelada 1kg,5.60,1000,g,ex_tax,0.0,ES_TENERIFE_TF,entera,frozen
Mercadona,Filetes Pechuga Pollo 500g,3.344,500,g,inc_tax,0.07,ES_CANARIAS_REGIONAL,fileteada,fresh
    `.trim();

    const importedByUuid = "11111111-1111-4111-8111-111111111111";
    const report = await service.ingestCsv(csvData, {
      importedBy: importedByUuid,
      fileName: "precios_septiembre_2026.csv",
    });

    expect(report.totalRows).toBe(4);
    expect(report.validCount).toBe(4);
    expect(report.quarantinedCount).toBe(0);
    expect(report.createdObservationsCount).toBe(4);

    // Verify Makro product created with canonical UUID and normalized price
    const makroProds = await repository.getProductsBySource("src-makro");
    expect(makroProds.length).toBe(1);
    expect(isValidUuid(makroProds[0].id)).toBe(true);
    expect(makroProds[0].rawName).toBe("Pechuga de Pollo Fresca 2.5kg");

    const makroObs = await repository.getObservationsByProduct(makroProds[0].id);
    expect(makroObs.length).toBe(1);
    expect(isValidUuid(makroObs[0].id)).toBe(true);
    expect(makroObs[0].normalizedPriceExTax).toBe(5.25);
    expect(makroObs[0].normalizedUnit).toBe("EUR_PER_KG");
    expect(makroObs[0].importedBy).toBe(importedByUuid);
    expect(makroObs[0].ownerTenantId).toBeNull();
    expect(makroObs[0].rawPayload).toMatchObject({
      fileName: "precios_septiembre_2026.csv",
      lineNumber: 2,
    });

    // Verify Mercadona Inc-Tax with explicit documented 7% IGIC was stripped to Ex-Tax
    // 3.344 € for 500g -> ~6.25 €/kg ex-tax
    const mercadonaProds = await repository.getProductsBySource("src-mercadona");
    const mercadonaObs = await repository.getObservationsByProduct(mercadonaProds[0].id);
    expect(mercadonaObs[0].taxRate).toBe(0.07);
    expect(mercadonaObs[0].normalizedPriceExTax).toBeCloseTo(6.25, 2);
  });

  it("never invents a default tax rate when inc_tax lacks tax_rate or when tax_mode is unknown", async () => {
    const csvData = `
source_name,product_name,raw_price,quantity,unit,tax_mode,gtin,postal_code
Mercadona,Filetes Pechuga Sin Tipo 500g,3.344,500,g,inc_tax,0041234567890,08001
Makro,Producto Fiscalidad Desconocida 1kg,5.00,1,kg,unknown,0841234567890,38001
    `.trim();

    const report = await service.ingestCsv(csvData, {
      importedBy: "11111111-1111-4111-8111-111111111111",
    });

    expect(report.validCount).toBe(2);
    expect(report.quarantinedCount).toBe(0);

    const mercadonaProds = await repository.getProductsBySource("src-mercadona");
    expect(mercadonaProds[0].gtin).toBe("0041234567890");
    const mercadonaObs = await repository.getObservationsByProduct(mercadonaProds[0].id);
    expect(mercadonaObs[0].taxRate).toBeNull();
    expect(mercadonaObs[0].normalizedPriceExTax).toBeNull();
    expect(mercadonaObs[0].normalizationStatus).toBe("tax_rate_missing");
    expect(mercadonaObs[0].observationPostalCode).toBe("08001");

    const makroProds = await repository.getProductsBySource("src-makro");
    const makroObs = await repository.getObservationsByProduct(makroProds[0].id);
    expect(makroObs[0].taxMode).toBe("unknown");
    expect(makroObs[0].taxRate).toBeNull();
    expect(makroObs[0].normalizedPriceExTax).toBeNull();
    expect(makroObs[0].normalizationStatus).toBe("tax_unknown");
    expect(makroObs[0].observationPostalCode).toBe("38001");
  });

  it("quarantines invalid rows (including bad GTIN, contradictory pack, and invalid EXEMPT tax_rate)", async () => {
    const csvWithErrors = `
source_name,product_name,raw_price,quantity,unit,tax_mode,tax_rate,tax_regime,gtin,pack_count,unit_content_qty,unit_content_unit,net_content_qty,net_content_unit
Makro,Aceite de Oliva 5L,38.50,5,l,ex_tax,0.0,IGIC,8412345678905,,,,,
UnknownSource,Arroz 1kg,1.20,1,kg,ex_tax,,,,,,,
GM Cash,Carne Picada,-5.00,1,kg,ex_tax,,,,,,,
5 Océanos,Pescado Congelado,8.50,0,kg,ex_tax,,,,,,,
Makro,Papas Antiguas,4.50,2,saco_invalido,ex_tax,,,,,,,
Makro,Leche GTIN Invalido,6.00,6,l,ex_tax,,,ABC123,,,,,
Makro,Leche Pack Contradictorio,6.00,6,l,ex_tax,,,,6,1,l,8,l
Makro,Pan Exento Con IVA,2.00,1,kg,inc_tax,0.04,EXEMPT,,,,,,
    `.trim();

    const report = await service.ingestCsv(csvWithErrors, {
      importedBy: "user-procurement-1",
    });

    expect(report.totalRows).toBe(8);
    expect(report.validCount).toBe(1);
    expect(report.quarantinedCount).toBe(7);

    expect(report.quarantinedRows[0].reason).toContain("Unrecognized source");
    expect(report.quarantinedRows[1].reason).toContain("Invalid raw_price");
    expect(report.quarantinedRows[2].reason).toContain("Invalid quantity");
    expect(report.quarantinedRows[3].reason).toContain("Normalization error");
    expect(report.quarantinedRows[4].reason).toContain("Invalid GTIN/EAN format");
    expect(report.quarantinedRows[5].reason).toContain("Pack consistency mismatch");
    expect(report.quarantinedRows[6].reason).toContain("EXEMPT cannot declare a positive tax_rate");
  });

  it("handles re-import idempotently via updateObservationValidity without duplicating observation rows", async () => {
    const updateSpy = vi.spyOn(repository, "updateObservationValidity");
    const saveSpy = vi.spyOn(repository, "saveObservation");

    const csvData1 = `
source_name,product_name,raw_price,quantity,unit,tax_mode,location_name,promotion_status,valid_to
Makro,Arroz Redondo 5kg,6.25,5,kg,ex_tax,Adeje,standard,2026-11-20
    `.trim();

    const csvData2 = `
source_name,product_name,raw_price,quantity,unit,tax_mode,location_name,promotion_status,valid_to
Makro,Arroz Redondo 5kg,6.25,5,kg,ex_tax,Adeje,standard,2026-12-05
    `.trim();

    const report1 = await service.ingestCsv(csvData1, {
      importedBy: "11111111-1111-4111-8111-111111111111",
    });
    expect(report1.createdObservationsCount).toBe(1);
    expect(report1.updatedObservationsCount).toBe(0);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Re-import identical catalog with extended valid_to
    const report2 = await service.ingestCsv(csvData2, {
      importedBy: "11111111-1111-4111-8111-111111111111",
    });
    expect(report2.createdObservationsCount).toBe(0);
    expect(report2.updatedObservationsCount).toBe(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const prods = await repository.getProductsBySource("src-makro");
    const obs = await repository.getObservationsByProduct(prods[0].id);
    expect(obs.length).toBe(1);
    expect(obs[0].validTo).toBe("2026-12-05");
  });

  it("uses defaultSourceId when CSV omits source_name and isolates private ownerTenantId fingerprints from public ones", async () => {
    const csvNoSource = `
sku,producto,precio,unidad,iva,formato
GM-001,Harina Trigo 1kg,1.20,kg,0.04,1kg
    `.trim();

    const userUuid = "22222222-2222-4222-8222-222222222222";
    const tenantUuid = "33333333-3333-4333-8333-333333333333";

    const publicReport = await service.ingestCsv(csvNoSource, {
      importedBy: userUuid,
      defaultSourceId: "src-gmcash",
      ownerTenantId: null,
    });
    expect(publicReport.createdObservationsCount).toBe(1);

    const privateReport = await service.ingestCsv(csvNoSource, {
      importedBy: userUuid,
      defaultSourceId: "src-gmcash",
      ownerTenantId: tenantUuid,
    });
    expect(privateReport.createdObservationsCount).toBe(1);

    const gmProds = await repository.getProductsBySource("src-gmcash");
    expect(gmProds).toHaveLength(1);
    const obs = await repository.getObservationsByProduct(gmProds[0].id);
    expect(obs).toHaveLength(2);
    expect(obs.map((o) => o.ownerTenantId)).toEqual([null, tenantUuid]);
  });

  it("sanitizes forbidden private keys out of public raw_payload while keeping them for private tenant rows", () => {
    const dirtyPayload = {
      fileName: "catalog.csv",
      tenantId: "tenant-secret",
      owner_tenant_id: "tenant-secret",
      privateConditions: "5% rebate",
      parsedFields: {
        tenant_id: "nested-leak",
        producto: "Leche",
      },
    };

    const publicClean = sanitizeRawPayloadForScope(dirtyPayload, null);
    expect(publicClean).toEqual({
      fileName: "catalog.csv",
      parsedFields: {
        producto: "Leche",
      },
    });

    const tenantPreserved = sanitizeRawPayloadForScope(
      dirtyPayload,
      "33333333-3333-4333-8333-333333333333",
    );
    expect(tenantPreserved).toEqual(dirtyPayload);
  });

  it("ingests assisted manual entry (Level 0) with pack & fiscal metadata", async () => {
    const result = await service.ingestManualEntry(
      {
        sourceIdOrName: "Makro",
        productName: "Atún Claro en Aceite 1kg (650g escurrido)",
        rawPrice: 6.5,
        quantity: 1000,
        unit: "g",
        netDrainedQuantity: 650,
        taxMode: "ex_tax",
        taxRegime: "IGIC",
        taxRate: 0,
        aiemStatus: "applicable_included",
        aiemRate: 0.05,
        observationCountryCode: "ES",
        observationIslandCode: "TF",
        observationPostalCode: "38001",
      },
      {
        importedBy: "user-chef-1",
      },
    );

    expect(result.normalizedPriceExTax).toBe(10.0);
    expect(result.normalizationStatus).toBe("computed");
  });
});
