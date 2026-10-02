-- Migration: 20261002100000_cr_cust_01_customer_dietary_profiles.sql
-- CR-CUST-01: Customer Dietary Preferences, Restrictions & Allergen Profile
-- Introduces customer dietary profile storage and immutable order dietary snapshots.

-- 1. Create table customer_dietary_profiles
CREATE TABLE IF NOT EXISTS public.customer_dietary_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  allergens jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_allergens jsonb NOT NULL DEFAULT '[]'::jsonb,
  restrictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  dietary_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_dietary_tenant UNIQUE (tenant_id, customer_id)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS customer_dietary_profiles_lookup_idx
  ON public.customer_dietary_profiles (tenant_id, customer_id);

-- 3. Grants & Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_dietary_profiles TO authenticated;
GRANT ALL ON public.customer_dietary_profiles TO service_role;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.customer_dietary_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Multi-Tenant RLS Policies
CREATE POLICY customer_dietary_profiles_read ON public.customer_dietary_profiles
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_dietary_profiles_delete ON public.customer_dietary_profiles
  FOR DELETE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- 6. Add dietary_snapshot to orders table for immutable operational capture
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dietary_snapshot jsonb DEFAULT NULL;

COMMENT ON COLUMN public.orders.dietary_snapshot IS
'Immutable JSON snapshot of customer dietary preferences, restrictions, and allergens captured at order confirmation. Includes override metadata if modified during order intake.';
