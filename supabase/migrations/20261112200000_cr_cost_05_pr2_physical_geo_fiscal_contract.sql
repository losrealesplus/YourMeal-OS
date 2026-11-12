-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR2 (BLOCK 2): PHYSICAL FORMATS, GEO COVERAGE & FISCAL METADATA
-- Additive migration on top of PR1 (20261112180000_cr_cost_05_pr1_integrity_and_rls.sql).
-- Scope: Block 2 ONLY — Zero cost comparator/recommendation logic, zero external connectors.
-- NOTE: owner_tenant_id IS NULL shares data ONLY within this instance's PostgreSQL database.
-- ============================================================================

-- 1. Extend public.market_sources (provider identity & international region openness)
ALTER TABLE public.market_sources
  ADD COLUMN IF NOT EXISTS provider_code text NULL,
  ADD COLUMN IF NOT EXISTS country_code text NULL,
  ADD COLUMN IF NOT EXISTS channel_type text NULL;

ALTER TABLE public.market_sources
  DROP CONSTRAINT IF EXISTS check_source_region;
ALTER TABLE public.market_sources
  ADD CONSTRAINT check_source_region CHECK (char_length(btrim(default_region)) >= 2);

ALTER TABLE public.market_sources
  DROP CONSTRAINT IF EXISTS check_ms_country_code;
ALTER TABLE public.market_sources
  ADD CONSTRAINT check_ms_country_code CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  );

ALTER TABLE public.market_sources
  DROP CONSTRAINT IF EXISTS check_ms_channel_type;
ALTER TABLE public.market_sources
  ADD CONSTRAINT check_ms_channel_type CHECK (
    channel_type IS NULL OR channel_type IN (
      'b2b_wholesale',
      'cash_carry',
      'regional_distributor',
      'retail_store',
      'retail_online',
      'direct_producer',
      'unknown'
    )
  );

-- 2. Establishments / Commercial Channels under a Provider (public Core OR tenant-private)
CREATE TABLE IF NOT EXISTS public.market_establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES public.market_sources(id) ON DELETE RESTRICT,
  owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  establishment_code text NOT NULL,
  name text NOT NULL,
  channel_kind text NOT NULL DEFAULT 'unknown',
  country_code text NULL,
  region_code text NULL,
  subdivision_code text NULL,
  province_code text NULL,
  island_code text NULL,
  postal_code text NULL,
  city text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_me_channel_kind CHECK (
    channel_kind IN ('cash_carry', 'wholesale_depot', 'retail_store', 'online_store', 'direct_delivery', 'unknown')
  ),
  CONSTRAINT check_me_country_code CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT check_me_postal_code CHECK (
    postal_code IS NULL OR postal_code ~ '^[A-Za-z0-9 -]{2,16}$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_establishments_public_code
  ON public.market_establishments(source_id, establishment_code)
  WHERE owner_tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_establishments_tenant_code
  ON public.market_establishments(source_id, owner_tenant_id, establishment_code)
  WHERE owner_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_market_establishments_source_geo
  ON public.market_establishments(source_id, country_code, region_code, island_code, postal_code);

ALTER TABLE public.market_establishments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_establishments TO authenticated;
GRANT ALL ON public.market_establishments TO service_role;

DROP POLICY IF EXISTS market_establishments_read_auth ON public.market_establishments;
CREATE POLICY market_establishments_read_auth ON public.market_establishments
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.is_tenant_member(owner_tenant_id)
  );

DROP POLICY IF EXISTS market_establishments_insert_staff ON public.market_establishments;
CREATE POLICY market_establishments_insert_staff ON public.market_establishments
  FOR INSERT TO authenticated
  WITH CHECK (
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
  );

