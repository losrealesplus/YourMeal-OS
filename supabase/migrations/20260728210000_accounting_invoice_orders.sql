-- EP-OPS-003 Accounting Correction P0: link invoices to delivered orders
-- Enables Outcome "Financial Records Complete" without inventing amounts.

CREATE TABLE IF NOT EXISTS public.invoice_orders (
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (invoice_id, order_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS invoice_orders_order_unique_idx
  ON public.invoice_orders (tenant_id, order_id);

CREATE INDEX IF NOT EXISTS invoice_orders_tenant_invoice_idx
  ON public.invoice_orders (tenant_id, invoice_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_orders TO authenticated;
GRANT ALL ON public.invoice_orders TO service_role;

ALTER TABLE public.invoice_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_orders_staff ON public.invoice_orders;
CREATE POLICY invoice_orders_staff ON public.invoice_orders FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

COMMENT ON TABLE public.invoice_orders IS
  'EP-OPS-003: invoice lines grounded in delivered orders (No Artificiality)';
