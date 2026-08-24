-- EP-OPS-003 Accounting Correction P0 alignment:
-- explicit Review stamp + Close Financial Period (lifecycle complete)

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.invoices.reviewed_at IS
  'Accounting lifecycle Review step (pending → review → paid/processed)';

CREATE TABLE IF NOT EXISTS public.financial_period_closures (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_period text NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_count integer NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, billing_period)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_period_closures TO authenticated;
GRANT ALL ON public.financial_period_closures TO service_role;

ALTER TABLE public.financial_period_closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS financial_period_closures_staff ON public.financial_period_closures;
CREATE POLICY financial_period_closures_staff ON public.financial_period_closures
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

COMMENT ON TABLE public.financial_period_closures IS
  'EP-OPS-003: Close Financial Period → Financial Records Complete';
