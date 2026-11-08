-- ============================================================================
-- Migration: 20261107210000_gate_b1_spatial_topology_and_inventory_balances.sql
-- Subsystem: YourMeal OS Core / Inventory (Gate B · PR B1)
-- Scope:
--   1. Enforce unique tenant composite key on ingredients
--   2. Spatial topology hierarchy: production_centers -> warehouses -> inventory_locations
--   3. Composite Foreign Keys enforcing multi-tenant & multi-center integrity
--   4. Canonical inventory balances (CHECK >= 0.000)
--   5. User-center RBAC assignments
--   6. Strict RLS policies by tenant and center
--   7. Read-only compatibility view v_ingredient_stocks
--   8. Spatial RPC contracts (get_ingredient_balances_v1, assign_user_to_center_v1, provision_initial_tenant_center_v1)
-- ============================================================================

-- 1. Ensure composite unique constraint on public.ingredients (tenant_id, id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_ingredients_tenant_id'
  ) THEN
    ALTER TABLE public.ingredients 
      ADD CONSTRAINT uq_ingredients_tenant_id UNIQUE (tenant_id, id);
  END IF;
END $$;

-- 2. Warehouse Type Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warehouse_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.warehouse_type AS ENUM (
      'DRY_STORAGE',     -- Almacén seco / economato
      'COLD_ROOM',       -- Cámara de refrigeración (+4 °C)
      'FREEZER',         -- Cámara de congelación (-18 °C)
      'KITCHEN_STAGE',   -- Zona de pase / mise en place
      'TRANSIT'          -- Almacén virtual para transferencias en ruta
    );
  END IF;
END $$;

-- 3. Production Centers (production_centers)
CREATE TABLE IF NOT EXISTS public.production_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_production_center_code UNIQUE (tenant_id, code),
  CONSTRAINT uq_production_centers_composite UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_production_centers_tenant 
  ON public.production_centers (tenant_id);

-- 4. Warehouses (warehouses)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  center_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  warehouse_type public.warehouse_type NOT NULL DEFAULT 'DRY_STORAGE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_warehouse_code UNIQUE (tenant_id, center_id, code),
  CONSTRAINT fk_warehouses_center_composite 
    FOREIGN KEY (tenant_id, center_id) 
    REFERENCES public.production_centers (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_warehouses_composite UNIQUE (tenant_id, center_id, id)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_center 
  ON public.warehouses (tenant_id, center_id);

-- 5. Inventory Locations (inventory_locations)
CREATE TABLE IF NOT EXISTS public.inventory_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  center_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_transit boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_inventory_location_code UNIQUE (tenant_id, warehouse_id, code),
  CONSTRAINT fk_inventory_locations_warehouse_composite 
    FOREIGN KEY (tenant_id, center_id, warehouse_id) 
    REFERENCES public.warehouses (tenant_id, center_id, id) ON DELETE CASCADE,
  CONSTRAINT uq_inventory_locations_composite UNIQUE (tenant_id, center_id, warehouse_id, id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_locations_lookup 
  ON public.inventory_locations (tenant_id, warehouse_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouse_single_default_location
  ON public.inventory_locations (tenant_id, warehouse_id)
  WHERE is_default = true;

-- 6. Canonical Inventory Balances (inventory_balances)
CREATE TABLE IF NOT EXISTS public.inventory_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  center_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  location_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  stock_quantity numeric(12,3) NOT NULL DEFAULT 0.000,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_balance_non_negative CHECK (stock_quantity >= 0.000),
  CONSTRAINT uq_inventory_balance_location UNIQUE (tenant_id, location_id, ingredient_id),
  CONSTRAINT fk_inventory_balances_location_composite 
    FOREIGN KEY (tenant_id, center_id, warehouse_id, location_id) 
    REFERENCES public.inventory_locations (tenant_id, center_id, warehouse_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_balances_ingredient_composite
    FOREIGN KEY (tenant_id, ingredient_id)
    REFERENCES public.ingredients (tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_balances_lookup 
  ON public.inventory_balances (tenant_id, ingredient_id, center_id);

CREATE INDEX IF NOT EXISTS idx_inventory_balances_location 
  ON public.inventory_balances (tenant_id, location_id);

-- 7. User-Center Assignments for RBAC (user_center_assignments)
CREATE TABLE IF NOT EXISTS public.user_center_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  center_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_user_center UNIQUE (tenant_id, user_id, center_id),
  CONSTRAINT fk_user_center_assignment_composite
    FOREIGN KEY (tenant_id, center_id)
    REFERENCES public.production_centers (tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_center_lookup 
  ON public.user_center_assignments (tenant_id, user_id);

-- 8. Center Access Evaluation Helper Function
CREATE OR REPLACE FUNCTION public.has_center_access(
  _user_id uuid,
  _tenant_id uuid,
  _center_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF _user_id IS NULL OR _tenant_id IS NULL OR _center_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. SaaS admin has universal access
  IF public.is_saas_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- 2. User must be an approved member of the tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
      AND status = 'approved' AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;

  -- 3. company_admin has access to all centers within their tenant
  IF public.has_role(_user_id, _tenant_id, 'company_admin'::public.app_role) THEN
    RETURN true;
  END IF;

  -- 4. Check explicit user_center_assignments
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_center_assignments uca
    WHERE uca.tenant_id = _tenant_id
      AND uca.user_id = _user_id
      AND uca.center_id = _center_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_center_access(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_center_access(uuid, uuid, uuid) TO authenticated, service_role;

-- 9. Row Level Security Policies
ALTER TABLE public.production_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_center_assignments ENABLE ROW LEVEL SECURITY;

-- Production Centers RLS
REVOKE ALL ON public.production_centers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.production_centers TO authenticated;
GRANT ALL ON public.production_centers TO service_role;

DROP POLICY IF EXISTS centers_select ON public.production_centers;
CREATE POLICY centers_select ON public.production_centers FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role) OR
    public.has_center_access(auth.uid(), tenant_id, id)
  )
);

DROP POLICY IF EXISTS centers_admin_insert ON public.production_centers;
CREATE POLICY centers_admin_insert ON public.production_centers FOR INSERT TO authenticated WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS centers_admin_update ON public.production_centers;
CREATE POLICY centers_admin_update ON public.production_centers FOR UPDATE TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
) WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

-- Warehouses RLS
REVOKE ALL ON public.warehouses FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;

DROP POLICY IF EXISTS warehouses_select ON public.warehouses;
CREATE POLICY warehouses_select ON public.warehouses FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role) OR
    public.has_center_access(auth.uid(), tenant_id, center_id)
  )
);

DROP POLICY IF EXISTS warehouses_admin_insert ON public.warehouses;
CREATE POLICY warehouses_admin_insert ON public.warehouses FOR INSERT TO authenticated WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS warehouses_admin_update ON public.warehouses;
CREATE POLICY warehouses_admin_update ON public.warehouses FOR UPDATE TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
) WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

