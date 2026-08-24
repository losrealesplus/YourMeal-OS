
-- 1) ensure_individual_customer: authorize caller
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_user_id <> auth.uid()
     AND NOT (public.has_any_staff_role(auth.uid(), p_tenant_id)
              OR public.is_saas_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

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

-- 2) resolve_delivery_group: require staff / tenant membership
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (public.has_any_staff_role(auth.uid(), p_tenant_id)
          OR public.is_saas_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

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

-- 3) Revoke anon EXECUTE on handle_new_user trigger helper
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

-- 4) Split RLS on companies, ingredients, dish_ingredients:
--    reads restricted to staff / saas_admin; writes already staff-only.

-- companies
DROP POLICY IF EXISTS companies_all ON public.companies;
CREATE POLICY companies_select_staff ON public.companies
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_write_staff ON public.companies
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- ingredients
DROP POLICY IF EXISTS ingredients_all ON public.ingredients;
CREATE POLICY ingredients_select_staff ON public.ingredients
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_write_staff ON public.ingredients
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- dish_ingredients
DROP POLICY IF EXISTS dish_ing_all ON public.dish_ingredients;
CREATE POLICY dish_ingredients_select_staff ON public.dish_ingredients
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY dish_ingredients_write_staff ON public.dish_ingredients
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
