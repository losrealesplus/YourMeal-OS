-- YourMeal OS: soft delete, audit_log, feature_flags
-- @see docs/adr/0006-soft-delete-audit.md
-- @see docs/adr/0007-feature-flags.md

-- ============ SOFT DELETE COLUMNS ============
-- Business records are never permanently deleted via application flows.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_phones ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_departments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_employees ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.weekly_menus ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.support_notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS dishes_tenant_active_idx
  ON public.dishes (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ingredients_tenant_active_idx
  ON public.ingredients (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_tenant_active_idx
  ON public.orders (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_tenant_active_idx
  ON public.customers (tenant_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS dishes_touch_updated_at ON public.dishes;
CREATE TRIGGER dishes_touch_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AUDIT LOG ============

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_created_idx
  ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON public.audit_log (entity_type, entity_id);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_read ON public.audit_log;
CREATE POLICY audit_log_read ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_saas_admin(auth.uid())
    OR (
      tenant_id IS NOT NULL
      AND public.has_role(auth.uid(), tenant_id, 'company_admin')
    )
  );

DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.is_saas_admin(auth.uid())
      OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))
    )
  );

-- ============ FEATURE FLAGS ============

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  -- NULL tenant_id = global / platform flag; set for tenant override
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Free-form: plan keys, rollout %, beta cohorts, etc.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NULLs are distinct in UNIQUE constraints; use partial indexes instead
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_global_key_uidx
  ON public.feature_flags (key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_tenant_key_uidx
  ON public.feature_flags (tenant_id, key) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS feature_flags_tenant_idx
  ON public.feature_flags (tenant_id);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_read ON public.feature_flags;
CREATE POLICY feature_flags_read ON public.feature_flags FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid()))
  WITH CHECK (public.is_saas_admin(auth.uid()));

DROP TRIGGER IF EXISTS feature_flags_touch_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_touch_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed: Dish Library flag enabled globally (first module)
INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'dish_library',
  'Dish Library module — heart of the domain model',
  true,
  NULL,
  '{"module":"catalog","phase":"first"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'dish_library' AND tenant_id IS NULL
);
