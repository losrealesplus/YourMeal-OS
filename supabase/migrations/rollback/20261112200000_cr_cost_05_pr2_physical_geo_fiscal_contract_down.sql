-- ============================================================================
-- ROLLBACK: CR-COST-05 PR2 (BLOCK 2) PHYSICAL FORMATS, GEO COVERAGE & FISCAL METADATA
-- Fail-closed rollback to PR1 (20261112180000_cr_cost_05_pr1_integrity_and_rls.sql).
--
-- IMPORTANT POLICY (CR-COST-05):
--   This rollback MUST NEVER fabricate defaults, convert NULL/unknown values into
--   synthetic numbers/tax modes, or silently destroy recorded PR2 data.
--   Once real PR2 data is recorded in production or staging, remediation MUST
--   be forward-only; this script intentionally aborts (RAISE EXCEPTION) if any
--   PR2-only rows, non-representable observations, or PR2 metadata exist.
-- ============================================================================

DO $$
DECLARE
  v_delivery_coverages_count bigint := 0;
  v_establishments_count bigint := 0;
  v_pr2_sources_count bigint := 0;
  v_pr2_products_count bigint := 0;
  v_unrepresentable_obs_count bigint := 0;
  v_pr2_metadata_obs_count bigint := 0;
BEGIN
  IF to_regclass('public.market_delivery_coverages') IS NOT NULL THEN
    SELECT count(*) INTO v_delivery_coverages_count
    FROM public.market_delivery_coverages;
  END IF;

  IF to_regclass('public.market_establishments') IS NOT NULL THEN
    SELECT count(*) INTO v_establishments_count
    FROM public.market_establishments;
  END IF;

  IF to_regclass('public.market_sources') IS NOT NULL THEN
    SELECT count(*) INTO v_pr2_sources_count
    FROM public.market_sources
    WHERE provider_code IS NOT NULL
       OR country_code IS NOT NULL
       OR channel_type IS NOT NULL
       OR default_region NOT IN (
         'ES_TENERIFE_TF',
         'ES_GRAN_CANARIA_GC',
         'ES_CANARIAS_REGIONAL',
         'ES_PENINSULA_MAINLAND',
         'ES_NATIONAL'
       );
  END IF;

  IF to_regclass('public.market_products') IS NOT NULL THEN
    SELECT count(*) INTO v_pr2_products_count
    FROM public.market_products
    WHERE gtin IS NOT NULL
       OR origin IS NOT NULL
       OR pack_presentation IS NOT NULL
       OR pack_count IS NOT NULL
       OR unit_content_qty IS NOT NULL
       OR unit_content_unit IS NOT NULL
       OR net_content_qty IS NOT NULL
       OR net_content_unit IS NOT NULL
       OR drained_weight_qty IS NOT NULL
       OR drained_weight_unit IS NOT NULL
       OR density_kg_per_l IS NOT NULL
       OR (
         measurement_dimension IS NOT NULL
         AND measurement_dimension IS DISTINCT FROM (
           CASE standard_unit
             WHEN 'l' THEN 'volume'
             WHEN 'unit' THEN 'count'
             ELSE 'mass'
           END
         )
       );
  END IF;

  IF to_regclass('public.market_price_observations') IS NOT NULL THEN
    SELECT count(*) INTO v_unrepresentable_obs_count
    FROM public.market_price_observations
    WHERE tax_mode = 'unknown'
       OR tax_mode NOT IN ('ex_tax', 'inc_tax')
       OR tax_rate IS NULL
       OR normalized_price_ex_tax IS NULL
       OR valid_to IS NULL
       OR currency IS DISTINCT FROM 'EUR';

    SELECT count(*) INTO v_pr2_metadata_obs_count
    FROM public.market_price_observations
    WHERE observed_price_basis IS DISTINCT FROM 'unknown'
       OR normalization_basis IS DISTINCT FROM 'unknown'
       OR normalization_status IS DISTINCT FROM 'computed'
       OR establishment_id IS NOT NULL
       OR observation_country_code IS NOT NULL
       OR observation_subdivision_code IS NOT NULL
       OR observation_province_code IS NOT NULL
       OR observation_island_code IS NOT NULL
       OR observation_postal_code IS NOT NULL
       OR observed_channel IS DISTINCT FROM 'unknown'
       OR delivery_coverage_state IS DISTINCT FROM 'unknown'
       OR availability_status IS DISTINCT FROM 'unknown'
       OR validity_source IS DISTINCT FROM 'inferred_default'
       OR tax_regime IS DISTINCT FROM 'UNKNOWN'
       OR tax_rate_source IS DISTINCT FROM 'unknown'
       OR tax_rule_ref IS NOT NULL
       OR tax_effective_from IS NOT NULL
       OR tax_effective_to IS NOT NULL
       OR aiem_status IS DISTINCT FROM 'unknown'
       OR aiem_evidence IS NOT NULL
       OR aiem_rate IS NOT NULL
       OR aiem_amount_raw IS NOT NULL
       OR freight_inclusion IS DISTINCT FROM 'unknown'
       OR freight_cost_raw IS NOT NULL
       OR free_freight_min_order_amount IS NOT NULL
       OR min_order_qty IS NOT NULL
       OR min_order_unit IS NOT NULL
       OR promotion_condition IS NOT NULL
       OR promotion_valid_to IS NOT NULL;
  END IF;

  IF v_delivery_coverages_count > 0
     OR v_establishments_count > 0
     OR v_pr2_sources_count > 0
     OR v_pr2_products_count > 0
     OR v_unrepresentable_obs_count > 0
     OR v_pr2_metadata_obs_count > 0 THEN
    RAISE EXCEPTION 'CR-COST-05 PR2 Fail-Closed Rollback Aborted: found recorded PR2 or non-PR1-representable data (coverages=%, establishments=%, sources=%, products=%, unrepresentable_obs=%, metadata_obs=%). Once real PR2 data is recorded, remediation must be forward-only; refusing to fabricate defaults or destroy evidence.',
      v_delivery_coverages_count,
      v_establishments_count,
      v_pr2_sources_count,
      v_pr2_products_count,
      v_unrepresentable_obs_count,
      v_pr2_metadata_obs_count
      USING ERRCODE = 'object_not_in_prerequisite_state';
  END IF;
