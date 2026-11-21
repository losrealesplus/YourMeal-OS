-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR3A: MULTI-TENANT SECURITY, INDEPENDENT MODULE
-- ACTIVATION & ECONOMIC INTEGRITY GUARDS
-- Additive migration on top of PR2 (20261112200000_cr_cost_05_pr2_physical_geo_fiscal_contract.sql).
-- Scope: PR3A ONLY — Zero new UI, zero cost comparators, zero external connectors.
-- ============================================================================

-- 1. Extend public.market_products with owner_tenant_id for tenant-private catalog items
ALTER TABLE public.market_products
  ADD COLUMN IF NOT EXISTS owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Drop global unique constraint on (source_id, external_sku) so tenants can register private SKUs
ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS uq_market_products_source_sku;

-- Add partial unique indexes for Core Public vs Tenant-Private SKUs
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_public_source_sku
  ON public.market_products(source_id, external_sku)
  WHERE owner_tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_tenant_source_sku
  ON public.market_products(owner_tenant_id, source_id, external_sku)
  WHERE owner_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_market_products_owner_tenant
  ON public.market_products(owner_tenant_id);

-- 2. Seed Independent Pilot Feature Flags (Fail-Closed Default = false)
INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'admin_module_cost_intelligence',
  'Operational Cost Intelligence Cockpit, economic studies, and margin simulation',
  false,
  NULL,
  '{"module": "cost_intelligence", "tier": "operations"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags
  WHERE key = 'admin_module_cost_intelligence' AND tenant_id IS NULL
);

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'admin_module_market_intelligence',
  'Market Intelligence multi-provider benchmarking, catalog ingestion, and private pricing',
  false,
  NULL,
  '{"module": "market_intelligence", "tier": "operations"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags
  WHERE key = 'admin_module_market_intelligence' AND tenant_id IS NULL
);

-- 3. Security Helper Functions

