-- Migration: 20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls.sql
-- CR-CUST-01-HF01: Customer Dietary Profile — operations_manager RLS authorization
--
-- Defect:
-- Accounts with role 'operations_manager' possess the 'customers.write' capability
-- in application RBAC, but customer_dietary_profiles RLS policies for INSERT and UPDATE
-- only authorized 'has_any_staff_role' (which excludes 'operations_manager') and 'saas_admin'.
--
-- Fix:
-- Replaces customer_dietary_profiles_write (INSERT) and customer_dietary_profiles_update (UPDATE)
-- to explicitly allow 'operations_manager' within their authenticated tenant via
-- public.has_role(auth.uid(), tenant_id, 'operations_manager').
--
-- Security Rules Enforced:
-- 1. has_any_staff_role is NOT modified globally.
-- 2. Tenant isolation is strictly preserved (operations_manager can only write rows for their tenant).
-- 3. SELECT and DELETE policies are untouched.
-- 4. Other tables (orders, customers, etc.) are untouched.

-- 1. Replace INSERT policy
DROP POLICY IF EXISTS customer_dietary_profiles_write ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  );

-- 2. Replace UPDATE policy
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
