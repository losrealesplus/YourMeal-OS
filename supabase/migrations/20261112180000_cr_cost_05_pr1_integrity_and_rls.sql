-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR1: INTEGRITY, RLS HARDENING & PRIVATE SCOPING
-- Additive migration on top of 20260927120000_food_market_intelligence_foundation.sql
-- Scope: Block 1 (PR1) ONLY — Zero Block 2 physical/fiscal schema changes.
-- ============================================================================

-- 1. Separate public shared observations (NULL) from private tenant tariffs (UUID)
ALTER TABLE public.market_price_observations
  ADD COLUMN IF NOT EXISTS owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Drop redundant non-unique index covered by uq_market_products_source_sku
DROP INDEX IF EXISTS public.idx_market_products_source_sku;

-- Add missing FK/lookup indexes
CREATE INDEX IF NOT EXISTS idx_market_volume_tiers_observation
  ON public.market_volume_tiers(observation_id);

CREATE INDEX IF NOT EXISTS idx_market_price_obs_owner_product_date
  ON public.market_price_observations(owner_tenant_id, market_product_id, observed_at DESC);

-- 2. Harden append-only immutability trigger with explicit search_path & ownership lock
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
    -- Prevent mutation of economic facts, capture timestamps, fingerprints, or ownership
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

-- 3. Permit targeted column-level UPDATE on validity & audit metadata only (for idempotent re-imports)
GRANT UPDATE (valid_to, quality_status, promotion_status, raw_payload)
  ON public.market_price_observations TO authenticated;

-- 4. Fix market_products RLS: approved active staff may insert new catalog SKUs; UPDATE of shared Core products is SaaS admin only
DROP POLICY IF EXISTS market_products_write_staff ON public.market_products;
CREATE POLICY market_products_write_staff ON public.market_products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'approved'
        AND tm.deleted_at IS NULL
        AND public.has_any_staff_role(auth.uid(), tm.tenant_id)
    )
  );

DROP POLICY IF EXISTS market_products_update_staff ON public.market_products;
CREATE POLICY market_products_update_staff ON public.market_products
  FOR UPDATE TO authenticated
  USING (
    public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    public.is_saas_admin(auth.uid())
  );

-- 5. Fix market_price_observations RLS:
--    - SELECT: public (owner_tenant_id IS NULL) OR tenant members of private owner_tenant_id
--    - INSERT / UPDATE of public rows (owner_tenant_id IS NULL): SaaS admin only
--    - INSERT / UPDATE of private tenant tariffs (owner_tenant_id IS NOT NULL): active approved staff of that tenant or SaaS admin
DROP POLICY IF EXISTS market_price_obs_read_auth ON public.market_price_observations;
CREATE POLICY market_price_obs_read_auth ON public.market_price_observations
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.is_tenant_member(owner_tenant_id)
  );

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

DROP POLICY IF EXISTS market_price_obs_update_staff ON public.market_price_observations;
CREATE POLICY market_price_obs_update_staff ON public.market_price_observations
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

-- 6. Fix market_volume_tiers RLS: scope SELECT to observation visibility & enforce SaaS-admin-only INSERT on public observations
DROP POLICY IF EXISTS market_volume_tiers_read_auth ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_read_auth ON public.market_volume_tiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.market_price_observations mpo
      WHERE mpo.id = observation_id
        AND (
          mpo.owner_tenant_id IS NULL
          OR public.is_tenant_member(mpo.owner_tenant_id)
        )
    )
  );

DROP POLICY IF EXISTS market_volume_tiers_insert_staff ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_insert_staff ON public.market_volume_tiers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.market_price_observations mpo
      WHERE mpo.id = observation_id
        AND (
          (
            mpo.owner_tenant_id IS NULL
            AND public.is_saas_admin(auth.uid())
          )
          OR (
            mpo.owner_tenant_id IS NOT NULL
            AND public.is_tenant_member(mpo.owner_tenant_id)
            AND (
              public.has_any_staff_role(auth.uid(), mpo.owner_tenant_id)
              OR public.is_saas_admin(auth.uid())
            )
          )
        )
    )
  );

-- 7. Split product_mappings FOR ALL policy so DELETE strictly enforces staff role
DROP POLICY IF EXISTS product_mappings_tenant_write ON public.product_mappings;

DROP POLICY IF EXISTS product_mappings_tenant_insert ON public.product_mappings;
CREATE POLICY product_mappings_tenant_insert ON public.product_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_any_staff_role(auth.uid(), tenant_id)
      OR public.is_saas_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS product_mappings_tenant_update ON public.product_mappings;
CREATE POLICY product_mappings_tenant_update ON public.product_mappings
  FOR UPDATE TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_any_staff_role(auth.uid(), tenant_id)
      OR public.is_saas_admin(auth.uid())
    )
  )
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_any_staff_role(auth.uid(), tenant_id)
      OR public.is_saas_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS product_mappings_tenant_delete ON public.product_mappings;
CREATE POLICY product_mappings_tenant_delete ON public.product_mappings
  FOR DELETE TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    AND (
      public.has_any_staff_role(auth.uid(), tenant_id)
      OR public.is_saas_admin(auth.uid())
    )
  );
