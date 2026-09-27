-- ============================================================================
-- YOURMEAL OS — FOOD MARKET PRICE INTELLIGENCE FOUNDATION (CR-COST-05)
-- Subsystem: Core Market Intelligence & FOOD Vertical Economics (E10)
-- Phase 3 DDL Specification & Migration Contract
-- ============================================================================

-- 1. Shared Core Market Sources
CREATE TABLE IF NOT EXISTS public.market_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  source_type text NOT NULL,
  default_tax_mode text NOT NULL DEFAULT 'ex_tax',
  default_region text NOT NULL DEFAULT 'ES_TENERIFE_TF',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_source_type CHECK (
    source_type IN ('b2b_wholesale', 'cash_carry', 'regional_specialist', 'retail_ceiling')
  ),
  CONSTRAINT check_source_tax_mode CHECK (
    default_tax_mode IN ('ex_tax', 'inc_tax')
  ),
  CONSTRAINT check_source_region CHECK (
    default_region IN ('ES_TENERIFE_TF', 'ES_GRAN_CANARIA_GC', 'ES_CANARIAS_REGIONAL', 'ES_PENINSULA_MAINLAND', 'ES_NATIONAL')
  )
);

ALTER TABLE public.market_sources ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.market_sources TO authenticated;
GRANT ALL ON public.market_sources TO service_role;

DROP POLICY IF EXISTS market_sources_read_auth ON public.market_sources;
CREATE POLICY market_sources_read_auth ON public.market_sources
  FOR SELECT TO authenticated
  USING (true);

-- 2. Shared Core Market Products
CREATE TABLE IF NOT EXISTS public.market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES public.market_sources(id) ON DELETE RESTRICT,
  external_sku text NOT NULL,
  raw_name text NOT NULL,
  brand text,
  category text NOT NULL DEFAULT 'General Food',
  thermal_state text NOT NULL DEFAULT 'ambient',
  standard_quantity numeric(12,4) NOT NULL DEFAULT 1.0,
  standard_unit text NOT NULL DEFAULT 'kg',
  cut_specification text,
  quality_grade text NOT NULL DEFAULT 'standard',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_market_products_source_sku UNIQUE (source_id, external_sku),
  CONSTRAINT check_mp_thermal_state CHECK (
    thermal_state IN ('fresh', 'frozen', 'ambient', 'dry')
  ),
  CONSTRAINT check_mp_standard_unit CHECK (
    standard_unit IN ('kg', 'l', 'unit')
  ),
  CONSTRAINT check_mp_qty CHECK (standard_quantity > 0)
);

ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.market_products TO authenticated;
GRANT ALL ON public.market_products TO service_role;

DROP POLICY IF EXISTS market_products_read_auth ON public.market_products;
CREATE POLICY market_products_read_auth ON public.market_products
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS market_products_write_staff ON public.market_products;
CREATE POLICY market_products_write_staff ON public.market_products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_market_products_source_sku
  ON public.market_products(source_id, external_sku);

-- 3. Shared Core Market Price Observations (Append-Only Time-Series)
CREATE TABLE IF NOT EXISTS public.market_price_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_product_id uuid NOT NULL REFERENCES public.market_products(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  price_raw numeric(12,4) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  tax_mode text NOT NULL DEFAULT 'ex_tax',
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.0,
  normalized_price_ex_tax numeric(12,4) NOT NULL,
  normalized_unit text NOT NULL DEFAULT 'EUR_PER_KG',
  promotion_status text NOT NULL DEFAULT 'standard',
  region_code text NOT NULL DEFAULT 'ES_TENERIFE_TF',
  location_name text NOT NULL DEFAULT 'Central Warehouse',
  capture_method text NOT NULL DEFAULT 'catalog_import',
  quality_status text NOT NULL DEFAULT 'OBSERVED',
  raw_payload jsonb,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_market_price_obs_fingerprint UNIQUE (fingerprint),
  CONSTRAINT check_mpo_price_raw CHECK (price_raw >= 0),
  CONSTRAINT check_mpo_normalized_price CHECK (normalized_price_ex_tax >= 0),
  CONSTRAINT check_mpo_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 1.0),
  CONSTRAINT check_mpo_currency CHECK (currency = 'EUR'),
  CONSTRAINT check_mpo_tax_mode CHECK (tax_mode IN ('ex_tax', 'inc_tax')),
  CONSTRAINT check_mpo_unit CHECK (normalized_unit IN ('EUR_PER_KG', 'EUR_PER_L', 'EUR_PER_UNIT')),
  CONSTRAINT check_mpo_promo CHECK (promotion_status IN ('standard', 'temporary_discount', 'clearance')),
  CONSTRAINT check_mpo_capture_method CHECK (capture_method IN ('assisted_entry', 'catalog_import', 'authorized_feed')),
  CONSTRAINT check_mpo_quality_status CHECK (
    quality_status IN ('VERIFIED', 'OBSERVED', 'ESTIMATED', 'PROMOTIONAL', 'STALE', 'LOW_CONFIDENCE')
  )
);

ALTER TABLE public.market_price_observations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.market_price_observations TO authenticated;
GRANT ALL ON public.market_price_observations TO service_role;

