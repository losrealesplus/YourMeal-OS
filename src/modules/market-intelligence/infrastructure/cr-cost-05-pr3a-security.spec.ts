import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BenchmarkCalculator, BenchmarkInputObservation } from "../domain/benchmark-calculator";
import { MarketCatalogIngestionService } from "../application/market-catalog-ingestion-service";
import { ProductMappingService } from "../application/product-mapping-service";
import { InMemoryMarketRepository } from "./repositories/in-memory-market-repository";
import { PILOT_ADMIN_MODULE_FLAGS } from "../../../lib/pilot-feature-flags";
import type {
  MarketProduct,
  MarketPriceObservation,
  MarketSource,
  ProductMapping,
  TenantIngredientEconomicRef,
} from "../domain/types";

describe("CR-COST-05 Block 3A (PR3A): Multi-Tenant Security, Module Activation & Economic Integrity", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261112220000_cr_cost_05_pr3a_multi_tenant_security.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261112220000_cr_cost_05_pr3a_multi_tenant_security_down.sql",
  );

  describe("SQL DDL & RLS Contract Checks", () => {
    it("verifies PR3A migration and rollback SQL files exist", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(fs.existsSync(rollbackPath)).toBe(true);
    });

    it("verifies owner_tenant_id and partial unique indexes on market_products", () => {
      const sql = fs.readFileSync(migrationPath, "utf8");
      expect(sql).toContain("ADD COLUMN IF NOT EXISTS owner_tenant_id uuid NULL REFERENCES public.tenants(id)");
      expect(sql).toContain("DROP CONSTRAINT IF EXISTS uq_market_products_source_sku");
      expect(sql).toContain("CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_public_source_sku");
      expect(sql).toContain("WHERE owner_tenant_id IS NULL");
      expect(sql).toContain("CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_tenant_source_sku");
      expect(sql).toContain("WHERE owner_tenant_id IS NOT NULL");
    });

    it("verifies module feature flags are seeded fail-closed", () => {
      const sql = fs.readFileSync(migrationPath, "utf8");
      expect(sql).toContain("admin_module_cost_intelligence");
      expect(sql).toContain("admin_module_market_intelligence");
      expect(sql).toContain("false,");
      expect(sql).toContain("tenant_id IS NULL");
      expect(PILOT_ADMIN_MODULE_FLAGS.costIntelligence).toBe("admin_module_cost_intelligence");
      expect(PILOT_ADMIN_MODULE_FLAGS.marketIntelligence).toBe("admin_module_market_intelligence");
    });

    it("verifies security functions and role exclusions", () => {
      const sql = fs.readFileSync(migrationPath, "utf8");
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.is_tenant_module_enabled");
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.has_cost_intelligence_access");
      expect(sql).toContain("SECURITY DEFINER");
      expect(sql).toContain("SET search_path = public, pg_temp");

      // Authorized roles:
      expect(sql).toContain("'company_admin'");
      expect(sql).toContain("'operations_manager'");
      expect(sql).toContain("'purchasing'");
      expect(sql).toContain("'accounting'");
      expect(sql).toContain("'inventory'");
      expect(sql).toContain("'production'");
      expect(sql).toContain("public.is_saas_admin(p_user_id)");

      // Disallow rawLine / raw_line in public observations
      expect(sql).toContain("check_mpo_public_raw_payload_no_tenant_leak");
      expect(sql).toContain("'rawLine'");
      expect(sql).toContain("'raw_line'");
    });

    it("verifies fail-closed rollback preflight guard for private products", () => {
      const downSql = fs.readFileSync(rollbackPath, "utf8");
      expect(downSql).toContain("Cannot rollback PR3A: found tenant-private market_products");
      expect(downSql).toContain("owner_tenant_id IS NOT NULL");
      expect(downSql).toContain("restrict_violation");
    });
  });

  describe("BenchmarkCalculator: Decision 4 - Unknown Tax & Historical Reference", () => {
    const chickenIngredient: TenantIngredientEconomicRef = {
      id: "ing-chicken-001",
      tenantId: "tenant-eatclean",
      name: "Pechuga de Pollo Limpia",
      category: "Aves",
      thermalState: "fresh",
      unit: "kg",
      effectiveWacExTax: 6.04,
    };

    const mockSource: MarketSource = {
      id: "src-makro",
      name: "Makro Tenerife",
      sourceType: "b2b_wholesale",
      defaultTaxMode: "ex_tax",
      defaultRegion: "ES_TENERIFE_TF",
      isActive: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const mockProduct: MarketProduct = {
      id: "mp-makro-1",
      sourceId: "src-makro",
      rawName: "Pechuga de Pollo Limpia 2kg",
      category: "Aves",
      thermalState: "fresh",
      standardQuantity: 2,
      standardUnit: "kg",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const mockMapping: ProductMapping = {
      id: "map-1",
      tenantId: "tenant-eatclean",
      tenantIngredientId: "ing-chicken-001",
      marketProductId: "mp-makro-1",
      matchConfidence: 0.95,
      matchStatus: "confirmed",
      comparabilityGrade: "HIGH",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    it("does not treat observation with unknown tax as current benchmark; retains valid prior observation as historical reference", () => {
      const refDate = new Date("2026-09-27T12:00:00Z");

      const validPriorObs: MarketPriceObservation = {
        id: "obs-prior",
        marketProductId: "mp-makro-1",
        observedAt: "2026-09-25T10:00:00Z",
        priceRaw: 10.5,
        currency: "EUR",
        taxMode: "ex_tax",
        taxRate: 0.0,
        normalizedPriceExTax: 5.25,
        normalizedUnit: "EUR_PER_KG",
        promotionStatus: "standard",
        regionCode: "ES_TENERIFE_TF",
        captureMethod: "catalog_import",
        qualityStatus: "OBSERVED",
        createdAt: "2026-09-25T10:00:00Z",
      };

      const pendingRecentObs: MarketPriceObservation = {
        id: "obs-recent",
        marketProductId: "mp-makro-1",
        observedAt: "2026-09-27T08:00:00Z",
        priceRaw: 12.0,
        currency: "EUR",
        taxMode: "unknown",
        taxRate: null,
        normalizedPriceExTax: null,
        normalizedUnit: "EUR_PER_KG",
        promotionStatus: "standard",
        regionCode: "ES_TENERIFE_TF",
        captureMethod: "catalog_import",
        qualityStatus: "OBSERVED",
        createdAt: "2026-09-27T08:00:00Z",
      };

      const inputs: BenchmarkInputObservation[] = [
        {
          source: mockSource,
          product: mockProduct,
          observation: validPriorObs,
          mapping: mockMapping,
        },
        {
          source: mockSource,
          product: mockProduct,
          observation: pendingRecentObs,
          mapping: mockMapping,
        },
      ];

      const result = BenchmarkCalculator.calculateBenchmark(chickenIngredient, inputs, refDate);

      // Pending observation is excluded from active median
      expect(result.historicalReferences).toHaveLength(1);
      expect(result.historicalReferences![0].observationId).toBe("obs-prior");
      expect(result.diagnosticNote).toContain("pendiente de normalización fiscal");
      expect(result.diagnosticNote).toContain("se conserva únicamente como referencia histórica");
    });

    it("returns PENDING_NORMALIZATION with null benchmark price when prior observation is expired", () => {
      const refDate = new Date("2026-09-27T12:00:00Z");

      const expiredPriorObs: MarketPriceObservation = {
        id: "obs-expired",
        marketProductId: "mp-makro-1",
        observedAt: "2026-08-01T10:00:00Z", // >14 days old -> stale
        priceRaw: 10.5,
        currency: "EUR",
        taxMode: "ex_tax",
        taxRate: 0.0,
        normalizedPriceExTax: 5.25,
        normalizedUnit: "EUR_PER_KG",
        promotionStatus: "standard",
        regionCode: "ES_TENERIFE_TF",
        captureMethod: "catalog_import",
        qualityStatus: "STALE",
        createdAt: "2026-08-01T10:00:00Z",
      };

      const pendingRecentObs: MarketPriceObservation = {
        id: "obs-recent",
        marketProductId: "mp-makro-1",
        observedAt: "2026-09-27T08:00:00Z",
        priceRaw: 12.0,
        currency: "EUR",
        taxMode: "unknown",
        taxRate: null,
        normalizedPriceExTax: null,
        normalizedUnit: "EUR_PER_KG",
        promotionStatus: "standard",
        regionCode: "ES_TENERIFE_TF",
        captureMethod: "catalog_import",
        qualityStatus: "OBSERVED",
        createdAt: "2026-09-27T08:00:00Z",
      };

      const inputs: BenchmarkInputObservation[] = [
        {
          source: mockSource,
          product: mockProduct,
          observation: expiredPriorObs,
          mapping: mockMapping,
        },
        {
          source: mockSource,
          product: mockProduct,
          observation: pendingRecentObs,
          mapping: mockMapping,
        },
      ];

      const result = BenchmarkCalculator.calculateBenchmark(chickenIngredient, inputs, refDate);

      expect(result.benchmarkStatus).toBe("PENDING_NORMALIZATION");
      expect(result.benchmarkPriceExTax).toBeNull();
      expect(result.diagnosticNote).toContain("está caducada y no es computable como precio actual");

      // Variance analysis also yields PENDING_DATA
      const variance = BenchmarkCalculator.analyzeVariance(chickenIngredient, result);

      expect(variance.status).toBe("PENDING_DATA");
      expect(variance.benchmarkPriceExTax).toBeNull();
      expect(variance.marketVariancePct).toBeNull();
      expect(variance.annualSpendAtRiskEur).toBeNull();
    });
  });

  describe("MarketCatalogIngestionService: Decision 5 - Tax Mode Unknown Default", () => {
    let repo: InMemoryMarketRepository;
    let ingestionService: MarketCatalogIngestionService;

    beforeEach(async () => {
      repo = new InMemoryMarketRepository();
      ingestionService = new MarketCatalogIngestionService(repo);
    });

    it("records tax_mode = unknown and normalized_price_ex_tax = null when CSV row has no tax_mode", async () => {
      const csv = `source_name,product_name,raw_price,quantity,unit
Makro,Harina Especial 1kg,15.50,1,kg`;

      const result = await ingestionService.ingestCsv(csv, {
        importedBy: "00000000-0000-4000-a000-000000000001",
      });

      expect(result.totalRows).toBe(1);
      expect(result.validCount).toBe(1);
      expect(result.quarantinedCount).toBe(0);

      const products = await repo.getProductsBySource("src-makro");
      expect(products).toHaveLength(1);
      const observations = await repo.getObservationsByProduct(products[0].id);
      expect(observations).toHaveLength(1);

      const obs = observations[0];
      expect(obs.taxMode).toBe("unknown");
      expect(obs.taxRate).toBeNull();
      expect(obs.normalizedPriceExTax).toBeNull();
      expect(obs.normalizationStatus).toBe("tax_unknown");
    });

    it("omits rawLine from public raw_payload during ingestion", async () => {
      const csv = `source_name,product_name,raw_price,quantity,unit,tax_mode,tax_rate
Makro,Aceite de Oliva 1L,8.50,1,l,inc_tax,0.10`;

      const result = await ingestionService.ingestCsv(csv, {
        importedBy: "00000000-0000-4000-a000-000000000001",
      });

      expect(result.totalRows).toBe(1);
      const products = await repo.getProductsBySource("src-makro");
      const observations = await repo.getObservationsByProduct(products[0].id);
      const obs = observations[0];

      expect(obs.rawPayload).toBeDefined();
      expect(obs.rawPayload).not.toHaveProperty("rawLine");
      expect(obs.rawPayload).not.toHaveProperty("raw_line");
    });
  });

  describe("ProductMappingService & Repository: Tenant Isolation", () => {
    let repo: InMemoryMarketRepository;
    let mappingService: ProductMappingService;

    beforeEach(async () => {
      repo = new InMemoryMarketRepository();
      mappingService = new ProductMappingService(repo);
    });

    it("blocks mapping a product owned by Tenant B to Tenant A", async () => {
      const tenantA = "00000000-0000-4000-a000-000000000001";
      const tenantB = "00000000-0000-4000-a000-000000000002";

      // Save product owned by Tenant B
      const prodB: MarketProduct = {
        id: "prod-tenant-b",
        sourceId: "src-makro",
        externalSku: "PV-TENANT-B-001",
        rawName: "Secret Formula B",
        category: "Condimentos",
        thermalState: "ambient",
        standardQuantity: 1,
        standardUnit: "kg",
        ownerTenantId: tenantB,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      await repo.saveProduct(prodB);

      // Attempt to confirm mapping for Tenant A
      await expect(
        mappingService.confirmMapping(tenantA, "ing-tenant-a-1", "prod-tenant-b"),
      ).rejects.toThrow("Cannot map product prod-tenant-b: private product owned by another tenant");
    });

    it("isolates private products in repository queries", async () => {
      const tenantA = "00000000-0000-4000-a000-000000000001";
      const tenantB = "00000000-0000-4000-a000-000000000002";

      // Seed Public product
      await repo.saveProduct({
        id: "prod-public",
        sourceId: "src-makro",
        externalSku: "PUB-001",
        rawName: "Public Product",
        category: "Verduras",
        thermalState: "fresh",
        standardQuantity: 1,
        standardUnit: "kg",
        ownerTenantId: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      });

      // Seed Tenant A product
      await repo.saveProduct({
        id: "prod-tenant-a",
        sourceId: "src-makro",
        externalSku: "TA-001",
        rawName: "Tenant A Special",
        category: "Verduras",
        thermalState: "fresh",
        standardQuantity: 1,
        standardUnit: "kg",
        ownerTenantId: tenantA,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      });

      // Query as public only (tenantId: null) -> returns public products only (not Tenant A's)
      const publicProducts = await repo.getProductsBySource("src-makro", null);
      expect(publicProducts.map((p) => p.id)).not.toContain("prod-tenant-a");
      expect(publicProducts.map((p) => p.id)).toContain("prod-public");

      // Query as Tenant B (tenantId: tenantB) -> returns public products only (not Tenant A's)
      const tenantBProducts = await repo.getProductsBySource("src-makro", tenantB);
      expect(tenantBProducts.map((p) => p.id)).not.toContain("prod-tenant-a");
      expect(tenantBProducts.map((p) => p.id)).toContain("prod-public");

      // Query as Tenant A (tenantId: tenantA) -> returns public products + Tenant A's products
      const tenantAProducts = await repo.getProductsBySource("src-makro", tenantA);
      expect(tenantAProducts.map((p) => p.id)).toContain("prod-tenant-a");
      expect(tenantAProducts.map((p) => p.id)).toContain("prod-public");
    });
  });
});