DROP POLICY IF EXISTS market_establishments_update_staff ON public.market_establishments;
CREATE POLICY market_establishments_update_staff ON public.market_establishments
  FOR UPDATE TO authenticated
  USING (
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
  WITH CHECK (
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
  );

DROP POLICY IF EXISTS market_establishments_delete_staff ON public.market_establishments;
CREATE POLICY market_establishments_delete_staff ON public.market_establishments
  FOR DELETE TO authenticated
  USING (
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
  );

-- 3. Explicit Delivery / Pickup Coverage Destinations (separated from observation location)
CREATE TABLE IF NOT EXISTS public.market_delivery_coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES public.market_sources(id) ON DELETE CASCADE,
  establishment_id uuid NULL REFERENCES public.market_establishments(id) ON DELETE CASCADE,
  owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fulfillment_mode text NOT NULL DEFAULT 'unknown',
  coverage_status text NOT NULL DEFAULT 'documented_available',
  country_code text NOT NULL,
  region_code text NULL,
  subdivision_code text NULL,
  province_code text NULL,
  island_code text NULL,
  postal_code_prefix text NULL,
  valid_from date NULL,
  valid_to date NULL,
  evidence_note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_mdc_fulfillment_mode CHECK (
    fulfillment_mode IN ('delivery', 'pickup_only', 'delivery_and_pickup', 'unknown')
  ),
  CONSTRAINT check_mdc_coverage_status CHECK (
    coverage_status IN ('documented_available', 'documented_unavailable', 'conditional', 'unknown')
  ),
  CONSTRAINT check_mdc_country_code CHECK (
    country_code ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT check_mdc_postal_prefix CHECK (
    postal_code_prefix IS NULL OR postal_code_prefix ~ '^[A-Za-z0-9 -]{2,16}$'
  ),
  CONSTRAINT check_mdc_validity_dates CHECK (
    valid_from IS NULL OR valid_to IS NULL OR valid_to >= valid_from
  )
);

CREATE INDEX IF NOT EXISTS idx_market_delivery_coverages_lookup
  ON public.market_delivery_coverages(source_id, country_code, region_code, island_code, province_code, postal_code_prefix);

ALTER TABLE public.market_delivery_coverages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_delivery_coverages TO authenticated;
GRANT ALL ON public.market_delivery_coverages TO service_role;

DROP POLICY IF EXISTS market_delivery_coverages_read_auth ON public.market_delivery_coverages;
CREATE POLICY market_delivery_coverages_read_auth ON public.market_delivery_coverages
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.is_tenant_member(owner_tenant_id)
  );

