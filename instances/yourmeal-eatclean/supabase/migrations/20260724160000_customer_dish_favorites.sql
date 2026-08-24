-- EP-002A.3 · Customer dish favorites (explicit hearts)
-- Soft-delete for undo; unique active favorite per customer+dish.

CREATE TABLE public.customer_dish_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE UNIQUE INDEX customer_dish_favorites_active_uidx
  ON public.customer_dish_favorites (customer_id, dish_id)
  WHERE deleted_at IS NULL;

CREATE INDEX customer_dish_favorites_customer_idx
  ON public.customer_dish_favorites (tenant_id, customer_id)
  WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_dish_favorites TO authenticated;
GRANT ALL ON public.customer_dish_favorites TO service_role;

ALTER TABLE public.customer_dish_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY cdfav_all ON public.customer_dish_favorites
  FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR public.is_customer_owner(customer_id)
  );