END
$$;

-- 1. Restore PR1 grants and trigger function on public.market_price_observations
REVOKE UPDATE ON public.market_price_observations FROM authenticated;
GRANT UPDATE (valid_to, quality_status, promotion_status, raw_payload)
  ON public.market_price_observations TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_guard_market_observation_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Historical market price observations are strictly append-only and cannot be deleted.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.price_raw IS DISTINCT FROM NEW.price_raw OR
       OLD.currency IS DISTINCT FROM NEW.currency OR
       OLD.normalized_price_ex_tax IS DISTINCT FROM NEW.normalized_price_ex_tax OR
       OLD.normalized_unit IS DISTINCT FROM NEW.normalized_unit OR
       OLD.tax_rate IS DISTINCT FROM NEW.tax_rate OR
       OLD.tax_mode IS DISTINCT FROM NEW.tax_mode OR
       OLD.observed_at IS DISTINCT FROM NEW.observed_at OR
       OLD.valid_from IS DISTINCT FROM NEW.valid_from OR
       OLD.region_code IS DISTINCT FROM NEW.region_code OR
       OLD.location_name IS DISTINCT FROM NEW.location_name OR
       OLD.capture_method IS DISTINCT FROM NEW.capture_method OR
       OLD.fingerprint IS DISTINCT FROM NEW.fingerprint OR
       OLD.market_product_id IS DISTINCT FROM NEW.market_product_id OR
       OLD.owner_tenant_id IS DISTINCT FROM NEW.owner_tenant_id OR
       OLD.imported_by IS DISTINCT FROM NEW.imported_by THEN
      RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Economic price facts in market_price_observations are immutable and cannot be updated.'
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Restore PR1 INSERT policy on public.market_price_observations
DROP POLICY IF EXISTS market_price_obs_insert_staff ON public.market_price_observations;
CREATE POLICY market_price_obs_insert_staff ON public.market_price_observations
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      imported_by IS NULL
      OR imported_by = auth.uid()
      OR public.is_saas_admin(auth.uid())
    )
    AND (
      (
        owner_tenant_id IS NULL
        AND public.is_saas_admin(auth.uid())
      )
      OR (
        owner_tenant_id IS NOT NULL
        AND public.is_tenant_member(owner_tenant_id)
        AND (
          public.has_any_staff_role(auth.uid(), owner_tenant_id)
          OR public.is_saas_admin(auth.uid())
        )
      )
    )
  );

