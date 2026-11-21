-- ============================================================================
-- YOURMEAL OS — CR-COST-05 PR3A ROLLBACK (DOWN MIGRATION)
-- Reverts: 20261112220000_cr_cost_05_pr3a_multi_tenant_security.sql
-- Restores PR2 baseline state.
-- ============================================================================

-- 0. Fail-Closed Preflight Guard: Abort if tenant-private products exist to prevent silent data destruction
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.market_products WHERE owner_tenant_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Cannot rollback PR3A: found tenant-private market_products (owner_tenant_id IS NOT NULL). Manual migration/cleanup required to prevent data loss.'
      USING ERRCODE = 'restrict_violation';
  END IF;
END $$;

-- 1. Revert public.economic_studies policies
DROP POLICY IF EXISTS economic_studies_read ON public.economic_studies;
DROP POLICY IF EXISTS economic_studies_insert ON public.economic_studies;
DROP POLICY IF EXISTS economic_studies_update ON public.economic_studies;
DROP POLICY IF EXISTS economic_studies_delete ON public.economic_studies;
DROP POLICY IF EXISTS economic_studies_tenant_isolation ON public.economic_studies;
CREATE POLICY economic_studies_tenant_isolation ON public.economic_studies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = economic_studies.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = economic_studies.tenant_id
    )
  );

-- 2. Revert public.cost_decision_intents policies
DROP POLICY IF EXISTS cost_decision_intents_read ON public.cost_decision_intents;
DROP POLICY IF EXISTS cost_decision_intents_insert ON public.cost_decision_intents;
DROP POLICY IF EXISTS cost_decision_intents_update ON public.cost_decision_intents;
DROP POLICY IF EXISTS cost_decision_intents_delete ON public.cost_decision_intents;
DROP POLICY IF EXISTS cost_decision_intents_staff ON public.cost_decision_intents;
CREATE POLICY cost_decision_intents_staff ON public.cost_decision_intents
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

-- 3. Revert public.cost_simulation_scenarios policies
DROP POLICY IF EXISTS cost_simulation_scenarios_read ON public.cost_simulation_scenarios;
DROP POLICY IF EXISTS cost_simulation_scenarios_insert ON public.cost_simulation_scenarios;
DROP POLICY IF EXISTS cost_simulation_scenarios_update ON public.cost_simulation_scenarios;
DROP POLICY IF EXISTS cost_simulation_scenarios_delete ON public.cost_simulation_scenarios;
DROP POLICY IF EXISTS cost_simulation_scenarios_staff ON public.cost_simulation_scenarios;
CREATE POLICY cost_simulation_scenarios_staff ON public.cost_simulation_scenarios
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

-- 4. Revert public.product_mappings policies
DROP POLICY IF EXISTS product_mappings_tenant_read ON public.product_mappings;
CREATE POLICY product_mappings_tenant_read ON public.product_mappings
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  );

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

-- 5. Revert public.market_volume_tiers policies
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

DROP POLICY IF EXISTS market_volume_tiers_update_staff ON public.market_volume_tiers;
DROP POLICY IF EXISTS market_volume_tiers_delete_staff ON public.market_volume_tiers;

-- 6. Revert public.market_delivery_coverages policies
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

-- 7. Revert public.market_establishments policies
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

-- 8. Revert public.market_price_observations policies & raw payload constraint
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

ALTER TABLE public.market_price_observations
  DROP CONSTRAINT IF EXISTS check_mpo_public_raw_payload_no_tenant_leak;
ALTER TABLE public.market_price_observations
  ADD CONSTRAINT check_mpo_public_raw_payload_no_tenant_leak CHECK (
    owner_tenant_id IS NOT NULL
    OR raw_payload IS NULL
    OR NOT (raw_payload ?| ARRAY['tenantId', 'tenant_id', 'ownerTenantId', 'owner_tenant_id', 'privateConditions'])
  );

-- 9. Revert public.market_products policies and columns
DROP POLICY IF EXISTS market_products_read_auth ON public.market_products;
CREATE POLICY market_products_read_auth ON public.market_products
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS market_products_insert_staff ON public.market_products;
DROP POLICY IF EXISTS market_products_delete_staff ON public.market_products;
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

DROP INDEX IF EXISTS public.uq_market_products_public_source_sku;
DROP INDEX IF EXISTS public.uq_market_products_tenant_source_sku;
DROP INDEX IF EXISTS public.idx_market_products_owner_tenant;

ALTER TABLE public.market_products
  DROP CONSTRAINT IF EXISTS uq_market_products_source_sku;
ALTER TABLE public.market_products
  ADD CONSTRAINT uq_market_products_source_sku UNIQUE (source_id, external_sku);

ALTER TABLE public.market_products
  DROP COLUMN IF EXISTS owner_tenant_id;

-- 10. Drop Security Helper Functions & Revoke Extended Grants
REVOKE DELETE ON public.market_products FROM authenticated;
DROP FUNCTION IF EXISTS public.has_cost_intelligence_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_tenant_module_enabled(uuid, text);

-- 11. Delete seeded feature flags
DELETE FROM public.feature_flags
WHERE key IN ('admin_module_cost_intelligence', 'admin_module_market_intelligence')
  AND tenant_id IS NULL;