DROP POLICY IF EXISTS market_price_obs_read_auth ON public.market_price_observations;
CREATE POLICY market_price_obs_read_auth ON public.market_price_observations
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS market_price_obs_insert_staff ON public.market_price_observations;
CREATE POLICY market_price_obs_insert_staff ON public.market_price_observations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- Database Trigger Guard: Enforce Append-Only Immutability
CREATE OR REPLACE FUNCTION public.trg_guard_market_observation_immutability()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Historical market price observations are strictly append-only and cannot be deleted.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Prevent mutation of economic facts, tax rates, timestamps, or fingerprints
    IF OLD.price_raw IS DISTINCT FROM NEW.price_raw OR
       OLD.normalized_price_ex_tax IS DISTINCT FROM NEW.normalized_price_ex_tax OR
       OLD.tax_rate IS DISTINCT FROM NEW.tax_rate OR
       OLD.tax_mode IS DISTINCT FROM NEW.tax_mode OR
       OLD.observed_at IS DISTINCT FROM NEW.observed_at OR
       OLD.fingerprint IS DISTINCT FROM NEW.fingerprint OR
       OLD.market_product_id IS DISTINCT FROM NEW.market_product_id THEN
      RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Economic price facts in market_price_observations are immutable and cannot be updated.'
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_market_price_obs_immutability ON public.market_price_observations;
CREATE TRIGGER trg_market_price_obs_immutability
  BEFORE UPDATE OR DELETE ON public.market_price_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_market_observation_immutability();

CREATE INDEX IF NOT EXISTS idx_market_price_obs_product_date
  ON public.market_price_observations(market_product_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_price_obs_region
  ON public.market_price_observations(region_code, observed_at DESC);

-- 4. Shared Core Market Volume Tiers
CREATE TABLE IF NOT EXISTS public.market_volume_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid NOT NULL REFERENCES public.market_price_observations(id) ON DELETE CASCADE,
  min_quantity numeric(12,4) NOT NULL,
  tier_normalized_price_ex_tax numeric(12,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_mvt_min_qty CHECK (min_quantity > 0),
  CONSTRAINT check_mvt_tier_price CHECK (tier_normalized_price_ex_tax >= 0)
);

ALTER TABLE public.market_volume_tiers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.market_volume_tiers TO authenticated;
GRANT ALL ON public.market_volume_tiers TO service_role;

DROP POLICY IF EXISTS market_volume_tiers_read_auth ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_read_auth ON public.market_volume_tiers
  FOR SELECT TO authenticated
  USING (true);

-- 5. Private Tenant Product Mappings (Tenant Isolated via RLS)
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  market_product_id uuid NOT NULL REFERENCES public.market_products(id) ON DELETE RESTRICT,
  match_confidence numeric(5,4) NOT NULL DEFAULT 1.0,
  match_status text NOT NULL DEFAULT 'suggested',
  comparability_grade text NOT NULL DEFAULT 'HIGH',
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_mapping_tenant_ingredient_product UNIQUE (tenant_id, tenant_ingredient_id, market_product_id),
  CONSTRAINT check_pm_confidence CHECK (match_confidence >= 0 AND match_confidence <= 1.0),
  CONSTRAINT check_pm_status CHECK (match_status IN ('suggested', 'confirmed', 'rejected')),
  CONSTRAINT check_pm_grade CHECK (comparability_grade IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'))
);

ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_mappings TO authenticated;
GRANT ALL ON public.product_mappings TO service_role;

DROP POLICY IF EXISTS product_mappings_tenant_read ON public.product_mappings;
CREATE POLICY product_mappings_tenant_read ON public.product_mappings
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  );

DROP POLICY IF EXISTS product_mappings_tenant_write ON public.product_mappings;
CREATE POLICY product_mappings_tenant_write ON public.product_mappings
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_product_mappings_tenant_ingredient
  ON public.product_mappings(tenant_id, tenant_ingredient_id);

CREATE INDEX IF NOT EXISTS idx_product_mappings_tenant_product
  ON public.product_mappings(tenant_id, market_product_id);

-- 6. Seed Data for Initial 4 Registered Market Sources
INSERT INTO public.market_sources (id, name, source_type, default_tax_mode, default_region, is_active, notes)
VALUES
  ('src-makro', 'Makro', 'b2b_wholesale', 'ex_tax', 'ES_TENERIFE_TF', true, 'Professional B2B / HORECA Cash & Carry baseline'),
  ('src-gmcash', 'GM Cash', 'cash_carry', 'ex_tax', 'ES_TENERIFE_TF', true, 'HORECA Cash & Carry Transgourmet'),
  ('src-5oceanos', '5 Océanos', 'regional_specialist', 'ex_tax', 'ES_TENERIFE_TF', true, 'Canary Islands Frozen & Protein Specialist'),
  ('src-mercadona', 'Mercadona', 'retail_ceiling', 'inc_tax', 'ES_CANARIAS_REGIONAL', true, 'Consumer Supermarket Retail Reference Ceiling (Not HORECA Supplier)')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  default_tax_mode = EXCLUDED.default_tax_mode,
  default_region = EXCLUDED.default_region,
  is_active = EXCLUDED.is_active,
  notes = EXCLUDED.notes,
  updated_at = now();
