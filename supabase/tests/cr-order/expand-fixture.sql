-- Synthetic pre-expand schema, NOT a production dump. Two tenants, staff and owner RLS.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.tenants(id uuid PRIMARY KEY);
CREATE TABLE public.orders(id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES public.tenants,
  customer_id uuid NOT NULL, total numeric(12,2) NOT NULL, week_start date NOT NULL);
CREATE TABLE public.dishes(id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES public.tenants, name text NOT NULL);
CREATE TABLE public.order_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants, order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES public.dishes, qty integer NOT NULL DEFAULT 1,
  day_date date NOT NULL, unit_price numeric(12,4), price_snapshot_status text NOT NULL DEFAULT 'captured');
CREATE TABLE public.kitchen_production_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants, delivery_date date NOT NULL,
  dish_id uuid NOT NULL REFERENCES public.dishes ON DELETE CASCADE, status text NOT NULL DEFAULT 'pending',
  UNIQUE(tenant_id,delivery_date,dish_id));
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.orders,public.order_items,public.dishes TO authenticated;
CREATE POLICY test_orders_tenant ON public.orders TO authenticated
  USING (tenant_id::text = current_setting('test.tenant')) WITH CHECK (tenant_id::text = current_setting('test.tenant'));
CREATE POLICY test_dishes_tenant ON public.dishes TO authenticated
  USING (tenant_id::text = current_setting('test.tenant')) WITH CHECK (tenant_id::text = current_setting('test.tenant'));
-- Permissive synthetic baseline mimics staff / owning-customer access, not canonical capability certification.
CREATE POLICY test_items_access ON public.order_items TO authenticated
 USING (tenant_id::text = current_setting('test.tenant') AND (
  current_setting('test.role') = 'staff' OR EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.customer_id=auth.uid())))
 WITH CHECK (tenant_id::text = current_setting('test.tenant') AND (
  current_setting('test.role') = 'staff' OR EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.customer_id=auth.uid())));
INSERT INTO public.tenants VALUES ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
INSERT INTO auth.users(id) VALUES ('20000000-0000-4000-8000-000000000001');
INSERT INTO public.orders VALUES
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',25,'2026-10-05'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',0,'2026-10-05');
INSERT INTO public.dishes VALUES
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Bowl'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Soup');
INSERT INTO public.order_items(id,tenant_id,order_id,dish_id,qty,day_date,unit_price,price_snapshot_status) VALUES
 ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',2,'2026-10-05',12.5,'captured'),
 ('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002',1,'2026-10-06',NULL,'historical_unavailable');
INSERT INTO public.kitchen_production_batches(tenant_id,delivery_date,dish_id) VALUES
 ('10000000-0000-4000-8000-000000000001','2026-10-05','40000000-0000-4000-8000-000000000001');
-- Emulate inherited Data API grants, which the migration must remove from the new table.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated,anon,service_role;
