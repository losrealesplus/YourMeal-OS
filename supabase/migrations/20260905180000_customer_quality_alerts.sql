-- Migration: 20260905180000_customer_quality_alerts.sql
-- Customer Data Quality & Improvement Alerts: Persistent decisions, overrides, and dismissals registry
-- Core Principle: DETECCIÓN ≠ DECISIÓN (Dynamic evaluation with audited human decisions)

CREATE TABLE IF NOT EXISTS public.customer_quality_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  dismiss_reason text NOT NULL,
  target_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  dismissed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Compound index for fast lookup of customer alert dismissals
CREATE INDEX IF NOT EXISTS customer_quality_dismissals_lookup_idx
  ON public.customer_quality_dismissals (tenant_id, customer_id, alert_type);

-- Target customer index for duplicate hypothesis dismissals
CREATE INDEX IF NOT EXISTS customer_quality_dismissals_target_idx
  ON public.customer_quality_dismissals (tenant_id, target_customer_id)
  WHERE target_customer_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_quality_dismissals TO authenticated;
GRANT ALL ON public.customer_quality_dismissals TO service_role;

ALTER TABLE public.customer_quality_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_quality_dismissals_read ON public.customer_quality_dismissals FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_quality_dismissals_write ON public.customer_quality_dismissals FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_quality_dismissals_update ON public.customer_quality_dismissals FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY customer_quality_dismissals_delete ON public.customer_quality_dismissals FOR DELETE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
