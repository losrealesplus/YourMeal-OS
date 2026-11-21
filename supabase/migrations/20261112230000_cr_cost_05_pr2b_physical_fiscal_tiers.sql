-- ============================================================================
-- CR-COST-05 PR2B: PHYSICAL PRODUCT FORMATS, FISCAL METADATA & VOLUME TIERS EXTENSION
-- Core Market Intelligence Contract extension for catch-weight products,
-- TARIC classification codes, volume tiers with full tax/unit metadata (D-010),
-- and tenant-scoped configuration for pricing comparisons and catch-weight policies.
-- ============================================================================

-- 1. Extend public.market_products with catch-weight and TARIC customs code
ALTER TABLE public.market_products
  ADD COLUMN IF NOT EXISTS is_catch_weight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS taric_code text NULL;

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS check_mp_taric_code;
ALTER TABLE public.market_products
  ADD CONSTRAINT check_mp_taric_code CHECK (
    taric_code IS NULL OR taric_code ~ '^[0-9]{4,10}$'
  );

CREATE INDEX IF NOT EXISTS idx_market_products_taric_code
  ON public.market_products(taric_code)
  WHERE taric_code IS NOT NULL;

-- 2. Extend public.market_volume_tiers with Unit, Raw Price, Fiscal metadata & D-010 compliance
ALTER TABLE public.market_volume_tiers
  ALTER COLUMN tier_normalized_price_ex_tax DROP NOT NULL;

ALTER TABLE public.market_volume_tiers
  ADD COLUMN IF NOT EXISTS tier_quantity_unit text NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS tier_price_raw numeric(12,4) NULL,
  ADD COLUMN IF NOT EXISTS tax_mode text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS tax_rate numeric(6,4) NULL;

-- Backfill tier_price_raw from tier_normalized_price_ex_tax if present
UPDATE public.market_volume_tiers
SET tier_price_raw = tier_normalized_price_ex_tax
WHERE tier_price_raw IS NULL AND tier_normalized_price_ex_tax IS NOT NULL;

ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tier_quantity_unit;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tier_quantity_unit CHECK (
    tier_quantity_unit IN ('kg', 'g', 'l', 'ml', 'cl', 'unit', 'pack')
  );

ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tier_price_raw;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tier_price_raw CHECK (
    tier_price_raw IS NULL OR tier_price_raw >= 0
  );

ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tax_mode;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tax_mode CHECK (
    tax_mode IN ('in_tax', 'inc_tax', 'ex_tax', 'exempt', 'unknown')
  );

ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tax_rate;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tax_rate CHECK (
    tax_rate IS NULL OR (tax_rate >= 0 AND tax_rate <= 1.0)
  );

ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tier_price;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tier_price CHECK (
    tier_normalized_price_ex_tax IS NULL OR tier_normalized_price_ex_tax >= 0
  );

-- Enforce D-010 invariant on volume tiers:
-- When tax_mode is 'unknown', tier_normalized_price_ex_tax MUST remain NULL.
-- When tax_mode is inc_tax/in_tax without tax_rate, tier_normalized_price_ex_tax MUST remain NULL.
-- When exempt, tax_rate must not be positive.
ALTER TABLE public.market_volume_tiers
  DROP CONSTRAINT IF EXISTS check_mvt_tax_normalization_integrity;
ALTER TABLE public.market_volume_tiers
  ADD CONSTRAINT check_mvt_tax_normalization_integrity CHECK (
    (tax_mode <> 'unknown' OR tier_normalized_price_ex_tax IS NULL)
    AND NOT (tax_mode IN ('in_tax', 'inc_tax') AND tax_rate IS NULL AND tier_normalized_price_ex_tax IS NOT NULL)
    AND NOT (tax_mode = 'exempt' AND tax_rate IS NOT NULL AND tax_rate > 0)
  );

-- 3. Invariant Enforcement: Extend Immutability Trigger to public.market_volume_tiers
CREATE OR REPLACE FUNCTION public.trg_guard_market_volume_tier_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Historical market volume tiers are strictly append-only and cannot be deleted.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.observation_id IS DISTINCT FROM NEW.observation_id OR
       OLD.min_quantity IS DISTINCT FROM NEW.min_quantity OR
       OLD.tier_quantity_unit IS DISTINCT FROM NEW.tier_quantity_unit OR
       OLD.tier_price_raw IS DISTINCT FROM NEW.tier_price_raw OR
       OLD.tier_normalized_price_ex_tax IS DISTINCT FROM NEW.tier_normalized_price_ex_tax OR
       OLD.tax_mode IS DISTINCT FROM NEW.tax_mode OR
       OLD.tax_rate IS DISTINCT FROM NEW.tax_rate THEN
      RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Historical market volume tiers are strictly immutable and cannot be updated.'
        USING ERRCODE = 'restrict_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_market_volume_tiers_guard_immutability ON public.market_volume_tiers;
CREATE TRIGGER trg_market_volume_tiers_guard_immutability
  BEFORE UPDATE OR DELETE ON public.market_volume_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_market_volume_tier_immutability();

-- 4. Tenant Market Intelligence Configuration (Tenant-Scoped via RLS)
CREATE TABLE IF NOT EXISTS public.market_tenant_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pricing_comparison_mode text NOT NULL DEFAULT 'landed_cost',
  catch_weight_policy text NOT NULL DEFAULT 'allow_variable_kg',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_market_tenant_configs_tenant UNIQUE (tenant_id),
  CONSTRAINT check_mtc_pricing_comparison_mode CHECK (
    pricing_comparison_mode IN ('landed_cost', 'origin_price')
  ),
  CONSTRAINT check_mtc_catch_weight_policy CHECK (
    catch_weight_policy IN ('allow_variable_kg', 'strict_nominal_pack')
  )
);

CREATE INDEX IF NOT EXISTS idx_market_tenant_configs_tenant
  ON public.market_tenant_configs(tenant_id);

ALTER TABLE public.market_tenant_configs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.market_tenant_configs TO authenticated;
GRANT ALL ON public.market_tenant_configs TO service_role;

DROP POLICY IF EXISTS market_tenant_configs_read_auth ON public.market_tenant_configs;
CREATE POLICY market_tenant_configs_read_auth ON public.market_tenant_configs
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS market_tenant_configs_insert_staff ON public.market_tenant_configs;
CREATE POLICY market_tenant_configs_insert_staff ON public.market_tenant_configs
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      public.has_cost_intelligence_access(auth.uid(), tenant_id)
      AND public.is_tenant_module_enabled(tenant_id, 'admin_module_market_intelligence')
    )
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS market_tenant_configs_update_staff ON public.market_tenant_configs;
CREATE POLICY market_tenant_configs_update_staff ON public.market_tenant_configs
  FOR UPDATE TO authenticated
  USING (
    (
      public.has_cost_intelligence_access(auth.uid(), tenant_id)
      AND public.is_tenant_module_enabled(tenant_id, 'admin_module_market_intelligence')
    )
    OR public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    (
      public.has_cost_intelligence_access(auth.uid(), tenant_id)
      AND public.is_tenant_module_enabled(tenant_id, 'admin_module_market_intelligence')
    )
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS market_tenant_configs_delete_admin ON public.market_tenant_configs;
CREATE POLICY market_tenant_configs_delete_admin ON public.market_tenant_configs
  FOR DELETE TO authenticated
  USING (
    public.is_saas_admin(auth.uid())
  );
