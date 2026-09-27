import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CR-COST-05 Phase 3 DDL & Migration Contract Verification', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260927120000_food_market_intelligence_foundation.sql'
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    'supabase/migrations/rollback/20260927120000_food_market_intelligence_foundation.rollback.sql'
  );

  it('verifies migration and rollback SQL files exist', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it('defines all 5 tables with correct schema, constraints, and tenancy scoping', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. market_sources
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.market_sources');
    expect(sql).toContain('CONSTRAINT check_source_type');
    expect(sql).toContain('CONSTRAINT check_source_tax_mode');
    expect(sql).toContain('CONSTRAINT check_source_region');

    // 2. market_products
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.market_products');
    expect(sql).toContain('CONSTRAINT uq_market_products_source_sku UNIQUE (source_id, external_sku)');
    expect(sql).toContain('CONSTRAINT check_mp_thermal_state');
    expect(sql).toContain('CONSTRAINT check_mp_standard_unit');

    // 3. market_price_observations (Append-only & Idempotent)
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.market_price_observations');
    expect(sql).toContain('CONSTRAINT uq_market_price_obs_fingerprint UNIQUE (fingerprint)');
    expect(sql).toContain('CONSTRAINT check_mpo_price_raw CHECK (price_raw >= 0)');
    expect(sql).toContain('CONSTRAINT check_mpo_normalized_price');
    expect(sql).toContain('CONSTRAINT check_mpo_tax_rate');
    expect(sql).toContain('CONSTRAINT check_mpo_unit');

    // 4. market_volume_tiers
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.market_volume_tiers');
    expect(sql).toContain('CONSTRAINT check_mvt_min_qty');

    // 5. product_mappings (Tenant Isolated)
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.product_mappings');
    expect(sql).toContain('tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE');
    expect(sql).toContain('tenant_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id)');
    expect(sql).toContain(
      'CONSTRAINT uq_product_mapping_tenant_ingredient_product UNIQUE (tenant_id, tenant_ingredient_id, market_product_id)'
    );
    expect(sql).toContain('CONSTRAINT check_pm_confidence');
    expect(sql).toContain('CONSTRAINT check_pm_status');
    expect(sql).toContain('CONSTRAINT check_pm_grade');
  });

  it('verifies append-only immutability trigger guard', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.trg_guard_market_observation_immutability()');
    expect(sql).toContain('TG_OP = \'DELETE\'');
    expect(sql).toContain('Historical market price observations are strictly append-only and cannot be deleted');
    expect(sql).toContain('TG_OP = \'UPDATE\'');
    expect(sql).toContain('Economic price facts in market_price_observations are immutable');
    expect(sql).toContain('CREATE TRIGGER trg_market_price_obs_immutability');
  });

  it('enforces RLS on all 5 tables with strict tenant isolation and authenticated access', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Verify RLS enabled on all tables
    expect(sql).toContain('ALTER TABLE public.market_sources ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.market_price_observations ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.market_volume_tiers ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY');

    // Core read policies
    expect(sql).toContain('CREATE POLICY market_sources_read_auth ON public.market_sources');
    expect(sql).toContain('CREATE POLICY market_products_read_auth ON public.market_products');
    expect(sql).toContain('CREATE POLICY market_price_obs_read_auth ON public.market_price_observations');

    // Append-only permission grant (SELECT, INSERT only; NO UPDATE or DELETE granted to authenticated)
    expect(sql).toContain('GRANT SELECT, INSERT ON public.market_price_observations TO authenticated');
    expect(sql).not.toContain('GRANT UPDATE ON public.market_price_observations TO authenticated');
    expect(sql).not.toContain('GRANT DELETE ON public.market_price_observations TO authenticated');

    // Private tenant mapping RLS
    expect(sql).toContain('CREATE POLICY product_mappings_tenant_read ON public.product_mappings');
    expect(sql).toContain('public.is_tenant_member(tenant_id)');
    expect(sql).toContain('CREATE POLICY product_mappings_tenant_write ON public.product_mappings');
    expect(sql).toContain('public.has_any_staff_role(auth.uid(), tenant_id)');
  });

  it('verifies initial seed data for the 4 registered market sources', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain("'src-makro', 'Makro', 'b2b_wholesale'");
    expect(sql).toContain("'src-gmcash', 'GM Cash', 'cash_carry'");
    expect(sql).toContain("'src-5oceanos', '5 Océanos', 'regional_specialist'");
    expect(sql).toContain("'src-mercadona', 'Mercadona', 'retail_ceiling'");
  });

  it('verifies rollback script cleans up in strict foreign key order', () => {
    const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

    expect(rollbackSql).toContain('DROP TRIGGER IF EXISTS trg_market_price_obs_immutability');
    expect(rollbackSql).toContain('DROP FUNCTION IF EXISTS public.trg_guard_market_observation_immutability()');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.product_mappings CASCADE');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.market_volume_tiers CASCADE');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.market_price_observations CASCADE');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.market_products CASCADE');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.market_sources CASCADE');
  });
});
