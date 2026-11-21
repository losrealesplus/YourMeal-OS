-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR4 ROLLBACK (FAIL-CLOSED)
-- Reverts 20261112240000_cr_cost_05_pr4_ingestion_batches_and_audit.sql
-- ============================================================================

DO $$
BEGIN
  -- 1. Preflight Fail-Closed Guard: Abort if batches exist
  IF EXISTS (SELECT 1 FROM public.market_catalog_ingestion_batches LIMIT 1) THEN
    RAISE EXCEPTION 'CR-COST-05 PR4 Rollback Aborted: market_catalog_ingestion_batches contains active records. Forward-only remediation required.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  -- 2. Preflight Fail-Closed Guard: Abort if observations reference batches
  IF EXISTS (SELECT 1 FROM public.market_price_observations WHERE ingestion_batch_id IS NOT NULL LIMIT 1) THEN
    RAISE EXCEPTION 'CR-COST-05 PR4 Rollback Aborted: market_price_observations contains references to ingestion_batch_id. Forward-only remediation required.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  -- 3. Drop Policies
  DROP POLICY IF EXISTS market_catalog_ingestion_batches_delete ON public.market_catalog_ingestion_batches;
  DROP POLICY IF EXISTS market_catalog_ingestion_batches_update ON public.market_catalog_ingestion_batches;
  DROP POLICY IF EXISTS market_catalog_ingestion_batches_insert ON public.market_catalog_ingestion_batches;
  DROP POLICY IF EXISTS market_catalog_ingestion_batches_read ON public.market_catalog_ingestion_batches;

  -- 4. Drop Indexes
  DROP INDEX IF EXISTS public.idx_market_catalog_ingestion_batches_checksum;
  DROP INDEX IF EXISTS public.idx_market_catalog_ingestion_batches_owner;
  DROP INDEX IF EXISTS public.idx_market_price_obs_batch;

  -- 5. Drop Column from market_price_observations
  ALTER TABLE public.market_price_observations
    DROP COLUMN IF EXISTS ingestion_batch_id;

  -- 6. Drop Table
  DROP TABLE IF EXISTS public.market_catalog_ingestion_batches;
END $$;
