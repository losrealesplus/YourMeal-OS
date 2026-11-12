import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("CR-COST-05 Block 2 (PR2): Physical Format, Geo Coverage & Fiscal Contract", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261112200000_cr_cost_05_pr2_physical_geo_fiscal_contract.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261112200000_cr_cost_05_pr2_physical_geo_fiscal_contract_down.sql",
  );

  it("verifies Block 2 migration and rollback SQL files exist", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it("defines establishments, delivery coverages, physical product format, and fiscal/commercial checks", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.market_establishments");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.market_delivery_coverages");

    expect(sql).toContain("ADD COLUMN IF NOT EXISTS gtin text NULL");
    expect(sql).toContain("CONSTRAINT check_mp_gtin_digits CHECK");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.cr_cost_05_unit_dimension");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.cr_cost_05_unit_factor");
    expect(sql).toContain("CONSTRAINT check_mp_pack_dimensions_compatible CHECK");
    expect(sql).toContain("CONSTRAINT check_mp_no_pack_double_multiplication CHECK");
    expect(sql).toContain("public.cr_cost_05_unit_factor(unit_content_unit)");
    expect(sql).toContain("public.cr_cost_05_unit_factor(net_content_unit)");
    expect(sql).toContain("ALTER COLUMN tax_rate DROP NOT NULL");
    expect(sql).toContain("ALTER COLUMN normalized_price_ex_tax DROP NOT NULL");
    expect(sql).toContain("CONSTRAINT check_mpo_tax_normalization_integrity CHECK");
    expect(sql).toContain("CONSTRAINT check_mpo_public_raw_payload_no_tenant_leak CHECK");
    expect(sql).toContain("aiem_status");
    expect(sql).toContain("freight_inclusion");
  });

  it("preserves RLS tenant isolation and strengthens immutability across Block 2 columns", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE POLICY market_establishments_read_auth");
    expect(sql).toContain("CREATE POLICY market_delivery_coverages_insert_staff");
    expect(sql).toContain("OLD.tax_regime IS DISTINCT FROM NEW.tax_regime");
    expect(sql).toContain("OLD.aiem_status IS DISTINCT FROM NEW.aiem_status");
    expect(sql).toContain(
      "GRANT UPDATE (valid_to, quality_status, promotion_status, promotion_valid_to, availability_status, raw_payload)",
    );
  });

  it("enforces fail-closed rollback without fabricating defaults or disabling immutability", () => {
    const downSql = fs.readFileSync(rollbackPath, "utf8");
    expect(downSql).toContain("Fail-Closed Rollback Aborted");
    expect(downSql).toContain("forward-only");
    expect(downSql).toContain("tax_mode = 'unknown'");
    expect(downSql).toContain("v_delivery_coverages_count");
    expect(downSql).toContain("v_establishments_count");
    expect(downSql).not.toContain("DISABLE TRIGGER");
    expect(downSql).not.toMatch(/\bUPDATE\s+public\.market_price_observations\b/i);
    expect(downSql).toContain("DROP TABLE IF EXISTS public.market_delivery_coverages CASCADE");
    expect(downSql).toContain("DROP TABLE IF EXISTS public.market_establishments CASCADE");
    expect(downSql).toContain("DROP FUNCTION IF EXISTS public.cr_cost_05_unit_factor(text)");
    expect(downSql).toContain("DROP FUNCTION IF EXISTS public.cr_cost_05_unit_dimension(text)");
    expect(downSql).toContain("ALTER COLUMN tax_rate SET NOT NULL");
  });
});
