-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR4: INGESTION BATCHES, AUDITABILITY & SAFE REVOCATION
-- Additive migration on top of PR2B (20261112230000_cr_cost_05_pr2b_physical_fiscal_tiers.sql).
-- Scope: PR4 ONLY — Catalog/invoice ingestion batches, quarantine persistence,
-- observation linkage, and non-destructive revocation.
-- ============================================================================

-- 1. Create table for catalog and invoice ingestion batches
CREATE TABLE IF NOT EXISTS public.market_catalog_ingestion_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES public.market_sources(id) ON DELETE RESTRICT,
  batch_type text NOT NULL,
  file_name text NULL,
  file_mime_type text NULL,
  file_checksum_sha256 text NULL,
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  quarantined_rows integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  quarantine_payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  imported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz NULL,
  revoked_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  revocation_reason text NULL,
  CONSTRAINT check_mcib_batch_type CHECK (
    batch_type IN ('csv_catalog', 'b2b_invoice_pdf', 'b2b_document_image', 'manual_entry', 'authorized_feed')
  ),
  CONSTRAINT check_mcib_status CHECK (
    status IN ('processing', 'completed', 'partial_quarantine', 'failed', 'revoked')
  ),
  CONSTRAINT check_mcib_total_rows CHECK (total_rows >= 0),
  CONSTRAINT check_mcib_valid_rows CHECK (valid_rows >= 0),
  CONSTRAINT check_mcib_quarantined_rows CHECK (quarantined_rows >= 0),
  CONSTRAINT check_mcib_created_count CHECK (created_count >= 0),
  CONSTRAINT check_mcib_updated_count CHECK (updated_count >= 0)
);

-- 2. Link observations to ingestion batch
ALTER TABLE public.market_price_observations
  ADD COLUMN IF NOT EXISTS ingestion_batch_id uuid NULL REFERENCES public.market_catalog_ingestion_batches(id) ON DELETE SET NULL;

-- 3. Create performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_market_price_obs_batch
  ON public.market_price_observations(ingestion_batch_id);

CREATE INDEX IF NOT EXISTS idx_market_catalog_ingestion_batches_owner
  ON public.market_catalog_ingestion_batches(owner_tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_catalog_ingestion_batches_checksum
  ON public.market_catalog_ingestion_batches(file_checksum_sha256);

-- 4. Enable Row Level Security
ALTER TABLE public.market_catalog_ingestion_batches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.market_catalog_ingestion_batches TO authenticated;
GRANT ALL ON public.market_catalog_ingestion_batches TO service_role;

DROP POLICY IF EXISTS market_catalog_ingestion_batches_read ON public.market_catalog_ingestion_batches;
CREATE POLICY market_catalog_ingestion_batches_read ON public.market_catalog_ingestion_batches
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR (
      public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS market_catalog_ingestion_batches_insert ON public.market_catalog_ingestion_batches;
CREATE POLICY market_catalog_ingestion_batches_insert ON public.market_catalog_ingestion_batches
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      owner_tenant_id IS NULL
      AND public.is_saas_admin(auth.uid())
    )
    OR (
      owner_tenant_id IS NOT NULL
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
  );

DROP POLICY IF EXISTS market_catalog_ingestion_batches_update ON public.market_catalog_ingestion_batches;
CREATE POLICY market_catalog_ingestion_batches_update ON public.market_catalog_ingestion_batches
  FOR UPDATE TO authenticated
  USING (
    (
      owner_tenant_id IS NULL
      AND public.is_saas_admin(auth.uid())
    )
    OR (
      owner_tenant_id IS NOT NULL
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
  )
  WITH CHECK (
    (
      owner_tenant_id IS NULL
      AND public.is_saas_admin(auth.uid())
    )
    OR (
      owner_tenant_id IS NOT NULL
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
  );

DROP POLICY IF EXISTS market_catalog_ingestion_batches_delete ON public.market_catalog_ingestion_batches;
CREATE POLICY market_catalog_ingestion_batches_delete ON public.market_catalog_ingestion_batches
  FOR DELETE TO authenticated
  USING (
    public.is_saas_admin(auth.uid())
  );
