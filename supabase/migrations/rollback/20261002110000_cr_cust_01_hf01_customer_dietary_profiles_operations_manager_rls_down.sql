-- Rollback Migration: 20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls_down.sql
-- Restores customer_dietary_profiles INSERT and UPDATE policies to CR-CUST-01 baseline.

DROP POLICY IF EXISTS customer_dietary_profiles_write ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

DROP POLICY IF EXISTS customer_dietary_profiles_update ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
