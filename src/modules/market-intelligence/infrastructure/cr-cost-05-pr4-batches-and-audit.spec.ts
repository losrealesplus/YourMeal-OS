import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CR-COST-05 PR4: Auditable Ingestion Batches, Constraints & Rollback Safety', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261112240000_cr_cost_05_pr4_ingestion_batches_and_audit.sql'
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    'supabase/migrations/rollback/20261112240000_cr_cost_05_pr4_ingestion_batches_and_audit_down.sql'
  );

  it('verifies PR4 migration and rollback SQL files exist on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it('declares market_catalog_ingestion_batches table with auditable columns and check constraints', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.market_catalog_ingestion_batches');
    expect(sql).toContain('id uuid PRIMARY KEY DEFAULT gen_random_uuid()');
    expect(sql).toContain('owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE');
    expect(sql).toContain('batch_type IN (\'csv_catalog\', \'b2b_invoice_pdf\', \'b2b_document_image\', \'manual_entry\', \'authorized_feed\')');
    expect(sql).toContain('status IN (\'processing\', \'completed\', \'partial_quarantine\', \'failed\', \'revoked\')');
    expect(sql).toContain('file_checksum_sha256 text NULL');
    expect(sql).toContain("quarantine_payload jsonb NOT NULL DEFAULT '[]'::jsonb");
    expect(sql).toContain('imported_by uuid NOT NULL REFERENCES auth.users(id)');
  });

  it('links market_price_observations to batches via nullable FK and index', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain(
      'ADD COLUMN IF NOT EXISTS ingestion_batch_id uuid NULL REFERENCES public.market_catalog_ingestion_batches(id) ON DELETE SET NULL'
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_market_price_obs_batch\n  ON public.market_price_observations(ingestion_batch_id)'
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_market_catalog_ingestion_batches_owner\n  ON public.market_catalog_ingestion_batches(owner_tenant_id, created_at DESC)'
    );
    expect(sql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_market_catalog_ingestion_batches_checksum\n  ON public.market_catalog_ingestion_batches(file_checksum_sha256)'
    );
  });

  it('applies PR3A-aligned multi-tenant RLS policies on batches', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ALTER TABLE public.market_catalog_ingestion_batches ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY market_catalog_ingestion_batches_read');
    expect(sql).toContain('CREATE POLICY market_catalog_ingestion_batches_insert');
    expect(sql).toContain('CREATE POLICY market_catalog_ingestion_batches_update');
    expect(sql).toContain('CREATE POLICY market_catalog_ingestion_batches_delete');

    // Scoped permissions: SaaS admin for public (owner_tenant_id IS NULL), tenant user with cost intelligence access for private
    expect(sql).toContain('public.is_saas_admin(auth.uid())');
    expect(sql).toContain('public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)');
  });

  it('enforces fail-closed safety preflight in rollback script', () => {
    const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');

    expect(rollbackSql).toContain('market_catalog_ingestion_batches');
    expect(rollbackSql).toContain('ingestion_batch_id');
    expect(rollbackSql).toContain('restrict_violation');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS public.market_catalog_ingestion_batches');
  });
});
