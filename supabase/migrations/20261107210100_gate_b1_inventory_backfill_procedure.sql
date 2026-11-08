-- ============================================================================
-- Migration: 20261107210100_gate_b1_inventory_backfill_procedure.sql
-- Subsystem: YourMeal OS Core / Inventory (Gate B · PR B1)
-- Scope:
--   1. Inventory backfill audit discrepancy ledger (inventory_backfill_discrepancies)
--   2. Surgical execution tracking table (inventory_backfill_executions)
--   3. Idempotent forward backfill procedure (execute_gate_b1_backfill_v1)
--   4. Surgical rollback procedure (rollback_gate_b1_backfill_v1)
-- ============================================================================

-- 1. Table: Inventory Backfill Audit Discrepancies
CREATE TABLE IF NOT EXISTS public.inventory_backfill_discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  legacy_stock_quantity numeric(12,3) NOT NULL,
  initialized_physical_stock numeric(12,3) NOT NULL DEFAULT 0.000,
  discrepancy_quantity numeric(12,3) NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_AUDIT_REGULARIZATION'
    CHECK (status IN ('PENDING_AUDIT_REGULARIZATION', 'RESOLVED_BY_ADJUSTMENT', 'RESOLVED_BY_RECEIPT')),
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_backfill_discrepancies_tenant
  ON public.inventory_backfill_discrepancies (tenant_id, status);

-- 2. Table: Inventory Backfill Execution Ledger (for Surgical Rollbacks)
CREATE TABLE IF NOT EXISTS public.inventory_backfill_executions (
  execution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_center_id uuid REFERENCES public.production_centers(id) ON DELETE SET NULL,
  created_warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  created_location_id uuid REFERENCES public.inventory_locations(id) ON DELETE SET NULL,
  migrated_balance_ids uuid[] NOT NULL DEFAULT '{}',
  discrepancy_ids uuid[] NOT NULL DEFAULT '{}',
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_backfill_executions_tenant
  ON public.inventory_backfill_executions (tenant_id);

-- 3. RLS for Audit and Execution Tables
ALTER TABLE public.inventory_backfill_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_backfill_executions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.inventory_backfill_discrepancies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inventory_backfill_discrepancies TO authenticated;
GRANT ALL ON public.inventory_backfill_discrepancies TO service_role;

DROP POLICY IF EXISTS discrepancies_admin_select ON public.inventory_backfill_discrepancies;
CREATE POLICY discrepancies_admin_select ON public.inventory_backfill_discrepancies 
FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

REVOKE ALL ON public.inventory_backfill_executions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inventory_backfill_executions TO authenticated;
GRANT ALL ON public.inventory_backfill_executions TO service_role;

DROP POLICY IF EXISTS executions_admin_select ON public.inventory_backfill_executions;
CREATE POLICY executions_admin_select ON public.inventory_backfill_executions 
FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

-- 4. Forward Backfill Procedure
CREATE OR REPLACE FUNCTION public.execute_gate_b1_backfill_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_tenant RECORD;
  v_center_id uuid;
  v_warehouse_id uuid;
  v_location_id uuid;
  v_exec_id uuid;
  v_ing RECORD;
  v_bal_id uuid;
  v_disc_id uuid;
  v_created_center_id uuid;
  v_created_wh_id uuid;
  v_created_loc_id uuid;
  v_migrated_balances uuid[];
  v_discrepancies uuid[];
  v_total_migrated integer := 0;
  v_total_discrepancies integer := 0;
  v_total_executions integer := 0;
BEGIN
  -- Restrict execution to saas_admin or service_role
  IF v_actor IS NOT NULL AND NOT public.is_saas_admin(v_actor) THEN
    RAISE EXCEPTION 'only saas_admin or system migrations can execute backfill' USING ERRCODE = '42501';
  END IF;

  -- Advisory lock to prevent race conditions during backfill
  PERFORM pg_advisory_xact_lock(hashtextextended('gate_b1_backfill_lock', 0));

  FOR v_tenant IN SELECT id, name FROM public.tenants LOOP
    v_exec_id := gen_random_uuid();
    v_migrated_balances := '{}';
    v_discrepancies := '{}';
    v_created_center_id := NULL;
    v_created_wh_id := NULL;
    v_created_loc_id := NULL;

    -- 1. Center: Detect if already exists or create new
    SELECT id INTO v_center_id FROM public.production_centers 
    WHERE tenant_id = v_tenant.id AND code = 'CENTRO-PRINCIPAL';
    
    IF v_center_id IS NULL THEN
      INSERT INTO public.production_centers (tenant_id, code, name, is_active)
      VALUES (v_tenant.id, 'CENTRO-PRINCIPAL', 'Centro Principal ' || v_tenant.name, true)
      RETURNING id INTO v_center_id;
      v_created_center_id := v_center_id;
    END IF;

    -- 2. Warehouse: Detect if already exists or create new
    SELECT id INTO v_warehouse_id FROM public.warehouses 
    WHERE tenant_id = v_tenant.id AND center_id = v_center_id AND code = 'ALM-GENERAL';
    
    IF v_warehouse_id IS NULL THEN
      INSERT INTO public.warehouses (tenant_id, center_id, code, name, warehouse_type, is_active)
      VALUES (v_tenant.id, v_center_id, 'ALM-GENERAL', 'Almacén General', 'DRY_STORAGE', true)
      RETURNING id INTO v_warehouse_id;
      v_created_wh_id := v_warehouse_id;
    END IF;

    -- 3. Location: Detect if already exists or create new
    SELECT id INTO v_location_id FROM public.inventory_locations 
    WHERE tenant_id = v_tenant.id AND warehouse_id = v_warehouse_id AND code = 'UBI-DEFAULT';
    
    IF v_location_id IS NULL THEN
      INSERT INTO public.inventory_locations (tenant_id, center_id, warehouse_id, code, name, is_default, is_active)
      VALUES (v_tenant.id, v_center_id, v_warehouse_id, 'UBI-DEFAULT', 'Ubicación General', true, true)
      RETURNING id INTO v_location_id;
      v_created_loc_id := v_location_id;
    END IF;

    -- 4. Migrate Ingredients
    FOR v_ing IN 
      SELECT id, stock, cost FROM public.ingredients 
      WHERE tenant_id = v_tenant.id AND deleted_at IS NULL
    LOOP
      -- Branch A: Legacy Negative Stock (Discrepancy Audit Preservation)
      IF v_ing.stock < 0.000 THEN
        INSERT INTO public.inventory_balances (
          tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity
        ) VALUES (
          v_tenant.id, v_center_id, v_warehouse_id, v_location_id, v_ing.id, 0.000
        )
        ON CONFLICT (tenant_id, location_id, ingredient_id) DO NOTHING
        RETURNING id INTO v_bal_id;

        IF v_bal_id IS NOT NULL THEN
          v_migrated_balances := array_append(v_migrated_balances, v_bal_id);
          v_total_migrated := v_total_migrated + 1;

          -- Record formal audit discrepancy only on initial creation
          INSERT INTO public.inventory_backfill_discrepancies (
            tenant_id, ingredient_id, legacy_stock_quantity, initialized_physical_stock,
            discrepancy_quantity, notes
          ) VALUES (
            v_tenant.id, v_ing.id, v_ing.stock, 0.000, abs(v_ing.stock),
            'LEGACY_NEGATIVE_STOCK: Saldo negativo original preservado para regularización contable'
          ) RETURNING id INTO v_disc_id;

          v_discrepancies := array_append(v_discrepancies, v_disc_id);
          v_total_discrepancies := v_total_discrepancies + 1;
        END IF;

      -- Branch B: Positive or Zero Stock
      ELSE
        INSERT INTO public.inventory_balances (
          tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity
        ) VALUES (
          v_tenant.id, v_center_id, v_warehouse_id, v_location_id, v_ing.id, COALESCE(v_ing.stock, 0.000)
        )
        ON CONFLICT (tenant_id, location_id, ingredient_id) DO NOTHING
        RETURNING id INTO v_bal_id;

        IF v_bal_id IS NOT NULL THEN
          v_migrated_balances := array_append(v_migrated_balances, v_bal_id);
          v_total_migrated := v_total_migrated + 1;
        END IF;
      END IF;
    END LOOP;

    -- Record execution receipt for surgical rollback
    INSERT INTO public.inventory_backfill_executions (
      execution_id, tenant_id, created_center_id, created_warehouse_id, created_location_id,
      migrated_balance_ids, discrepancy_ids
    ) VALUES (
      v_exec_id, v_tenant.id, v_created_center_id, v_created_wh_id, v_created_loc_id,
      v_migrated_balances, v_discrepancies
    );

    v_total_executions := v_total_executions + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_tenants_processed', v_total_executions,
    'total_balances_migrated', v_total_migrated,
    'discrepancies_registered', v_total_discrepancies
  );
