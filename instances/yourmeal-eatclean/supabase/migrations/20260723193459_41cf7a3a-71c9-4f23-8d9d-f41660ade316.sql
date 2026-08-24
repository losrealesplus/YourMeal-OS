
-- Owner helper for customer-scoped tables
CREATE OR REPLACE FUNCTION public.is_customer_owner(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = _customer_id AND user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_customer_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_customer_owner(uuid) TO authenticated;

-- customers: restrict SELECT to staff / saas admin / self
DROP POLICY IF EXISTS customers_tenant_read ON public.customers;
CREATE POLICY customers_tenant_read ON public.customers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
  );

-- customer_addresses: staff or owner
DROP POLICY IF EXISTS caddr_all ON public.customer_addresses;
CREATE POLICY caddr_all ON public.customer_addresses
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_allergies
DROP POLICY IF EXISTS callergy_all ON public.customer_allergies;
CREATE POLICY callergy_all ON public.customer_allergies
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_phones
DROP POLICY IF EXISTS cphone_all ON public.customer_phones;
CREATE POLICY cphone_all ON public.customer_phones
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_preferences
DROP POLICY IF EXISTS cpref_all ON public.customer_preferences;
CREATE POLICY cpref_all ON public.customer_preferences
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- company_departments: staff-only
DROP POLICY IF EXISTS cdept_all ON public.company_departments;
CREATE POLICY cdept_all ON public.company_departments
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- company_employees: staff-only
DROP POLICY IF EXISTS cemp_all ON public.company_employees;
CREATE POLICY cemp_all ON public.company_employees
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- company_locations: staff-only
DROP POLICY IF EXISTS cloc_all ON public.company_locations;
CREATE POLICY cloc_all ON public.company_locations
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- suppliers: staff-only
DROP POLICY IF EXISTS suppliers_all ON public.suppliers;
CREATE POLICY suppliers_all ON public.suppliers
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- Lock down SECURITY DEFINER helpers from anonymous callers.
-- These are RLS helpers; anon has no reason to call them. Authenticated must
-- retain EXECUTE because policies evaluate them in the caller's role context.
REVOKE EXECUTE ON FUNCTION public.current_user_tenants() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_saas_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_staff_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_user_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_staff_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;