-- Evaluates feature flags for a tenant, falling back to global flag if tenant-specific row is absent
CREATE OR REPLACE FUNCTION public.is_tenant_module_enabled(p_tenant_id uuid, p_module_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_enabled boolean;
BEGIN
  IF p_tenant_id IS NULL THEN
    SELECT enabled INTO v_enabled
    FROM public.feature_flags
    WHERE key = p_module_key
      AND tenant_id IS NULL
    LIMIT 1;
    RETURN COALESCE(v_enabled, false);
  END IF;

  -- 1. Check tenant override
  SELECT enabled INTO v_enabled
  FROM public.feature_flags
  WHERE key = p_module_key
    AND tenant_id = p_tenant_id
  LIMIT 1;

  IF v_enabled IS NOT NULL THEN
    RETURN v_enabled;
  END IF;

  -- 2. Fallback to global flag
  SELECT enabled INTO v_enabled
  FROM public.feature_flags
  WHERE key = p_module_key
    AND tenant_id IS NULL
  LIMIT 1;

  RETURN COALESCE(v_enabled, false);
END;
$$;

-- Evaluates if user belongs to authorized private roles:
-- company_admin, operations_manager, purchasing, accounting, inventory, production.
-- Excludes kitchen, delivery, logistics, support, employee, customer, driver.
CREATE OR REPLACE FUNCTION public.has_cost_intelligence_access(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_saas_admin(p_user_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_members tm
    JOIN public.user_roles ur
      ON ur.tenant_id = tm.tenant_id
     AND ur.user_id = tm.user_id
    WHERE tm.user_id = p_user_id
      AND tm.tenant_id = p_tenant_id
      AND tm.status = 'approved'
      AND tm.deleted_at IS NULL
      AND ur.role IN (
        'company_admin',
        'operations_manager',
        'purchasing',
        'accounting',
        'inventory',
        'production'
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_tenant_module_enabled(uuid, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_cost_intelligence_access(uuid, uuid) TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_products TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;

-- 4. Harden RLS on public.market_products
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_products_read_auth ON public.market_products;
CREATE POLICY market_products_read_auth ON public.market_products
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
  );

DROP POLICY IF EXISTS market_products_write_staff ON public.market_products;
DROP POLICY IF EXISTS market_products_insert_staff ON public.market_products;
CREATE POLICY market_products_insert_staff ON public.market_products
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

DROP POLICY IF EXISTS market_products_update_staff ON public.market_products;
CREATE POLICY market_products_update_staff ON public.market_products
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

DROP POLICY IF EXISTS market_products_delete_staff ON public.market_products;
CREATE POLICY market_products_delete_staff ON public.market_products
  FOR DELETE TO authenticated
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
  );

-- 5. Harden RLS on public.market_price_observations
ALTER TABLE public.market_price_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_price_obs_read_auth ON public.market_price_observations;
CREATE POLICY market_price_obs_read_auth ON public.market_price_observations
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
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
    AND EXISTS (
      SELECT 1 FROM public.market_products mp
      WHERE mp.id = market_price_observations.market_product_id
        AND (
          mp.owner_tenant_id IS NULL
          OR (
            market_price_observations.owner_tenant_id IS NOT NULL
            AND mp.owner_tenant_id = market_price_observations.owner_tenant_id
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
        AND public.has_cost_intelligence_access(auth.uid(), market_price_observations.owner_tenant_id)
        AND public.is_tenant_module_enabled(market_price_observations.owner_tenant_id, 'admin_module_market_intelligence')
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

-- Strengthen public raw payload constraint to disallow rawLine / raw_line
ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_public_raw_payload_no_tenant_leak;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_public_raw_payload_no_tenant_leak CHECK (
    owner_tenant_id IS NOT NULL
    OR raw_payload IS NULL
    OR NOT (raw_payload ?| ARRAY['tenantId', 'tenant_id', 'ownerTenantId', 'owner_tenant_id', 'privateConditions', 'rawLine', 'raw_line'])
  );

-- 6. Harden RLS on public.market_establishments
ALTER TABLE public.market_establishments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_establishments_read_auth ON public.market_establishments;
CREATE POLICY market_establishments_read_auth ON public.market_establishments
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
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
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
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
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
  );

-- 7. Harden RLS on public.market_delivery_coverages
ALTER TABLE public.market_delivery_coverages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_delivery_coverages_read_auth ON public.market_delivery_coverages;
CREATE POLICY market_delivery_coverages_read_auth ON public.market_delivery_coverages
  FOR SELECT TO authenticated
  USING (
    owner_tenant_id IS NULL
    OR public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
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
        AND public.has_cost_intelligence_access(auth.uid(), market_delivery_coverages.owner_tenant_id)
        AND public.is_tenant_module_enabled(market_delivery_coverages.owner_tenant_id, 'admin_module_market_intelligence')
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
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
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
        AND public.has_cost_intelligence_access(auth.uid(), market_delivery_coverages.owner_tenant_id)
        AND public.is_tenant_module_enabled(market_delivery_coverages.owner_tenant_id, 'admin_module_market_intelligence')
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
      AND public.has_cost_intelligence_access(auth.uid(), owner_tenant_id)
      AND public.is_tenant_module_enabled(owner_tenant_id, 'admin_module_market_intelligence')
    )
  );

-- 8. Harden RLS on public.market_volume_tiers
ALTER TABLE public.market_volume_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS market_volume_tiers_read_auth ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_read_auth ON public.market_volume_tiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.market_price_observations mpo
      WHERE mpo.id = observation_id
        AND (
          mpo.owner_tenant_id IS NULL
          OR public.has_cost_intelligence_access(auth.uid(), mpo.owner_tenant_id)
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
            AND public.has_cost_intelligence_access(auth.uid(), mpo.owner_tenant_id)
            AND public.is_tenant_module_enabled(mpo.owner_tenant_id, 'admin_module_market_intelligence')
          )
        )
    )
  );

DROP POLICY IF EXISTS market_volume_tiers_update_staff ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_update_staff ON public.market_volume_tiers
  FOR UPDATE TO authenticated
  USING (
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
            AND public.has_cost_intelligence_access(auth.uid(), mpo.owner_tenant_id)
            AND public.is_tenant_module_enabled(mpo.owner_tenant_id, 'admin_module_market_intelligence')
          )
        )
    )
  )
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
            AND public.has_cost_intelligence_access(auth.uid(), mpo.owner_tenant_id)
            AND public.is_tenant_module_enabled(mpo.owner_tenant_id, 'admin_module_market_intelligence')
          )
        )
    )
  );

DROP POLICY IF EXISTS market_volume_tiers_delete_staff ON public.market_volume_tiers;
CREATE POLICY market_volume_tiers_delete_staff ON public.market_volume_tiers
  FOR DELETE TO authenticated
  USING (
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
            AND public.has_cost_intelligence_access(auth.uid(), mpo.owner_tenant_id)
            AND public.is_tenant_module_enabled(mpo.owner_tenant_id, 'admin_module_market_intelligence')
          )
        )
    )
  );

