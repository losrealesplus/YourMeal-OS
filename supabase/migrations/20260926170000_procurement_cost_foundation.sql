-- ============================================================================
-- YOURMEAL OS — PROCUREMENT COST FOUNDATION (CR-COST-01)
-- Subsystem: Platform Core / Cost Intelligence (E2)
-- ============================================================================

-- 1. Facturas de Compra a Proveedores
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric(12,4) NOT NULL DEFAULT 0,
  tax_amount numeric(12,4) NOT NULL DEFAULT 0,
  additional_costs numeric(12,4) NOT NULL DEFAULT 0,
  total_amount numeric(12,4) NOT NULL DEFAULT 0,
  allocation_method text NOT NULL DEFAULT 'value',
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_pi_subtotal CHECK (subtotal >= 0),
  CONSTRAINT check_pi_tax CHECK (tax_amount >= 0),
  CONSTRAINT check_pi_additional_costs CHECK (additional_costs >= 0),
  CONSTRAINT check_pi_total CHECK (total_amount >= 0),
  CONSTRAINT check_pi_allocation_method CHECK (allocation_method IN ('value', 'weight', 'volume', 'units', 'manual')),
  CONSTRAINT check_pi_status CHECK (status IN ('draft', 'received', 'posted', 'cancelled'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoices TO authenticated;
GRANT ALL ON public.purchase_invoices TO service_role;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_invoices_staff ON public.purchase_invoices
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_supplier
  ON public.purchase_invoices(tenant_id, supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_tenant_date
  ON public.purchase_invoices(tenant_id, invoice_date DESC);

-- 2. Líneas de Factura de Compra
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_invoice_id uuid NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_name text NOT NULL,
  quantity numeric(12,3) NOT NULL,
  unit text NOT NULL DEFAULT 'ud',
  unit_price numeric(12,4) NOT NULL,
  discount_amount numeric(12,4) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,4) NOT NULL DEFAULT 0,
  weight_kg numeric(10,3),
  volume_m3 numeric(10,4),
  manual_overhead numeric(12,4) DEFAULT 0,
  allocated_overhead numeric(12,4) NOT NULL DEFAULT 0,
  effective_unit_cost numeric(12,4) NOT NULL,
  line_total numeric(12,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_pii_qty CHECK (quantity > 0),
  CONSTRAINT check_pii_unit_price CHECK (unit_price >= 0),
  CONSTRAINT check_pii_discount CHECK (discount_amount >= 0),
  CONSTRAINT check_pii_allocated_overhead CHECK (allocated_overhead >= 0),
  CONSTRAINT check_pii_effective_cost CHECK (effective_unit_cost >= 0),
  CONSTRAINT check_pii_line_total CHECK (line_total >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_invoice_items TO authenticated;
GRANT ALL ON public.purchase_invoice_items TO service_role;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_invoice_items_staff ON public.purchase_invoice_items
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_tenant_invoice
  ON public.purchase_invoice_items(tenant_id, purchase_invoice_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_tenant_item
  ON public.purchase_invoice_items(tenant_id, item_id);

-- 3. Historial Inmutable de Costes de Items
CREATE TABLE IF NOT EXISTS public.item_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  source_invoice_item_id uuid REFERENCES public.purchase_invoice_items(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit_price numeric(12,4) NOT NULL,
  allocated_overhead numeric(12,4) NOT NULL DEFAULT 0,
  effective_unit_cost numeric(12,4) NOT NULL,
  cost_method text NOT NULL DEFAULT 'effective_purchase',
  effective_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_ich_effective_cost CHECK (effective_unit_cost >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_cost_history TO authenticated;
GRANT ALL ON public.item_cost_history TO service_role;
ALTER TABLE public.item_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY item_cost_history_staff ON public.item_cost_history
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_item_cost_history_lookup
  ON public.item_cost_history(tenant_id, item_id, effective_at DESC);
