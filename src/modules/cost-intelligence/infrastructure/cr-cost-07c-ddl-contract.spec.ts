import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CR-COST-07C Phase DDL & Migration Contract Verification', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260927220000_cr_cost_07c_decision_intelligence.sql'
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    'supabase/migrations/rollback/20260927220000_cr_cost_07c_decision_intelligence.rollback.sql'
  );

  it('verifies CR-COST-07C migration and rollback SQL files exist', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it('defines study_decisions with constraints, checks, and foreign key cascades', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.study_decisions');
    expect(sql).toContain('version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE');
    expect(sql).toContain('CONSTRAINT uq_study_decisions_version UNIQUE (version_id)');
    expect(sql).toContain("'APPROVED_FOR_MENU'");
    expect(sql).toContain("'REJECTED_MARGIN_TOO_LOW'");
    expect(sql).toContain("'REJECTED_CAPACITY_LIMIT'");
    expect(sql).toContain("'POSTPONED_NEEDS_RECIPE_REVISION'");
    expect(sql).toContain("'CUSTOM'");
    expect(sql).toContain("'APPROVED', 'REJECTED', 'POSTPONED'");
  });

  it('enforces RLS and tenancy isolation on study_decisions', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ALTER TABLE public.study_decisions ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY study_decisions_tenant_isolation ON public.study_decisions');
    expect(sql).toContain('JOIN public.economic_studies es ON sv.study_id = es.id');
    expect(sql).toContain('es.tenant_id = auth.uid()');
  });

  it('verifies rollback drops policy and table cleanly and idempotently', () => {
    const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

    expect(rollbackSql).toContain('DROP POLICY IF EXISTS study_decisions_tenant_isolation ON public.study_decisions');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.study_decisions CASCADE');
  });
});