END;
$$;

REVOKE ALL ON FUNCTION public.execute_gate_b1_backfill_v1() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_gate_b1_backfill_v1() TO authenticated, service_role;

-- 5. Surgical Rollback Procedure
CREATE OR REPLACE FUNCTION public.rollback_gate_b1_backfill_v1(p_execution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_rec public.inventory_backfill_executions%ROWTYPE;
BEGIN
  IF v_actor IS NOT NULL AND NOT public.is_saas_admin(v_actor) THEN
    RAISE EXCEPTION 'only saas_admin or system migrations can execute backfill rollback' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_rec FROM public.inventory_backfill_executions 
  WHERE execution_id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backfill execution % not found', p_execution_id USING ERRCODE = 'P0002';
  END IF;

  -- 1. Delete balances migrated in this specific execution
  IF array_length(v_rec.migrated_balance_ids, 1) > 0 THEN
    DELETE FROM public.inventory_balances 
    WHERE id = ANY(v_rec.migrated_balance_ids);
  END IF;

  -- 2. Delete discrepancies created in this specific execution
  IF array_length(v_rec.discrepancy_ids, 1) > 0 THEN
    DELETE FROM public.inventory_backfill_discrepancies
    WHERE id = ANY(v_rec.discrepancy_ids);
  END IF;

  -- 3. Delete location ONLY if created during this execution
  IF v_rec.created_location_id IS NOT NULL THEN
    DELETE FROM public.inventory_locations WHERE id = v_rec.created_location_id;
  END IF;

  -- 4. Delete warehouse ONLY if created during this execution
  IF v_rec.created_warehouse_id IS NOT NULL THEN
    DELETE FROM public.warehouses WHERE id = v_rec.created_warehouse_id;
  END IF;

  -- 5. Delete center ONLY if created during this execution
  IF v_rec.created_center_id IS NOT NULL THEN
    DELETE FROM public.production_centers WHERE id = v_rec.created_center_id;
  END IF;

  -- 6. Delete execution ledger record
  DELETE FROM public.inventory_backfill_executions WHERE execution_id = p_execution_id;

  RETURN jsonb_build_object(
    'success', true, 
    'rolled_back_execution', p_execution_id,
    'deleted_balances_count', COALESCE(array_length(v_rec.migrated_balance_ids, 1), 0),
    'deleted_discrepancies_count', COALESCE(array_length(v_rec.discrepancy_ids, 1), 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_gate_b1_backfill_v1(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rollback_gate_b1_backfill_v1(uuid) TO authenticated, service_role;
