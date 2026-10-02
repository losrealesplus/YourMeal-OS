-- Migration: 20261002120000_cr_ops_diet_01_customer_dietary_profiles_client_rls.sql
-- CR-OPS-DIET-01 (P1): Customer Dietary Preferences, Restrictions & Allergen Self-Service RLS
--
-- Objective:
-- Authorizes authenticated customers to SELECT, INSERT, and UPDATE their own dietary profile
-- in public.customer_dietary_profiles using public.is_customer_owner(customer_id).
--
-- Security Rules Enforced:
-- 1. Customers can ONLY read, insert, and update rows where customer_id belongs to auth.uid().
-- 2. Staff and operations_manager authorizations are strictly preserved.
-- 3. Tenant isolation is preserved.
-- 4. DELETE remains restricted to staff and saas_admin.

-- 1. Ensure SELECT policy permits customers to read their own profile
DROP POLICY IF EXISTS customer_dietary_profiles_read ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_read ON public.customer_dietary_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  );

-- 2. Update INSERT policy to allow customers to insert their own profile
DROP POLICY IF EXISTS customer_dietary_profiles_write ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  );

-- 3. Update UPDATE policy to allow customers to update their own profile
DROP POLICY IF EXISTS customer_dietary_profiles_update ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  );
