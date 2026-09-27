import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CR-COST-07B Phase DDL & Migration Contract Verification', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260927210000_cr_cost_07b_production_and_operational_engine.sql'
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    'supabase/migrations/rollback/20260927210000_cr_cost_07b_production_and_operational_engine.rollback.sql'
  );

  it('verifies CR-COST-07B migration and rollback SQL files exist', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it('defines study_operation_configs and study_scenarios with constraints and checks', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. study_operation_configs
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_operation_configs');
    expect(sql).toContain('version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT uq_study_op_config_version UNIQUE (version_id)');
    expect(sql).toContain('CONSTRAINT check_op_energy_method CHECK');
    expect(sql).toContain("'QUANTITATIVE', 'PERCENTAGE', 'MANUAL_FLAT', 'NOT_APPLICABLE', 'UNCONFIGURED'");
    expect(sql).toContain('CONSTRAINT check_op_packaging_mode CHECK');
    expect(sql).toContain("'CONFIGURED', 'NOT_APPLICABLE', 'UNCONFIGURED'");

    // 2. study_scenarios
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_scenarios');
    expect(sql).toContain('version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT uq_study_scenarios_version_demand UNIQUE (version_id, scenario_demand_units)');
    expect(sql).toContain('CONSTRAINT check_scenario_demand CHECK (scenario_demand_units > 0)');
    expect(sql).toContain('CONSTRAINT check_scenario_batches CHECK (batches_required > 0)');
    expect(sql).toContain('CONSTRAINT check_scenario_units CHECK (units_produced >= scenario_demand_units)');
    expect(sql).toContain('CONSTRAINT check_scenario_surplus CHECK (surplus_units >= 0)');
    expect(sql).toContain('CONSTRAINT check_scenario_surplus_status CHECK');
    expect(sql).toContain("'UNCONFIGURED'");
    expect(sql).toContain("'STOCK_REFRIGERADO'");
    expect(sql).toContain("'STOCK_CONGELADO'");
    expect(sql).toContain("'VENTA_POSTERIOR'");
    expect(sql).toContain("'MERMA_DESPERDICIO'");
    expect(sql).toContain("'CONSUMO_INTERNO'");
  });

  it('enforces RLS and tenancy isolation on both tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ALTER TABLE public.study_operation_configs ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.study_scenarios ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY study_op_configs_tenant_isolation ON public.study_operation_configs');
    expect(sql).toContain('CREATE POLICY study_scenarios_tenant_isolation ON public.study_scenarios');
  });

  it('verifies rollback drops in reverse foreign key order', () => {
    const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

    const scenariosIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.study_scenarios');
    const configsIdx = rollbackSql.indexOf('DROP TABLE IF EXISTS public.study_operation_configs');

    expect(scenariosIdx).toBeGreaterThan(-1);
    expect(configsIdx).toBeGreaterThan(-1);
    expect(scenariosIdx).toBeLessThan(configsIdx);
  });
});
