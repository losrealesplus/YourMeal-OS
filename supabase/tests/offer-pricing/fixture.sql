CREATE TABLE public.dishes (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, price numeric(12,4));
CREATE TABLE public.weekly_menus (id uuid PRIMARY KEY, tenant_id uuid NOT NULL);
CREATE TABLE public.weekly_menu_slots (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL,
  weekly_menu_id uuid NOT NULL REFERENCES public.weekly_menus(id),
  dish_id uuid NOT NULL REFERENCES public.dishes(id)
);
INSERT INTO public.dishes VALUES
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',11.9000),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',7.0000);
INSERT INTO public.weekly_menus VALUES
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
INSERT INTO public.weekly_menu_slots VALUES
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001'),
('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002');
ALTER TABLE public.weekly_menu_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY slot_tenant ON public.weekly_menu_slots TO authenticated
USING (tenant_id = current_setting('app.test_tenant')::uuid)
WITH CHECK (tenant_id = current_setting('app.test_tenant')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_menu_slots TO authenticated;
-- Preserve exact existing ACL/policy/row/catalogue fingerprints over additive expansion.
CREATE TABLE public.offer_fixture_baseline AS SELECT
  (SELECT relacl::text FROM pg_class WHERE oid='public.weekly_menu_slots'::regclass) AS acl,
  (SELECT row_to_json(p)::text FROM pg_policy p WHERE polrelid='public.weekly_menu_slots'::regclass) AS policy,
  (SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.dishes d) AS catalogue,
  (SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM public.weekly_menu_slots s) AS slots;