-- Inventory Locations RLS
REVOKE ALL ON public.inventory_locations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.inventory_locations TO authenticated;
GRANT ALL ON public.inventory_locations TO service_role;

DROP POLICY IF EXISTS locations_select ON public.inventory_locations;
CREATE POLICY locations_select ON public.inventory_locations FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role) OR
    public.has_center_access(auth.uid(), tenant_id, center_id)
  )
);

DROP POLICY IF EXISTS locations_admin_insert ON public.inventory_locations;
CREATE POLICY locations_admin_insert ON public.inventory_locations FOR INSERT TO authenticated WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS locations_admin_update ON public.inventory_locations;
CREATE POLICY locations_admin_update ON public.inventory_locations FOR UPDATE TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
) WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

-- Inventory Balances: Strict Direct-Write Protection (Read-Only to Authenticated)
REVOKE ALL ON public.inventory_balances FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inventory_balances TO authenticated;
GRANT ALL ON public.inventory_balances TO service_role;

DROP POLICY IF EXISTS balances_select ON public.inventory_balances;
CREATE POLICY balances_select ON public.inventory_balances FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role) OR
    public.has_center_access(auth.uid(), tenant_id, center_id)
  )
);

-- User Center Assignments RLS
REVOKE ALL ON public.user_center_assignments FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.user_center_assignments TO authenticated;
GRANT ALL ON public.user_center_assignments TO service_role;

DROP POLICY IF EXISTS user_center_select ON public.user_center_assignments;
CREATE POLICY user_center_select ON public.user_center_assignments FOR SELECT TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role) OR
    user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS user_center_admin_insert ON public.user_center_assignments;