-- 9. Harden RLS on public.product_mappings (Cost Intelligence Gated + Cross-Tenant Product Isolation)
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_mappings_tenant_read ON public.product_mappings;
CREATE POLICY product_mappings_tenant_read ON public.product_mappings
  FOR SELECT TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS product_mappings_tenant_insert ON public.product_mappings;
CREATE POLICY product_mappings_tenant_insert ON public.product_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
    AND EXISTS (
      SELECT 1 FROM public.market_products mp
      WHERE mp.id = product_mappings.market_product_id
        AND (mp.owner_tenant_id IS NULL OR mp.owner_tenant_id = product_mappings.tenant_id)
    )
  );

DROP POLICY IF EXISTS product_mappings_tenant_update ON public.product_mappings;
CREATE POLICY product_mappings_tenant_update ON public.product_mappings
  FOR UPDATE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  )
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
    AND EXISTS (
      SELECT 1 FROM public.market_products mp
      WHERE mp.id = product_mappings.market_product_id
        AND (mp.owner_tenant_id IS NULL OR mp.owner_tenant_id = product_mappings.tenant_id)
    )
  );

DROP POLICY IF EXISTS product_mappings_tenant_delete ON public.product_mappings;
CREATE POLICY product_mappings_tenant_delete ON public.product_mappings
  FOR DELETE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

-- 10. Cost Simulation Scenarios & Decision Intents RLS Hardening (Cost Intelligence Gated)
ALTER TABLE public.cost_simulation_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cost_simulation_scenarios_staff ON public.cost_simulation_scenarios;
DROP POLICY IF EXISTS cost_simulation_scenarios_read ON public.cost_simulation_scenarios;
CREATE POLICY cost_simulation_scenarios_read ON public.cost_simulation_scenarios
  FOR SELECT TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS cost_simulation_scenarios_insert ON public.cost_simulation_scenarios;
CREATE POLICY cost_simulation_scenarios_insert ON public.cost_simulation_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS cost_simulation_scenarios_update ON public.cost_simulation_scenarios;
CREATE POLICY cost_simulation_scenarios_update ON public.cost_simulation_scenarios
  FOR UPDATE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  )
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS cost_simulation_scenarios_delete ON public.cost_simulation_scenarios;
CREATE POLICY cost_simulation_scenarios_delete ON public.cost_simulation_scenarios
  FOR DELETE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

ALTER TABLE public.cost_decision_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cost_decision_intents_staff ON public.cost_decision_intents;
DROP POLICY IF EXISTS cost_decision_intents_read ON public.cost_decision_intents;
CREATE POLICY cost_decision_intents_read ON public.cost_decision_intents
  FOR SELECT TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS cost_decision_intents_insert ON public.cost_decision_intents;
CREATE POLICY cost_decision_intents_insert ON public.cost_decision_intents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS cost_decision_intents_update ON public.cost_decision_intents;
CREATE POLICY cost_decision_intents_update ON public.cost_decision_intents
  FOR UPDATE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  )
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS cost_decision_intents_delete ON public.cost_decision_intents;
CREATE POLICY cost_decision_intents_delete ON public.cost_decision_intents
  FOR DELETE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

-- 11. Economic Studies RLS Hardening (Cost Intelligence Gated)
ALTER TABLE public.economic_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS economic_studies_tenant_isolation ON public.economic_studies;
DROP POLICY IF EXISTS economic_studies_read ON public.economic_studies;
CREATE POLICY economic_studies_read ON public.economic_studies
  FOR SELECT TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS economic_studies_insert ON public.economic_studies;
CREATE POLICY economic_studies_insert ON public.economic_studies
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS economic_studies_update ON public.economic_studies;
CREATE POLICY economic_studies_update ON public.economic_studies
  FOR UPDATE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  )
  WITH CHECK (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );

DROP POLICY IF EXISTS economic_studies_delete ON public.economic_studies;
CREATE POLICY economic_studies_delete ON public.economic_studies
  FOR DELETE TO authenticated
  USING (
    public.has_cost_intelligence_access(auth.uid(), tenant_id)
    AND public.is_tenant_module_enabled(tenant_id, 'admin_module_cost_intelligence')
  );