-- 3. Drop PR2 constraints, indexes, and columns on public.market_price_observations
DROP INDEX IF EXISTS public.idx_market_price_obs_geo_availability;

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_public_raw_payload_no_tenant_leak,
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_commercial_terms,
  DROP CONSTRAINT IF EXISTS check_mpo_tax_normalization_integrity,
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_fiscal_contract,
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_geo_availability,
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_physical_basis;

ALTER TABLE public.market_price_observations
  DROP COLUMN IF EXISTS promotion_valid_to,
  DROP COLUMN IF EXISTS promotion_condition,
  DROP COLUMN IF EXISTS min_order_unit,
  DROP COLUMN IF EXISTS min_order_qty,
  DROP COLUMN IF EXISTS free_freight_min_order_amount,
  DROP COLUMN IF EXISTS freight_cost_raw,
  DROP COLUMN IF EXISTS freight_inclusion,
  DROP COLUMN IF EXISTS aiem_amount_raw,
  DROP COLUMN IF EXISTS aiem_rate,
  DROP COLUMN IF EXISTS aiem_evidence,
  DROP COLUMN IF EXISTS aiem_status,
  DROP COLUMN IF EXISTS tax_effective_to,
  DROP COLUMN IF EXISTS tax_effective_from,
  DROP COLUMN IF EXISTS tax_rule_ref,
  DROP COLUMN IF EXISTS tax_rate_source,
  DROP COLUMN IF EXISTS tax_regime,
  DROP COLUMN IF EXISTS validity_source,
  DROP COLUMN IF EXISTS availability_status,
  DROP COLUMN IF EXISTS delivery_coverage_state,
  DROP COLUMN IF EXISTS observed_channel,
  DROP COLUMN IF EXISTS observation_postal_code,
  DROP COLUMN IF EXISTS observation_island_code,
  DROP COLUMN IF EXISTS observation_province_code,
  DROP COLUMN IF EXISTS observation_subdivision_code,
  DROP COLUMN IF EXISTS observation_country_code,
  DROP COLUMN IF EXISTS establishment_id,
  DROP COLUMN IF EXISTS normalization_status,
  DROP COLUMN IF EXISTS normalization_basis,
  DROP COLUMN IF EXISTS observed_price_basis;

-- Restore strict PR1 constraints directly (safe without UPDATEs because preflight verified representability)
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_currency,
  ADD CONSTRAINT check_mpo_currency CHECK (currency = 'EUR');
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_tax_mode,
  ADD CONSTRAINT check_mpo_tax_mode CHECK (tax_mode IN ('ex_tax', 'inc_tax'));
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_tax_rate,
  ADD CONSTRAINT check_mpo_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 1.0);
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_normalized_price,
  ADD CONSTRAINT check_mpo_normalized_price CHECK (normalized_price_ex_tax >= 0);

