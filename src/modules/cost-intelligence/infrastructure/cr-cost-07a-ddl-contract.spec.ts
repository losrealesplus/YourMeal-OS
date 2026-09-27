import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CR-COST-07A Phase DDL & Migration Contract Verification', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260927200000_cr_cost_07a_economic_study_foundation.sql'
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    'supabase/migrations/rollback/20260927200000_cr_cost_07a_economic_study_foundation.rollback.sql'
  );

  it('verifies migration and rollback SQL files exist', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it('defines all 4 foundation tables with correct schema, constraints, and tenancy scoping', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. economic_studies
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.economic_studies');
    expect(sql).toContain('tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT check_study_status CHECK');
    expect(sql).toContain("'BORRADOR', 'EN_CONFIGURACION', 'LISTO_SIMULAR', 'ESTUDIADO', 'DECISION'");
    expect(sql).toContain('CONSTRAINT check_study_active_version CHECK (active_version_number >= 1)');

    // 2. study_versions
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_versions');
    expect(sql).toContain('study_id uuid NOT NULL REFERENCES public.economic_studies(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT uq_study_version_number UNIQUE (study_id, version_number)');
    expect(sql).toContain('CONSTRAINT check_study_version_status CHECK');
    expect(sql).toContain('CONSTRAINT check_version_surplus_dest CHECK');
    expect(sql).toContain("'UNCONFIGURED'");
    expect(sql).toContain("'STOCK_REFRIGERADO'");
    expect(sql).toContain("'STOCK_CONGELADO'");
    expect(sql).toContain("'VENTA_POSTERIOR'");
    expect(sql).toContain("'MERMA_DESPERDICIO'");
    expect(sql).toContain("'CONSUMO_INTERNO'");
    expect(sql).toContain('CONSTRAINT check_version_conclusion_tier CHECK');
    expect(sql).toContain("'CERTIFIED', 'CONDITIONED', 'INSUFFICIENT_DATA'");
    expect(sql).toContain('market_prices_snapshot jsonb NOT NULL DEFAULT');

    // 3. study_ingredients (with strict density and nullable trimming loss)
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_ingredients');
    expect(sql).toContain('version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT check_ingredient_gross_qty CHECK (gross_quantity > 0)');
    expect(sql).toContain('CONSTRAINT check_ingredient_gross_unit CHECK');
    expect(sql).toContain('CONSTRAINT check_ingredient_provenance CHECK');
    expect(sql).toContain("'REAL', 'OBSERVADO', 'MANUAL'");
    expect(sql).toContain('density_kg_per_l numeric(8,4)');
    expect(sql).toContain('piece_mass_kg numeric(8,4)');
    expect(sql).toContain('trimming_loss_pct numeric(5,2)');
    expect(sql).toContain('CONSTRAINT check_ingredient_density CHECK');
    expect(sql).toContain('CONSTRAINT check_ingredient_piece_mass CHECK');
    expect(sql).toContain(
      'CONSTRAINT check_ingredient_trimming_pct CHECK (\n    trimming_loss_pct IS NULL OR (trimming_loss_pct >= 0 AND trimming_loss_pct < 100)\n  )'
    );

    // 4. study_yield_stages
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_yield_stages');
    expect(sql).toContain('version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT uq_study_yield_stage_order UNIQUE (version_id, stage_order)');
    expect(sql).toContain('CONSTRAINT check_yield_stage_loss_pct CHECK');
    expect(sql).toContain('CONSTRAINT check_yield_stage_provenance CHECK');
  });

  it('enforces RLS on all 4 tables with strict tenant isolation', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ALTER TABLE public.economic_studies ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.study_versions ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.study_ingredients ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.study_yield_stages ENABLE ROW LEVEL SECURITY');

    expect(sql).toContain('CREATE POLICY economic_studies_tenant_isolation ON public.economic_studies');
    expect(sql).toContain('CREATE POLICY study_versions_tenant_isolation ON public.study_versions');
    expect(sql).toContain('CREATE POLICY study_ingredients_tenant_isolation ON public.study_ingredients');
    expect(sql).toContain('CREATE POLICY study_yield_stages_tenant_isolation ON public.study_yield_stages');
  });

  it('verifies rollback script cleans up in strict reverse foreign key order', () => {
    const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

    const yieldIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.study_yield_stages');
    const ingredientIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.study_ingredients');
    const versionIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.study_versions');
    const studyIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.economic_studies');

    expect(yieldIdx).toBeGreaterThan(-1);
    expect(ingredientIdx).toBeGreaterThan(-1);
    expect(versionIdx).toBeGreaterThan(-1);
    expect(studyIdx).toBeGreaterThan(-1);

    expect(yieldIdx).toBeLessThan(ingredientIdx);
    expect(ingredientIdx).toBeLessThan(versionIdx);
    expect(versionIdx).toBeLessThan(studyIdx);
  });
});
