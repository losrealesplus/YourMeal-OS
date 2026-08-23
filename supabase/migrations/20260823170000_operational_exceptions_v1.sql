-- Migration: 20260823170000_operational_exceptions_v1.sql
-- A4.1a: Operational Exceptions substrate (DELIVERY_NOT_RECEIVED)

CREATE TABLE IF NOT EXISTS public.operational_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Classification
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'OPEN',
  version integer NOT NULL DEFAULT 1,
  
  -- Source Context
  source_domain text NOT NULL,
  source_entity_type text NOT NULL,
  source_entity_id text NOT NULL,
  
  -- Operational References
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  
  -- Resolution & Ownership
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_type text,
  resolution_payload jsonb,
  resolution_notes text,
  
  -- Timestamps
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_exceptions_tenant_status_idx
  ON public.operational_exceptions (tenant_id, status);

CREATE INDEX IF NOT EXISTS operational_exceptions_order_idx
  ON public.operational_exceptions (tenant_id, order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS operational_exceptions_customer_idx
  ON public.operational_exceptions (tenant_id, customer_id)
  WHERE customer_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_exceptions TO authenticated;
GRANT ALL ON public.operational_exceptions TO service_role;

ALTER TABLE public.operational_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY op_exceptions_read ON public.operational_exceptions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY op_exceptions_write ON public.operational_exceptions FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY op_exceptions_update ON public.operational_exceptions FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY op_exceptions_purge ON public.operational_exceptions FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));