DROP POLICY IF EXISTS market_delivery_coverages_insert_staff ON public.market_delivery_coverages;
CREATE POLICY market_delivery_coverages_insert_staff ON public.market_delivery_coverages
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      market_delivery_coverages.establishment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.market_establishments me
        WHERE me.id = market_delivery_coverages.establishment_id
          AND (
            me.owner_tenant_id IS NULL
            OR (
              market_delivery_coverages.owner_tenant_id IS NOT NULL
              AND me.owner_tenant_id = market_delivery_coverages.owner_tenant_id
            )
          )
      )
    )
    AND (
      (
        market_delivery_coverages.owner_tenant_id IS NULL
        AND public.is_saas_admin(auth.uid())
      )
      OR (
        market_delivery_coverages.owner_tenant_id IS NOT NULL
        AND public.is_tenant_member(market_delivery_coverages.owner_tenant_id)
        AND (
          public.has_any_staff_role(auth.uid(), market_delivery_coverages.owner_tenant_id)
          OR public.is_saas_admin(auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS market_delivery_coverages_update_staff ON public.market_delivery_coverages;
CREATE POLICY market_delivery_coverages_update_staff ON public.market_delivery_coverages
  FOR UPDATE TO authenticated
  USING (
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
  WITH CHECK (
    (
      market_delivery_coverages.establishment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.market_establishments me
        WHERE me.id = market_delivery_coverages.establishment_id
          AND (
            me.owner_tenant_id IS NULL
            OR (
              market_delivery_coverages.owner_tenant_id IS NOT NULL
              AND me.owner_tenant_id = market_delivery_coverages.owner_tenant_id
            )
          )
      )
    )
    AND (
      (
        market_delivery_coverages.owner_tenant_id IS NULL
        AND public.is_saas_admin(auth.uid())
      )
      OR (
        market_delivery_coverages.owner_tenant_id IS NOT NULL
        AND public.is_tenant_member(market_delivery_coverages.owner_tenant_id)
        AND (
          public.has_any_staff_role(auth.uid(), market_delivery_coverages.owner_tenant_id)
          OR public.is_saas_admin(auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS market_delivery_coverages_delete_staff ON public.market_delivery_coverages;
CREATE POLICY market_delivery_coverages_delete_staff ON public.market_delivery_coverages
  FOR DELETE TO authenticated
  USING (
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
  );

-- 4. Extend public.market_products with Physical Format Contract (GTIN, pack, net/drained weight, dimensions)
ALTER TABLE public.market_products
  ADD COLUMN IF NOT EXISTS gtin text NULL,
  ADD COLUMN IF NOT EXISTS origin text NULL,
  ADD COLUMN IF NOT EXISTS measurement_dimension text NULL,
  ADD COLUMN IF NOT EXISTS pack_presentation text NULL,
  ADD COLUMN IF NOT EXISTS pack_count integer NULL,
  ADD COLUMN IF NOT EXISTS unit_content_qty numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS unit_content_unit text NULL,
  ADD COLUMN IF NOT EXISTS net_content_qty numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS net_content_unit text NULL,
  ADD COLUMN IF NOT EXISTS drained_weight_qty numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS drained_weight_unit text NULL,
  ADD COLUMN IF NOT EXISTS density_kg_per_l numeric(10,6) NULL;

UPDATE public.market_products
SET measurement_dimension = CASE standard_unit
  WHEN 'l' THEN 'volume'
  WHEN 'unit' THEN 'count'
  ELSE 'mass'
END
WHERE measurement_dimension IS NULL;

CREATE OR REPLACE FUNCTION public.trg_sync_market_product_dimension()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.measurement_dimension IS NULL THEN
    NEW.measurement_dimension := CASE NEW.standard_unit
      WHEN 'l' THEN 'volume'
      WHEN 'unit' THEN 'count'
      ELSE 'mass'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_market_products_sync_dimension ON public.market_products;
CREATE TRIGGER trg_market_products_sync_dimension
  BEFORE INSERT OR UPDATE ON public.market_products
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_market_product_dimension();

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_gtin_digits;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_gtin_digits CHECK (
    gtin IS NULL OR gtin ~ '^[0-9]{8}$|^[0-9]{12,14}$'
  );

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_dimension_consistency;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_dimension_consistency CHECK (
    measurement_dimension IS NULL
    OR (
      measurement_dimension IN ('mass', 'volume', 'count')
      AND (
        (standard_unit = 'kg' AND measurement_dimension = 'mass')
        OR (standard_unit = 'l' AND measurement_dimension = 'volume')
        OR (standard_unit = 'unit' AND measurement_dimension = 'count')
      )
    )
  );

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_pack_presentation;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_pack_presentation CHECK (
    pack_presentation IS NULL OR pack_presentation IN (
      'bulk', 'bag', 'box', 'tray', 'bottle', 'can', 'jar', 'sachet', 'vacuum', 'drum', 'pack', 'other'
    )
  );

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_pack_positive;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_pack_positive CHECK (
    (pack_count IS NULL OR pack_count >= 1)
    AND (unit_content_qty IS NULL OR unit_content_qty > 0)
    AND (net_content_qty IS NULL OR net_content_qty > 0)
    AND (drained_weight_qty IS NULL OR drained_weight_qty > 0)
    AND (density_kg_per_l IS NULL OR density_kg_per_l > 0)
  );

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_unit_pairs;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_unit_pairs CHECK (
    ((unit_content_qty IS NULL) = (unit_content_unit IS NULL))
    AND ((net_content_qty IS NULL) = (net_content_unit IS NULL))
    AND ((drained_weight_qty IS NULL) = (drained_weight_unit IS NULL))
    AND (unit_content_unit IS NULL OR unit_content_unit IN ('kg', 'g', 'l', 'ml', 'cl', 'unit'))
    AND (net_content_unit IS NULL OR net_content_unit IN ('kg', 'g', 'l', 'ml', 'cl', 'unit'))
    AND (drained_weight_unit IS NULL OR drained_weight_unit IN ('kg', 'g'))
  );

CREATE OR REPLACE FUNCTION public.cr_cost_05_unit_dimension(u text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public, pg_temp
AS $$
  SELECT CASE lower(btrim(u))
    WHEN 'kg' THEN 'mass'
    WHEN 'g' THEN 'mass'
    WHEN 'l' THEN 'volume'
    WHEN 'ml' THEN 'volume'
    WHEN 'cl' THEN 'volume'
    WHEN 'unit' THEN 'count'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.cr_cost_05_unit_factor(u text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public, pg_temp
AS $$
  SELECT CASE lower(btrim(u))
    WHEN 'kg' THEN 1.0::numeric
    WHEN 'g' THEN 0.001::numeric
    WHEN 'l' THEN 1.0::numeric
    WHEN 'ml' THEN 0.001::numeric
    WHEN 'cl' THEN 0.01::numeric
    WHEN 'unit' THEN 1.0::numeric
    ELSE NULL::numeric
  END;
$$;

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_pack_dimensions_compatible;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_pack_dimensions_compatible CHECK (
    unit_content_unit IS NULL
    OR net_content_unit IS NULL
    OR public.cr_cost_05_unit_dimension(unit_content_unit) = public.cr_cost_05_unit_dimension(net_content_unit)
  );

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_no_pack_double_multiplication;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_no_pack_double_multiplication CHECK (
    pack_count IS NULL
    OR unit_content_qty IS NULL
    OR net_content_qty IS NULL
    OR (
      public.cr_cost_05_unit_dimension(unit_content_unit) = public.cr_cost_05_unit_dimension(net_content_unit)
      AND ABS(
        (pack_count * unit_content_qty * public.cr_cost_05_unit_factor(unit_content_unit))
        - (net_content_qty * public.cr_cost_05_unit_factor(net_content_unit))
      ) <= GREATEST(
        0.0001::numeric,
        (pack_count * unit_content_qty * public.cr_cost_05_unit_factor(unit_content_unit)) * 0.005::numeric
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_market_products_gtin
  ON public.market_products(gtin)
  WHERE gtin IS NOT NULL;

-- 5. Extend public.market_price_observations with Geo, Fiscal (IVA/IGIC/AIEM) & Commercial Terms
ALTER TABLE public.market_price_observations
  ALTER COLUMN tax_rate DROP NOT NULL,
  ALTER COLUMN tax_rate DROP DEFAULT,
  ALTER COLUMN normalized_price_ex_tax DROP NOT NULL,
  ALTER COLUMN valid_to DROP NOT NULL;

ALTER TABLE public.market_price_observations
  ADD COLUMN IF NOT EXISTS observed_price_basis text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS normalization_basis text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS normalization_status text NOT NULL DEFAULT 'computed',
  ADD COLUMN IF NOT EXISTS establishment_id uuid NULL REFERENCES public.market_establishments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observation_country_code text NULL,
  ADD COLUMN IF NOT EXISTS observation_subdivision_code text NULL,
  ADD COLUMN IF NOT EXISTS observation_province_code text NULL,
  ADD COLUMN IF NOT EXISTS observation_island_code text NULL,
  ADD COLUMN IF NOT EXISTS observation_postal_code text NULL,
  ADD COLUMN IF NOT EXISTS observed_channel text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS delivery_coverage_state text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS validity_source text NOT NULL DEFAULT 'inferred_default',
  ADD COLUMN IF NOT EXISTS tax_regime text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS tax_rate_source text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS tax_rule_ref text NULL,
  ADD COLUMN IF NOT EXISTS tax_effective_from date NULL,
  ADD COLUMN IF NOT EXISTS tax_effective_to date NULL,
  ADD COLUMN IF NOT EXISTS aiem_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS aiem_evidence text NULL,
  ADD COLUMN IF NOT EXISTS aiem_rate numeric(6,4) NULL,
  ADD COLUMN IF NOT EXISTS aiem_amount_raw numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS freight_inclusion text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS freight_cost_raw numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS free_freight_min_order_amount numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS min_order_qty numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS min_order_unit text NULL,
  ADD COLUMN IF NOT EXISTS promotion_condition text NULL,
  ADD COLUMN IF NOT EXISTS promotion_valid_to date NULL;

-- Replace restrictive currency/tax_mode/normalized_price checks while preserving legacy validity
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_currency;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_currency CHECK (currency ~ '^[A-Z]{3}$');

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_tax_mode;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_tax_mode CHECK (tax_mode IN ('ex_tax', 'inc_tax', 'unknown'));

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_tax_rate;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_tax_rate CHECK (
    tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 1.0)
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_normalized_price;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_normalized_price CHECK (
    normalized_price_ex_tax IS NULL OR normalized_price_ex_tax >= 0
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_physical_basis;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_pr2_physical_basis CHECK (
    observed_price_basis IN ('per_pack', 'per_inner_unit', 'per_base_unit', 'unknown')
    AND normalization_basis IN ('net_content', 'drained_weight', 'unit_count', 'unknown')
    AND normalization_status IN ('computed', 'tax_unknown', 'tax_rate_missing', 'dimension_incompatible', 'pack_incomplete')
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_geo_availability;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_pr2_geo_availability CHECK (
    (observation_country_code IS NULL OR observation_country_code ~ '^[A-Z]{2}$')
    AND (observation_postal_code IS NULL OR observation_postal_code ~ '^[A-Za-z0-9 -]{2,16}$')
    AND observed_channel IN ('cash_carry', 'b2b_portal', 'retail_shelf', 'retail_online', 'supplier_quote', 'catalog_sheet', 'unknown')
    AND delivery_coverage_state IN ('delivery_available', 'pickup_only', 'unavailable_in_target', 'unknown')
    AND availability_status IN ('in_stock', 'out_of_stock', 'limited', 'on_request', 'discontinued', 'unknown')
    AND validity_source IN ('source_declared', 'contract_agreed', 'inferred_default', 'unknown')
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_fiscal_contract;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_pr2_fiscal_contract CHECK (
    tax_regime IN ('IVA', 'IGIC', 'IPSI', 'VAT', 'GST', 'SALES_TAX', 'EXEMPT', 'OUT_OF_SCOPE', 'UNKNOWN')
    AND tax_rate_source IN ('observed_document', 'official_tariff_table', 'source_declared_default', 'tenant_supplied', 'not_applicable', 'unknown')
    AND (tax_effective_from IS NULL OR tax_effective_to IS NULL OR tax_effective_to >= tax_effective_from)
    AND aiem_status IN ('not_applicable', 'applicable_included', 'applicable_excluded', 'applicable_inclusion_unknown', 'unknown')
    AND (aiem_rate IS NULL OR (aiem_rate >= 0 AND aiem_rate <= 1.0))
    AND (aiem_amount_raw IS NULL OR aiem_amount_raw >= 0)
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_tax_normalization_integrity;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_tax_normalization_integrity CHECK (
    (tax_mode <> 'unknown' OR (normalized_price_ex_tax IS NULL AND normalization_status IN ('tax_unknown', 'dimension_incompatible', 'pack_incomplete')))
    AND NOT (tax_mode = 'inc_tax' AND tax_rate IS NULL AND normalized_price_ex_tax IS NOT NULL)
    AND NOT (tax_regime IN ('EXEMPT', 'OUT_OF_SCOPE') AND tax_rate IS NOT NULL AND tax_rate > 0)
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_pr2_commercial_terms;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_pr2_commercial_terms CHECK (
    freight_inclusion IN ('included', 'excluded', 'free_above_threshold', 'unknown')
    AND (freight_cost_raw IS NULL OR freight_cost_raw >= 0)
    AND (free_freight_min_order_amount IS NULL OR free_freight_min_order_amount >= 0)
    AND ((min_order_qty IS NULL) = (min_order_unit IS NULL))
    AND (min_order_qty IS NULL OR min_order_qty > 0)
    AND (min_order_unit IS NULL OR min_order_unit IN ('pack', 'unit', 'kg', 'l', 'order_amount'))
  );

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_public_raw_payload_no_tenant_leak;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_public_raw_payload_no_tenant_leak CHECK (
    owner_tenant_id IS NOT NULL
    OR raw_payload IS NULL
    OR NOT (raw_payload ?| ARRAY['tenantId', 'tenant_id', 'ownerTenantId', 'owner_tenant_id', 'privateConditions'])
  );

CREATE INDEX IF NOT EXISTS idx_market_price_obs_geo_availability
  ON public.market_price_observations(observation_country_code, region_code, observation_island_code, delivery_coverage_state);

-- 6. Strengthen RLS on market_price_observations so public observations cannot reference private tenant establishments
DROP POLICY IF EXISTS market_price_obs_insert_staff ON public.market_price_observations;
CREATE POLICY market_price_obs_insert_staff ON public.market_price_observations
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      market_price_observations.imported_by IS NULL
      OR market_price_observations.imported_by = auth.uid()
      OR public.is_saas_admin(auth.uid())
    )
    AND (
      market_price_observations.establishment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.market_establishments me
        WHERE me.id = market_price_observations.establishment_id
          AND (
            me.owner_tenant_id IS NULL
            OR (
              market_price_observations.owner_tenant_id IS NOT NULL
              AND me.owner_tenant_id = market_price_observations.owner_tenant_id
            )
          )
      )
    )
    AND (
      (
        market_price_observations.owner_tenant_id IS NULL
        AND public.is_saas_admin(auth.uid())
      )
      OR (
        market_price_observations.owner_tenant_id IS NOT NULL
        AND public.is_tenant_member(market_price_observations.owner_tenant_id)
        AND (
          public.has_any_staff_role(auth.uid(), market_price_observations.owner_tenant_id)
          OR public.is_saas_admin(auth.uid())
        )
      )
    )
  );

-- 7. Strengthen append-only immutability trigger across Block 2 economic/geo/fiscal facts
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
       OLD.observed_price_basis IS DISTINCT FROM NEW.observed_price_basis OR
       OLD.normalization_basis IS DISTINCT FROM NEW.normalization_basis OR
       OLD.normalization_status IS DISTINCT FROM NEW.normalization_status OR
       OLD.tax_rate IS DISTINCT FROM NEW.tax_rate OR
       OLD.tax_mode IS DISTINCT FROM NEW.tax_mode OR
       OLD.tax_regime IS DISTINCT FROM NEW.tax_regime OR
       OLD.tax_rate_source IS DISTINCT FROM NEW.tax_rate_source OR
       OLD.tax_rule_ref IS DISTINCT FROM NEW.tax_rule_ref OR
       OLD.tax_effective_from IS DISTINCT FROM NEW.tax_effective_from OR
       OLD.tax_effective_to IS DISTINCT FROM NEW.tax_effective_to OR
       OLD.aiem_status IS DISTINCT FROM NEW.aiem_status OR
       OLD.aiem_evidence IS DISTINCT FROM NEW.aiem_evidence OR
       OLD.aiem_rate IS DISTINCT FROM NEW.aiem_rate OR
       OLD.aiem_amount_raw IS DISTINCT FROM NEW.aiem_amount_raw OR
       OLD.freight_inclusion IS DISTINCT FROM NEW.freight_inclusion OR
       OLD.freight_cost_raw IS DISTINCT FROM NEW.freight_cost_raw OR
       OLD.free_freight_min_order_amount IS DISTINCT FROM NEW.free_freight_min_order_amount OR
       OLD.min_order_qty IS DISTINCT FROM NEW.min_order_qty OR
       OLD.min_order_unit IS DISTINCT FROM NEW.min_order_unit OR
       OLD.promotion_condition IS DISTINCT FROM NEW.promotion_condition OR
       OLD.observed_at IS DISTINCT FROM NEW.observed_at OR
       OLD.valid_from IS DISTINCT FROM NEW.valid_from OR
       OLD.validity_source IS DISTINCT FROM NEW.validity_source OR
       OLD.region_code IS DISTINCT FROM NEW.region_code OR
       OLD.location_name IS DISTINCT FROM NEW.location_name OR
       OLD.establishment_id IS DISTINCT FROM NEW.establishment_id OR
       OLD.observation_country_code IS DISTINCT FROM NEW.observation_country_code OR
       OLD.observation_subdivision_code IS DISTINCT FROM NEW.observation_subdivision_code OR
       OLD.observation_province_code IS DISTINCT FROM NEW.observation_province_code OR
       OLD.observation_island_code IS DISTINCT FROM NEW.observation_island_code OR
       OLD.observation_postal_code IS DISTINCT FROM NEW.observation_postal_code OR
       OLD.observed_channel IS DISTINCT FROM NEW.observed_channel OR
       OLD.delivery_coverage_state IS DISTINCT FROM NEW.delivery_coverage_state OR
       OLD.capture_method IS DISTINCT FROM NEW.capture_method OR
       OLD.fingerprint IS DISTINCT FROM NEW.fingerprint OR
       OLD.market_product_id IS DISTINCT FROM NEW.market_product_id OR
       OLD.owner_tenant_id IS DISTINCT FROM NEW.owner_tenant_id OR
       OLD.imported_by IS DISTINCT FROM NEW.imported_by THEN
      RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Economic, physical, geographic, and fiscal facts in market_price_observations are immutable and cannot be updated.'
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

GRANT UPDATE (valid_to, quality_status, promotion_status, promotion_valid_to, availability_status, raw_payload)
  ON public.market_price_observations TO authenticated;
