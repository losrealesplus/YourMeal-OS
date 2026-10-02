-- Rollback: 20261002120000_cr_ops_diet_01_customer_dietary_profiles_client_rls_down.sql
-- Reverts CR-OPS-DIET-01 customer RLS policies back to CR-CUST-01-HF01 state.

DROP POLICY IF EXISTS customer_dietary_profiles_read ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_read ON public.customer_dietary_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS customer_dietary_profiles_write ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS customer_dietary_profiles_update ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  );
