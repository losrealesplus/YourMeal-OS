-- Foundation Lock: soft-delete enforcement
-- Application clients must not hard-delete business rows (except saas_admin purge).
-- @see docs/05-architecture/FOUNDATION_LOCK.md
-- @see docs/adr/0009-foundation-lock.md

-- deleted_by on catalog core
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Replace staff DELETE policies with saas_admin-only purge policies
DROP POLICY IF EXISTS dishes_delete ON public.dishes;
CREATE POLICY dishes_purge ON public.dishes FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

DROP POLICY IF EXISTS ingredients_all ON public.ingredients;
CREATE POLICY ingredients_read ON public.ingredients FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY ingredients_write ON public.ingredients FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_update ON public.ingredients FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_purge ON public.ingredients FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

DROP POLICY IF EXISTS suppliers_all ON public.suppliers;
CREATE POLICY suppliers_read ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY suppliers_write ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY suppliers_purge ON public.suppliers FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Customers / companies / ops: drop unrestricted DELETE via ALL policies where possible
-- Keep UPDATE for soft-delete; DELETE only saas_admin

DROP POLICY IF EXISTS companies_all ON public.companies;
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY companies_write ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_purge ON public.companies FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Weekly menus: split ALL into insert/update + saas purge
DROP POLICY IF EXISTS wm_write ON public.weekly_menus;
CREATE POLICY wm_insert ON public.weekly_menus FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY wm_update ON public.weekly_menus FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY wm_purge ON public.weekly_menus FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Allow saas_admin on dish insert/update (Architecture Review gap)
DROP POLICY IF EXISTS dishes_write ON public.dishes;
CREATE POLICY dishes_write ON public.dishes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
DROP POLICY IF EXISTS dishes_update ON public.dishes;
CREATE POLICY dishes_update ON public.dishes FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