CREATE POLICY user_center_admin_insert ON public.user_center_assignments FOR INSERT TO authenticated WITH CHECK (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS user_center_admin_delete ON public.user_center_assignments;
CREATE POLICY user_center_admin_delete ON public.user_center_assignments FOR DELETE TO authenticated USING (
  public.is_tenant_member(tenant_id) AND (
    public.is_saas_admin(auth.uid()) OR
    public.has_role(auth.uid(), tenant_id, 'company_admin'::public.app_role)
  )
);

-- 10. Read-only Compatibility View: v_ingredient_stocks
CREATE OR REPLACE VIEW public.v_ingredient_stocks
WITH (security_invoker = true) AS
SELECT 
  i.tenant_id,
  i.id AS ingredient_id,
  i.name AS ingredient_name,
  i.unit AS base_unit,
  i.cost AS unit_cost,
  COALESCE(SUM(b.stock_quantity), 0.000)::numeric(12,3) AS total_physical_stock
FROM public.ingredients i
LEFT JOIN public.inventory_balances b 
  ON b.ingredient_id = i.id AND b.tenant_id = i.tenant_id
WHERE i.deleted_at IS NULL
GROUP BY i.tenant_id, i.id, i.name, i.unit, i.cost;

REVOKE ALL ON public.v_ingredient_stocks FROM PUBLIC, anon;
GRANT SELECT ON public.v_ingredient_stocks TO authenticated;
GRANT ALL ON public.v_ingredient_stocks TO service_role;

-- 11. RPC: Provision Initial Tenant Center
CREATE OR REPLACE FUNCTION public.provision_initial_tenant_center_v1(
  p_tenant_id uuid,
  p_center_name text DEFAULT 'Centro Principal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_center_id uuid;
  v_warehouse_id uuid;
  v_location_id uuid;
BEGIN
  IF v_actor IS NOT NULL AND NOT public.is_saas_admin(v_actor) THEN
    RAISE EXCEPTION 'only saas_admin or system bootstrap can provision initial center' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'tenant % does not exist', p_tenant_id USING ERRCODE = 'P0002';
  END IF;

  -- 1. Create default center if not exists
  INSERT INTO public.production_centers (tenant_id, code, name, is_active)
  VALUES (p_tenant_id, 'CENTRO-PRINCIPAL', p_center_name, true)
  ON CONFLICT (tenant_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_center_id;

  -- 2. Create default warehouse
  INSERT INTO public.warehouses (tenant_id, center_id, code, name, warehouse_type, is_active)
  VALUES (p_tenant_id, v_center_id, 'ALM-GENERAL', 'Almacén General', 'DRY_STORAGE', true)
  ON CONFLICT (tenant_id, center_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_warehouse_id;

  -- 3. Create default location
  INSERT INTO public.inventory_locations (tenant_id, center_id, warehouse_id, code, name, is_default, is_active)
  VALUES (p_tenant_id, v_center_id, v_warehouse_id, 'UBI-DEFAULT', 'Ubicación General', true, true)
  ON CONFLICT (tenant_id, warehouse_id, code) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_location_id;

  RETURN jsonb_build_object(
    'success', true,
    'center_id', v_center_id,
    'warehouse_id', v_warehouse_id,
    'location_id', v_location_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_initial_tenant_center_v1(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provision_initial_tenant_center_v1(uuid, text) TO authenticated, service_role;

-- 12. RPC: Atomic Query of Ingredient Balances Across Centers/Locations
CREATE OR REPLACE FUNCTION public.get_ingredient_balances_v1(
  p_tenant_id uuid,
  p_ingredient_id uuid,
  p_center_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_tenant_member(p_tenant_id) THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'ingredient_id', p_ingredient_id,
    'total_stock', COALESCE(SUM(b.stock_quantity), 0.000),
    'locations', COALESCE(jsonb_agg(
      jsonb_build_object(
        'center_id', b.center_id,
        'center_name', c.name,
        'warehouse_id', b.warehouse_id,
        'warehouse_name', w.name,
        'location_id', b.location_id,
        'location_code', l.code,
        'stock_quantity', b.stock_quantity,
        'updated_at', b.updated_at
      ) ORDER BY c.name, w.name, l.code
    ) FILTER (WHERE b.id IS NOT NULL), '[]'::jsonb)
  ) INTO v_result
  FROM public.inventory_balances b
  JOIN public.production_centers c ON c.id = b.center_id
  JOIN public.warehouses w ON w.id = b.warehouse_id
  JOIN public.inventory_locations l ON l.id = b.location_id
  WHERE b.tenant_id = p_tenant_id 
    AND b.ingredient_id = p_ingredient_id
    AND (p_center_id IS NULL OR b.center_id = p_center_id)
    AND (
      public.is_saas_admin(v_actor) OR
      public.has_role(v_actor, p_tenant_id, 'company_admin'::public.app_role) OR
      public.has_center_access(v_actor, p_tenant_id, b.center_id)
    );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ingredient_balances_v1(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ingredient_balances_v1(uuid, uuid, uuid) TO authenticated, service_role;

-- 13. RPC: Governed User-Center Assignment (company_admin / saas_admin only)
CREATE OR REPLACE FUNCTION public.assign_user_to_center_v1(
  p_tenant_id uuid,
  p_target_user_id uuid,
  p_center_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT (
    public.is_saas_admin(v_actor) OR 
    (public.is_tenant_member(p_tenant_id) AND public.has_role(v_actor, p_tenant_id, 'company_admin'::public.app_role))
  ) THEN
    RAISE EXCEPTION 'insufficient privileges to assign center access' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.production_centers WHERE id = p_center_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'center not found for tenant' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_center_assignments (tenant_id, user_id, center_id, assigned_by)
  VALUES (p_tenant_id, p_target_user_id, p_center_id, v_actor)
  ON CONFLICT (tenant_id, user_id, center_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', p_target_user_id, 'center_id', p_center_id);
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_to_center_v1(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_to_center_v1(uuid, uuid, uuid) TO authenticated, service_role;
