-- ============================================================================
-- ROLLBACK: CR-COST-05 PR2B PHYSICAL FORMATS, FISCAL METADATA & VOLUME TIERS EXTENSION
-- Fail-closed rollback to PR3A (20261112220000_cr_cost_05_pr3a_multi_tenant_security.sql).
--
-- IMPORTANT POLICY (CR-COST-05):
--   This rollback MUST NEVER silently destroy recorded PR2B data.
--   Once real PR2B data is recorded in production or staging, remediation MUST
--   be forward-only; this script intentionally aborts (RAISE EXCEPTION) if any
--   PR2B tenant configs, catch-weight products, TARIC classifications, or
--   extended volume tiers exist.
-- ============================================================================

DO $$
DECLARE
  v_tenant_configs_count bigint := 0;
  v_pr2b_products_count bigint := 0;
  v_pr2b_tiers_count bigint := 0;
BEGIN
  IF to_regclass('public.market_tenant_configs') IS NOT NULL THEN
    SELECT count(*) INTO v_tenant_configs_count
    FROM public.market_tenant_configs;
  END IF;

  IF to_regclass('public.market_products') IS NOT NULL THEN
    SELECT count(*) INTO v_pr2b_products_count
    FROM public.market_products
    WHERE is_catch_weight = true
       OR taric_code IS NOT NULL;
  END IF;

  IF to_regclass('public.market_volume_tiers') IS NOT NULL THEN
    SELECT count(*) INTO v_pr2b_tiers_count
    FROM public.market_volume_tiers
    WHERE (tax_mode IS NOT NULL AND tax_mode <> 'unknown')
       OR tier_price_raw IS NOT NULL
       OR (tier_quantity_unit IS NOT NULL AND tier_quantity_unit <> 'unit')
       OR tax_rate IS NOT NULL
       OR tier_normalized_price_ex_tax IS NULL;
  END IF;

  IF v_tenant_configs_count > 0 THEN
    RAISE EXCEPTION 'CR-COST-05 Rollback Aborted (Fail-Closed): public.market_tenant_configs contains % tenant configuration rows. Cannot drop without destroying tenant operational settings.',
      v_tenant_configs_count
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_pr2b_products_count > 0 THEN
    RAISE EXCEPTION 'CR-COST-05 Rollback Aborted (Fail-Closed): public.market_products contains % products using PR2B features (is_catch_weight or taric_code). Cannot drop columns without destroying catalog data.',
      v_pr2b_products_count
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_pr2b_tiers_count > 0 THEN
    RAISE EXCEPTION 'CR-COST-05 Rollback Aborted (Fail-Closed): public.market_volume_tiers contains % tiers using PR2B extended fiscal/unit metadata or D-010 null prices. Cannot drop columns without data loss.',
      v_pr2b_tiers_count
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

-- 1. Drop trigger and function on market_volume_tiers
DROP TRIGGER IF EXISTS trg_market_volume_tiers_guard_immutability ON public.market_volume_tiers;
DROP FUNCTION IF EXISTS public.trg_guard_market_volume_tier_immutability();

-- 2. Drop market_tenant_configs and policies
DROP POLICY IF EXISTS market_tenant_configs_delete_admin ON public.market_tenant_configs;
DROP POLICY IF EXISTS market_tenant_configs_update_staff ON public.market_tenant_configs;
DROP POLICY IF EXISTS market_tenant_configs_insert_staff ON public.market_tenant_configs;
DROP POLICY IF EXISTS market_tenant_configs_read_auth ON public.market_tenant_configs;

DROP TABLE IF EXISTS public.market_tenant_configs CASCADE;

-- 3. Revert public.market_products extensions
DROP INDEX IF EXISTS public.idx_market_products_taric_code;
ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_taric_code;
ALTER TABLE public.market_products
  DROP COLUMN IF EXISTS taric_code,
  DROP COLUMN IF EXISTS is_catch_weight;

-- 4. Revert public.market_volume_tiers extensions
ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tax_normalization_integrity,
  DROP CONSTRAINT IF EXISTS check_mvt_tier_price,
  DROP CONSTRAINT IF EXISTS check_mvt_tax_rate,
  DROP CONSTRAINT IF EXISTS check_mvt_tax_mode,
  DROP CONSTRAINT IF EXISTS check_mvt_tier_price_raw,
  DROP CONSTRAINT IF EXISTS check_mvt_tier_quantity_unit;

ALTER TABLE public.market_volume_tiers
  DROP COLUMN IF EXISTS tax_rate,
  DROP COLUMN IF EXISTS tax_mode,
  DROP COLUMN IF EXISTS tier_price_raw,
  DROP COLUMN IF EXISTS tier_quantity_unit;

-- Restore original check_mvt_tier_price constraint
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tier_price CHECK (tier_normalized_price_ex_tax >= 0);

-- Restore NOT NULL on tier_normalized_price_ex_tax only if no nulls exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.market_volume_tiers WHERE tier_normalized_price_ex_tax IS NULL
  ) THEN
    ALTER TABLE public.market_volume_tiers
      ALTER COLUMN tier_normalized_price_ex_tax SET NOT NULL;
  END IF;
END;
$$;
