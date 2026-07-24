-- EP-002B.2 · Kitchen production batches (dish-level execution state for a day)
-- Status belongs to the production lot (dish × delivery_date), not each order.

CREATE TYPE public.kitchen_batch_status AS ENUM (
  'pending',
  'preparing',
  'plating',
  'finished'
);

CREATE TABLE public.kitchen_production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  status public.kitchen_batch_status NOT NULL DEFAULT 'pending',
  started_at timestamptz NULL,
  finished_at timestamptz NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kitchen_production_batches_unique
    UNIQUE (tenant_id, delivery_date, dish_id)
);

CREATE INDEX kitchen_production_batches_day_idx
  ON public.kitchen_production_batches (tenant_id, delivery_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_production_batches TO authenticated;
GRANT ALL ON public.kitchen_production_batches TO service_role;

ALTER TABLE public.kitchen_production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpb_select ON public.kitchen_production_batches
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

CREATE POLICY kpb_write ON public.kitchen_production_batches
  FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

CREATE TRIGGER kitchen_production_batches_touch
  BEFORE UPDATE ON public.kitchen_production_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();