ALTER TABLE public.market_price_observations
  ALTER COLUMN tax_rate SET DEFAULT 0.0,
  ALTER COLUMN tax_rate SET NOT NULL,
  ALTER COLUMN normalized_price_ex_tax SET NOT NULL,
  ALTER COLUMN valid_to SET NOT NULL;

-- 4. Drop PR2 additions on public.market_products and unit helper functions in strict dependency order
DROP INDEX IF EXISTS public.idx_market_products_gtin;
DROP TRIGGER IF EXISTS trg_market_products_sync_dimension ON public.market_products;
DROP FUNCTION IF EXISTS public.trg_sync_market_product_dimension();

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_no_pack_double_multiplication,
  DROP CONSTRAINT IF EXISTS check_mp_pack_dimensions_compatible,
  DROP CONSTRAINT IF EXISTS check_mp_unit_pairs,
  DROP CONSTRAINT IF EXISTS check_mp_pack_positive,
  DROP CONSTRAINT IF EXISTS check_mp_pack_presentation,
  DROP CONSTRAINT IF EXISTS check_mp_dimension_consistency,
  DROP CONSTRAINT IF EXISTS check_mp_gtin_digits;

DROP FUNCTION IF EXISTS public.cr_cost_05_unit_factor(text);
DROP FUNCTION IF EXISTS public.cr_cost_05_unit_dimension(text);

ALTER TABLE public.market_products
  DROP COLUMN IF EXISTS density_kg_per_l,
  DROP COLUMN IF EXISTS drained_weight_unit,
  DROP COLUMN IF EXISTS drained_weight_qty,
  DROP COLUMN IF EXISTS net_content_unit,
  DROP COLUMN IF EXISTS net_content_qty,
  DROP COLUMN IF EXISTS unit_content_unit,
  DROP COLUMN IF EXISTS unit_content_qty,
  DROP COLUMN IF EXISTS pack_count,
  DROP COLUMN IF EXISTS pack_presentation,
  DROP COLUMN IF EXISTS measurement_dimension,
  DROP COLUMN IF EXISTS origin,
  DROP COLUMN IF EXISTS gtin;

-- 5. Drop coverage & establishments tables in strict dependency order
DROP POLICY IF EXISTS market_delivery_coverages_delete_staff ON public.market_delivery_coverages;
DROP POLICY IF EXISTS market_delivery_coverages_update_staff ON public.market_delivery_coverages;
DROP POLICY IF EXISTS market_delivery_coverages_insert_staff ON public.market_delivery_coverages;
DROP POLICY IF EXISTS market_delivery_coverages_read_auth ON public.market_delivery_coverages;
DROP TABLE IF EXISTS public.market_delivery_coverages CASCADE;

DROP POLICY IF EXISTS market_establishments_delete_staff ON public.market_establishments;
DROP POLICY IF EXISTS market_establishments_update_staff ON public.market_establishments;
DROP POLICY IF EXISTS market_establishments_insert_staff ON public.market_establishments;
DROP POLICY IF EXISTS market_establishments_read_auth ON public.market_establishments;
DROP TABLE IF EXISTS public.market_establishments CASCADE;

-- 6. Restore PR1 public.market_sources columns & constraints
ALTER TABLE public.market_sources
  DROP CONSTRAINT IF EXISTS check_ms_channel_type,
  DROP CONSTRAINT IF EXISTS check_ms_country_code,
  DROP CONSTRAINT IF EXISTS check_source_region;

ALTER TABLE public.market_sources
  ADD CONSTRAINT check_source_region CHECK (
    default_region IN ('ES_TENERIFE_TF', 'ES_GRAN_CANARIA_GC', 'ES_CANARIAS_REGIONAL', 'ES_PENINSULA_MAINLAND', 'ES_NATIONAL')
  );

ALTER TABLE public.market_sources
  DROP COLUMN IF EXISTS channel_type,
  DROP COLUMN IF EXISTS country_code,
  DROP COLUMN IF EXISTS provider_code;
