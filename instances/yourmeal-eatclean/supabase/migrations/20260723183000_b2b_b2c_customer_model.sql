-- B2B / B2C Customer Model — structural correction (ADR 0015)
-- Evolves foresight companies/* tables; does not break individual CJ-001.

-- ========== Company Account enrichment ==========
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_code text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS commercial_terms text,
  ADD COLUMN IF NOT EXISTS fiscal_address text,
  ADD COLUMN IF NOT EXISTS org_unit_label text NOT NULL DEFAULT 'Departamento',
  ADD COLUMN IF NOT EXISTS internal_location_label text NOT NULL DEFAULT 'Ubicación',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill codes for any existing rows
UPDATE public.companies c
SET company_code = 'EC-' || upper(substr(replace(c.id::text, '-', ''), 1, 4))
WHERE c.company_code IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN company_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS companies_tenant_code_uidx
  ON public.companies (tenant_id, company_code)
  WHERE deleted_at IS NULL;

-- ========== Site (= company_locations) ==========
ALTER TABLE public.company_locations
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ========== Organizational Unit (= company_departments) ==========
ALTER TABLE public.company_departments
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ========== Employee Membership (= company_employees) ==========
ALTER TABLE public.company_employees
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.company_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_location text,
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS company_employees_active_uidx
  ON public.company_employees (tenant_id, company_id, customer_id)
  WHERE deleted_at IS NULL;

-- ========== Delivery Group ==========
CREATE TABLE IF NOT EXISTS public.delivery_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.company_locations(id) ON DELETE CASCADE,
  organizational_unit_id uuid NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_groups TO authenticated;
GRANT ALL ON public.delivery_groups TO service_role;
ALTER TABLE public.delivery_groups ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS delivery_groups_natural_uidx
  ON public.delivery_groups (tenant_id, company_id, site_id, organizational_unit_id)
  WHERE deleted_at IS NULL;

CREATE POLICY delivery_groups_read ON public.delivery_groups FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY delivery_groups_write ON public.delivery_groups FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.tenant_id = delivery_groups.tenant_id
        AND ce.company_id = delivery_groups.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.tenant_id = delivery_groups.tenant_id
        AND ce.company_id = delivery_groups.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

-- ========== Order B2B context ==========
DO $$ BEGIN
  CREATE TYPE public.demand_channel AS ENUM ('individual', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS demand_channel public.demand_channel NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.company_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organizational_unit_id uuid REFERENCES public.company_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_group_id uuid REFERENCES public.delivery_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

-- ========== Helpers ==========
CREATE OR REPLACE FUNCTION public.generate_company_code(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_n int;
BEGIN
  FOR v_n IN 1..50 LOOP
    v_code := 'EC-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.tenant_id = p_tenant_id
        AND c.company_code = v_code
        AND c.deleted_at IS NULL
    );
  END LOOP;
  RETURN v_code;
END;
$$;

-- Ensure Individual customer + tenant membership + customer role (CJ-001 safety)
CREATE OR REPLACE FUNCTION public.ensure_individual_customer(
  p_tenant_id uuid,
  p_user_id uuid,
  p_display_name text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (p_tenant_id, p_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, p_tenant_id, 'customer')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (tenant_id, user_id, kind, display_name, email)
    VALUES (
      p_tenant_id,
      p_user_id,
      'individual',
      COALESCE(p_display_name, p_email, 'Customer'),
      p_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_company_code(uuid) TO authenticated;

-- Resolve or create Delivery Group for Site + OU
CREATE OR REPLACE FUNCTION public.resolve_delivery_group(
  p_tenant_id uuid,
  p_company_id uuid,
  p_site_id uuid,
  p_ou_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_site_name text;
  v_ou_name text;
BEGIN
  SELECT id INTO v_id
  FROM public.delivery_groups
  WHERE tenant_id = p_tenant_id
    AND company_id = p_company_id
    AND site_id = p_site_id
    AND organizational_unit_id = p_ou_id
    AND deleted_at IS NULL;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT name INTO v_site_name FROM public.company_locations WHERE id = p_site_id;
  SELECT name INTO v_ou_name FROM public.company_departments WHERE id = p_ou_id;

  INSERT INTO public.delivery_groups (tenant_id, company_id, site_id, organizational_unit_id, name)
  VALUES (
    p_tenant_id,
    p_company_id,
    p_site_id,
    p_ou_id,
    coalesce(v_site_name, 'Site') || ' · ' || coalesce(v_ou_name, 'Unit')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) TO authenticated;

-- ========== RLS: allow company portal admins to manage their company ==========
-- Foundation Lock (20260720220000) split the legacy companies_all
-- policy into companies_read / companies_write / companies_update /
-- companies_purge.
--
-- B2B replaces those policies with a richer authorization model.
-- Therefore previous policies must be removed before recreating them.
DROP POLICY IF EXISTS companies_all ON public.companies;
DROP POLICY IF EXISTS companies_read ON public.companies;
DROP POLICY IF EXISTS companies_write ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
DROP POLICY IF EXISTS companies_purge ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY companies_write ON public.companies FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
    OR NOT EXISTS (SELECT 1 FROM public.companies c2 WHERE c2.id = companies.id)
  );

-- Insert path for new company registration (authenticated tenant member)
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS cloc_all ON public.company_locations;
CREATE POLICY cloc_read ON public.company_locations FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cloc_write ON public.company_locations FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS cdept_all ON public.company_departments;
CREATE POLICY cdept_read ON public.company_departments FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = (
        SELECT cl.company_id FROM public.company_locations cl
        WHERE cl.id = company_departments.company_location_id
      )
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cdept_write ON public.company_departments FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      JOIN public.company_locations cl ON cl.company_id = ce.company_id
      WHERE cl.id = company_departments.company_location_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      JOIN public.company_locations cl ON cl.company_id = ce.company_id
      WHERE cl.id = company_departments.company_location_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS cemp_all ON public.company_employees;
CREATE POLICY cemp_read ON public.company_employees FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cemp_write ON public.company_employees FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

-- ========== program_draft_order: stamp B2B context (CJ-001 individual default) ==========
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb,
  _demand_channel public.demand_channel DEFAULT 'individual',
  _company_id uuid DEFAULT NULL,
  _site_id uuid DEFAULT NULL,
  _organizational_unit_id uuid DEFAULT NULL,
  _delivery_group_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_row public.order_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_tenant_member(_tenant_id) THEN
    RAISE EXCEPTION 'not a tenant member';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(auth.uid(), _tenant_id)
        OR public.is_saas_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'customer not allowed';
  END IF;

  INSERT INTO public.orders (
    tenant_id,
    customer_id,
    week_start,
    status,
    total,
    notes,
    demand_channel,
    company_id,
    site_id,
    organizational_unit_id,
    delivery_group_id
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes,
    COALESCE(_demand_channel, 'individual'),
    _company_id,
    _site_id,
    _organizational_unit_id,
    _delivery_group_id
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1)
    )
    RETURNING * INTO v_row;

    v_items := v_items || jsonb_build_array(to_jsonb(v_row));
  END LOOP;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) TO service_role;

-- Keep old signature working for callers that omit B2B args
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.program_draft_order(
    _tenant_id, _customer_id, _week_start, _total, _notes, _items,
    'individual'::public.demand_channel, NULL, NULL, NULL, NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO service_role;
