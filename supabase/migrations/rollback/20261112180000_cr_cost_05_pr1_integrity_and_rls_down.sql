-- ============================================================================
-- ROLLBACK: CR-COST-05 PR1 INTEGRITY, RLS HARDENING & PRIVATE SCOPING
-- ============================================================================

-- 1. Restore product_mappings FOR ALL policy
DROP POLICY IF EXISTS product_mappings_tenant_insert ON public.product_mappings;
DROP POLICY IF EXISTS product_mappings_tenant_update ON public.product_mappings;
DROP POLICY IF EXISTS product_mappings_tenant_delete ON public.product_mappings;

CREATE POLICY product_mappings_tenant_write ON public.product_mappings
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

-- 2. Restore market_volume_tiers policies & drop index
DROP POLICY IF EXISTS market_volume_tiers_insert_staff ON public.market_volume_tiers;
DROP POLICY IF EXISTS market_volume_tiers_read_auth ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_read_auth ON public.market_volume_tiers
  FOR SELECT TO authenticated
  USING (true);

DROP INDEX IF EXISTS public.idx_market_volume_tiers_observation;

-- 3. Restore market_price_observations RLS, privileges, trigger & drop owner_tenant_id
DROP POLICY IF EXISTS market_price_obs_update_staff ON public.market_price_observations;
REVOKE UPDATE ON public.market_price_observations FROM authenticated;

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

CREATE OR REPLACE FUNCTION public.trg_guard_market_observation_immutability()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CR-COST-05 Invariant Violation: Historical market price observations are strictly append-only and cannot be deleted.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
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

DROP INDEX IF EXISTS public.idx_market_price_obs_owner_product_date;
ALTER TABLE public.market_price_observations
  DROP COLUMN IF EXISTS owner_tenant_id;

-- 4. Restore market_products policies & index
DROP POLICY IF EXISTS market_products_update_staff ON public.market_products;
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
