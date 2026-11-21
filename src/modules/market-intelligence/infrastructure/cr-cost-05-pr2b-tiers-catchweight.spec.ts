import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PriceNormalizer } from "../domain/price-normalizer";
import { resolvePhysicalPack } from "../domain/physical-format";
import { CsvCatalogParser } from "./csv-catalog-parser";
import { MarketCatalogIngestionService } from "../application/market-catalog-ingestion-service";
import { InMemoryMarketRepository } from "./repositories/in-memory-market-repository";
import type { MarketPriceObservation, MarketProduct, MarketTenantConfig } from "../domain/types";

describe("CR-COST-05 PR2B: Physical Format, Fiscal Metadata & Volume Tiers Extension", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261112230000_cr_cost_05_pr2b_physical_fiscal_tiers.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261112230000_cr_cost_05_pr2b_physical_fiscal_tiers_down.sql",
  );

  it("verifies PR2B migration and rollback SQL files exist", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it("validates SQL schema additions: catch-weight, TARIC, volume tiers D-010, immutability trigger and tenant configs", () => {
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // 1. market_products extensions
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS is_catch_weight boolean NOT NULL DEFAULT false");
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS taric_code text NULL");
    expect(migrationSql).toContain("CONSTRAINT check_mp_taric_code CHECK");
    expect(migrationSql).toContain("idx_market_products_taric_code");

    // 2. market_volume_tiers extensions & D-010 integrity
    expect(migrationSql).toContain("ALTER TABLE public.market_volume_tiers");
    expect(migrationSql).toContain("ALTER COLUMN tier_normalized_price_ex_tax DROP NOT NULL");
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS tier_quantity_unit text NOT NULL DEFAULT 'unit'");
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS tier_price_raw numeric(12,4) NULL");
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS tax_mode text NOT NULL DEFAULT 'unknown'");
    expect(migrationSql).toContain("ADD COLUMN IF NOT EXISTS tax_rate numeric(6,4) NULL");
    expect(migrationSql).toContain("CONSTRAINT check_mvt_tax_normalization_integrity CHECK");
    expect(migrationSql).toContain("tax_mode <> 'unknown' OR tier_normalized_price_ex_tax IS NULL");

    // 3. Immutability trigger for market_volume_tiers
    expect(migrationSql).toContain("CREATE OR REPLACE FUNCTION public.trg_guard_market_volume_tier_immutability");
    expect(migrationSql).toContain("CREATE TRIGGER trg_market_volume_tiers_guard_immutability");
    expect(migrationSql).toContain("BEFORE UPDATE OR DELETE ON public.market_volume_tiers");

    // 4. market_tenant_configs table with RLS
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS public.market_tenant_configs");
    expect(migrationSql).toContain("CONSTRAINT check_mtc_pricing_comparison_mode CHECK");
    expect(migrationSql).toContain("CONSTRAINT check_mtc_catch_weight_policy CHECK");
    expect(migrationSql).toContain("ALTER TABLE public.market_tenant_configs ENABLE ROW LEVEL SECURITY");
    expect(migrationSql).toContain("CREATE POLICY market_tenant_configs_read_auth");
    expect(migrationSql).toContain("CREATE POLICY market_tenant_configs_insert_staff");
    expect(migrationSql).toContain("CREATE POLICY market_tenant_configs_update_staff");
  });

  it("ensures PR2B rollback SQL script is fail-closed and prevents silent data loss", () => {
    const rollbackSql = fs.readFileSync(rollbackPath, "utf8");

    expect(rollbackSql).toContain("v_tenant_configs_count bigint := 0");
    expect(rollbackSql).toContain("v_pr2b_products_count bigint := 0");
    expect(rollbackSql).toContain("v_pr2b_tiers_count bigint := 0");
    expect(rollbackSql).toContain("RAISE EXCEPTION");
    expect(rollbackSql).toContain("DROP TRIGGER IF EXISTS trg_market_volume_tiers_guard_immutability");
    expect(rollbackSql).toContain("DROP TABLE IF EXISTS public.market_tenant_configs CASCADE");
  });

  describe("PriceNormalizer.normalizeVolumeTier (D-010 Enforcement)", () => {
    it("returns tierNormalizedPriceExTax as NULL when tax_mode is unknown", () => {
      const result = PriceNormalizer.normalizeVolumeTier({
        minQuantity: 10,
        tierQuantityUnit: "kg",
        tierPriceRaw: 50.0,
        taxMode: "unknown",
        parentStandardQuantity: 10,
      });

      expect(result.tierPriceExTax).toBeNull();
      expect(result.tierNormalizedPriceExTax).toBeNull();
      expect(result.normalizationStatus).toBe("tax_unknown");
      expect(result.taxMode).toBe("unknown");
    });

    it("returns tierNormalizedPriceExTax as NULL when inc_tax lacks tax_rate", () => {
      const result = PriceNormalizer.normalizeVolumeTier({
        minQuantity: 5,
        tierQuantityUnit: "pack",
        tierPriceRaw: 21.4,
        taxMode: "inc_tax",
        taxRate: null,
      });

      expect(result.tierPriceExTax).toBeNull();
      expect(result.tierNormalizedPriceExTax).toBeNull();
      expect(result.normalizationStatus).toBe("tax_rate_missing");
    });

    it("computes accurate ex-tax tier price and unit price with valid tax rate (e.g. 7% IGIC)", () => {
      const result = PriceNormalizer.normalizeVolumeTier({
        minQuantity: 20,
        tierQuantityUnit: "kg",
        tierPriceRaw: 107.0, // 107 inc tax with 7% -> 100 ex tax
        taxMode: "inc_tax",
        taxRate: 0.07,
        parentStandardQuantity: 20, // 20 kg
      });

      expect(result.tierPriceExTax).toBe(100.0);
      expect(result.tierNormalizedPriceExTax).toBe(5.0); // 100 / 20 = 5.0 €/kg
      expect(result.normalizationStatus).toBe("computed");
    });

    it("handles ex_tax tier prices correctly without modifying raw price", () => {
      const result = PriceNormalizer.normalizeVolumeTier({
        minQuantity: 50,
        tierQuantityUnit: "unit",
        tierPriceRaw: 150.0,
        taxMode: "ex_tax",
        taxRate: 0.1,
        parentStandardQuantity: 50,
      });

      expect(result.tierPriceExTax).toBe(150.0);
      expect(result.tierNormalizedPriceExTax).toBe(3.0); // 150 / 50 = 3 €/unit
      expect(result.normalizationStatus).toBe("computed");
    });

    it("inherits taxMode and taxRate from parent observation when omitted on tier", () => {
      const result = PriceNormalizer.normalizeVolumeTier({
        minQuantity: 100,
        tierPriceRaw: 200.0,
        parentTaxMode: "inc_tax",
        parentTaxRate: 0.21,
        parentStandardQuantity: 100,
      });

      expect(result.taxMode).toBe("inc_tax");
      expect(result.taxRate).toBe(0.21);
      expect(result.tierPriceExTax).toBe(165.2893);
      expect(result.tierNormalizedPriceExTax).toBe(1.6529);
      expect(result.normalizationStatus).toBe("computed");
    });
  });

  describe("PriceNormalizer.calculateLandedCost (Landed Cost vs Origin Price)", () => {
    it("returns origin price directly when comparison mode is 'origin_price'", () => {
      const result = PriceNormalizer.calculateLandedCost(
        {
          normalizedPriceExTax: 10.0,
          freightInclusion: "excluded",
          freightCostRaw: 25.0,
          batchQuantity: 50,
        },
        "origin_price",
      );

      expect(result.comparisonMode).toBe("origin_price");
      expect(result.originPriceExTax).toBe(10.0);
      expect(result.landedCostExTax).toBe(10.0);
      expect(result.freightSurchargePerUnit).toBe(0);
    });

    it("applies zero surcharge when freight is included in price", () => {
      const result = PriceNormalizer.calculateLandedCost({
        normalizedPriceExTax: 8.5,
        freightInclusion: "included",
      });

      expect(result.comparisonMode).toBe("landed_cost");
      expect(result.landedCostExTax).toBe(8.5);
      expect(result.isFreightExempt).toBe(true);
      expect(result.freightStatus).toBe("included");
    });

    it("recognizes free freight threshold reached", () => {
      const result = PriceNormalizer.calculateLandedCost({
        normalizedPriceExTax: 12.0,
        freightInclusion: "free_above_threshold",
        freeFreightMinOrderAmount: 300.0,
        orderAmount: 350.0,
      });

      expect(result.landedCostExTax).toBe(12.0);
      expect(result.isFreightExempt).toBe(true);
      expect(result.freightStatus).toBe("free_threshold_reached");
    });

    it("apportions freight surcharge per unit when below threshold or freight excluded", () => {
      const result = PriceNormalizer.calculateLandedCost({
        normalizedPriceExTax: 5.0,
        freightInclusion: "excluded",
        freightCostRaw: 40.0,
        batchQuantity: 200, // 40 € / 200 units = 0.20 €/unit surcharge
      });

      expect(result.originPriceExTax).toBe(5.0);
      expect(result.freightSurchargePerUnit).toBe(0.2);
      expect(result.landedCostExTax).toBe(5.2);
      expect(result.freightStatus).toBe("surcharged");
    });

    it("flags unknown freight when freight is excluded but no freight cost is available", () => {
      const result = PriceNormalizer.calculateLandedCost({
        normalizedPriceExTax: 7.0,
        freightInclusion: "excluded",
      });

      expect(result.originPriceExTax).toBe(7.0);
      expect(result.landedCostExTax).toBe(7.0);
      expect(result.freightSurchargePerUnit).toBeNull();
      expect(result.freightStatus).toBe("unknown_freight");
    });
  });

  describe("Catch-Weight Product Handling in resolvePhysicalPack", () => {
    it("allows deviation between pack count x inner quantity and net content when isCatchWeight is true under allow_variable_kg policy", () => {
      // e.g. 2 pieces nominally ~2.5 kg each, but actual box net weight is 5.8 kg (+16% variance)
      const resolved = resolvePhysicalPack({
        packPresentation: "box",
        packCount: 2,
        unitContentQty: 2.5,
        unitContentUnit: "kg",
        netContentQty: 5.8,
        netContentUnit: "kg",
        isCatchWeight: true,
        catchWeightPolicy: "allow_variable_kg",
      });

      expect(resolved.hasCatchWeightDeviation).toBe(true);
      expect(resolved.standardQuantity).toBe(5.8);
      expect(resolved.standardUnit).toBe("kg");
      expect(resolved.normalizedUnit).toBe("EUR_PER_KG");
      expect(resolved.measurementDimension).toBe("mass");
    });

    it("rejects deviation between pack dimensions when tenant policy is strict_nominal_pack even if isCatchWeight is true", () => {
      expect(() => {
        resolvePhysicalPack({
          packPresentation: "box",
          packCount: 2,
          unitContentQty: 2.5,
          unitContentUnit: "kg",
          netContentQty: 5.8,
          netContentUnit: "kg",
          isCatchWeight: true,
          catchWeightPolicy: "strict_nominal_pack",
        });
      }).toThrow(/Pack consistency mismatch/);
    });

    it("rejects deviation when product is not catch-weight (default isCatchWeight = false)", () => {
      expect(() => {
        resolvePhysicalPack({
          packPresentation: "box",
          packCount: 6,
          unitContentQty: 1.0,
          unitContentUnit: "l",
          netContentQty: 6.5, // 6.5 L vs 6.0 L -> >0.5% tolerance
          netContentUnit: "l",
          isCatchWeight: false,
        });
      }).toThrow(/Pack consistency mismatch/);
    });
  });

  describe("CSV Catalog Parser & Ingestion Service without 1 kg Fallback", () => {
    it("normalizes header aliases for is_catch_weight and taric_code", () => {
      const csv = `proveedor,producto,precio,cantidad,unidad,peso_variable,codigo_arancelario\nMakro,Solomillo Vacuno,24.50,1,kg,si,02013000\n`;
      const parsed = CsvCatalogParser.parse(csv);

      expect(parsed.headers).toContain("is_catch_weight");
      expect(parsed.headers).toContain("taric_code");
      expect(parsed.rows[0].data.is_catch_weight).toBe("si");
      expect(parsed.rows[0].data.taric_code).toBe("02013000");
    });

    it("quarantines rows missing physical specification without defaulting to 1 kg", async () => {
      const repo = new InMemoryMarketRepository();
      const service = new MarketCatalogIngestionService(repo);

      // Missing quantity and unit
      const csv = `proveedor,producto,precio\nMakro,Tomate Canario,3.50\n`;
      const report = await service.ingestCsv(csv, {
        importedBy: "00000000-0000-0000-0000-000000000001",
      });

      expect(report.quarantinedCount).toBe(1);
      expect(report.quarantinedRows[0].reason).toContain("INVALID_PHYSICAL_SPEC");
      expect(report.validCount).toBe(0);
    });

    it("quarantines rows with invalid TARIC code (e.g. non-numeric)", async () => {
      const repo = new InMemoryMarketRepository();
      const service = new MarketCatalogIngestionService(repo);

      const csv = `proveedor,producto,precio,cantidad,unidad,taric\nMakro,Aceite Oliva,12.00,5,l,INVALID-TARIC-ABC\n`;
      const report = await service.ingestCsv(csv, {
        importedBy: "00000000-0000-0000-0000-000000000001",
      });

      expect(report.quarantinedCount).toBe(1);
      expect(report.quarantinedRows[0].reason).toContain("Invalid TARIC code");
    });

    it("persists catch-weight and TARIC code in market products upon successful ingestion", async () => {
      const repo = new InMemoryMarketRepository();
      const service = new MarketCatalogIngestionService(repo);

      const csv = `proveedor,producto,precio,cantidad,unidad,peso_variable,taric\nMakro,Lomo Cerdo Ibérico,18.00,10,kg,true,02031955\n`;
      const report = await service.ingestCsv(csv, {
        importedBy: "00000000-0000-0000-0000-000000000001",
      });

      expect(report.validCount).toBe(1);
      expect(report.quarantinedCount).toBe(0);

      const product = await repo.findProductByName("src-makro", "Lomo Cerdo Ibérico");
      expect(product).not.toBeNull();
      expect(product?.isCatchWeight).toBe(true);
      expect(product?.taricCode).toBe("02031955");
    });
  });

  describe("Tenant Configuration Persistence in Repository", () => {
    it("can save and retrieve tenant market intelligence config", async () => {
      const repo = new InMemoryMarketRepository();
      const tenantId = "11111111-2222-3333-4444-555555555555";

      const initial = await repo.getTenantConfig(tenantId);
      expect(initial).toBeNull();

      const config: MarketTenantConfig = {
        tenantId,
        pricingComparisonMode: "origin_price",
        catchWeightPolicy: "strict_nominal_pack",
      };

      await repo.saveTenantConfig(config);

      const retrieved = await repo.getTenantConfig(tenantId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.pricingComparisonMode).toBe("origin_price");
      expect(retrieved?.catchWeightPolicy).toBe("strict_nominal_pack");
    });
  });
});
