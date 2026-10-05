-- Isolated PostgreSQL model with actual roles, RLS and canonical membership tables.
DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TYPE public.app_role AS ENUM('saas_admin','company_admin','operations_manager','customer','kitchen');
CREATE TYPE public.order_status AS ENUM('draft','confirmed','in_production','prepared','delivered','cancelled');
CREATE TYPE public.demand_channel AS ENUM('individual','company');
CREATE TABLE public.tenants(id uuid PRIMARY KEY);
CREATE TABLE public.tenant_members(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,user_id uuid,status text,deleted_at timestamptz);
CREATE TABLE public.user_roles(user_id uuid,tenant_id uuid,role public.app_role);
CREATE FUNCTION public.has_role(_user_id uuid,_tenant_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND tenant_id IS NOT DISTINCT FROM _tenant_id AND role=_role) $$;
CREATE FUNCTION public.is_saas_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='saas_admin') $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,uuid,public.app_role),public.is_saas_admin(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,uuid,public.app_role),public.is_saas_admin(uuid) TO authenticated;
CREATE TABLE public.customers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES public.tenants,
 user_id uuid,display_name text,email text,kind text DEFAULT 'individual',deleted_at timestamptz,created_at timestamptz DEFAULT now());
CREATE TABLE public.customer_phones(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,customer_id uuid REFERENCES public.customers,phone text NOT NULL,is_primary boolean);
CREATE TABLE public.customer_addresses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,customer_id uuid REFERENCES public.customers,street text,city text,zip text,label text,is_default boolean,deleted_at timestamptz);
CREATE TABLE public.customer_preferences(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,customer_id uuid REFERENCES public.customers,key text,value text);
CREATE TABLE public.customer_dietary_profiles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,customer_id uuid REFERENCES public.customers,
 allergens jsonb DEFAULT '[]',custom_allergens jsonb DEFAULT '[]',restrictions jsonb DEFAULT '[]',preferences jsonb DEFAULT '[]',dietary_notes text);
CREATE TABLE public.companies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,deleted_at timestamptz);
CREATE TABLE public.company_locations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,company_id uuid,deleted_at timestamptz);
CREATE TABLE public.company_departments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,company_location_id uuid,deleted_at timestamptz);
CREATE TABLE public.delivery_groups(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,company_id uuid,site_id uuid,organizational_unit_id uuid,deleted_at timestamptz);
CREATE TABLE public.orders(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES public.tenants,
 customer_id uuid NOT NULL REFERENCES public.customers,total numeric(12,2) NOT NULL,week_start date NOT NULL,status public.order_status DEFAULT 'draft',
 notes text,deleted_at timestamptz,created_at timestamptz DEFAULT now(),delivery_address_id uuid,dietary_snapshot jsonb,
 demand_channel public.demand_channel DEFAULT 'individual',company_id uuid,site_id uuid,organizational_unit_id uuid,delivery_group_id uuid);
CREATE TABLE public.dishes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES public.tenants,
 name text NOT NULL,description text,price numeric(12,4),allergens text[],deleted_at timestamptz,status text DEFAULT 'active');
CREATE TABLE public.order_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES public.tenants,
 order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,dish_id uuid NOT NULL REFERENCES public.dishes,
 day_date date,qty integer,comment text,deleted_at timestamptz,unit_price numeric(12,4),price_snapshot_status text DEFAULT 'captured');
CREATE TABLE public.kitchen_production_batches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid REFERENCES public.tenants,
 dish_id uuid NOT NULL REFERENCES public.dishes,delivery_date date,status text DEFAULT 'pending',UNIQUE(tenant_id,delivery_date,dish_id));
CREATE TABLE public.weekly_menus(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,week_start date,status text);
CREATE TABLE public.weekly_menu_slots(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,weekly_menu_id uuid REFERENCES public.weekly_menus,
 dish_id uuid REFERENCES public.dishes,day_date date,unit_price numeric(12,4));
CREATE TABLE public.delivery_services(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,order_id uuid REFERENCES public.orders,customer_id uuid,
 delivery_date date,status text DEFAULT 'pending',deleted_at timestamptz,delivery_address_id uuid,delivery_address_snapshot jsonb,
 customer_contact_snapshot jsonb,dietary_snapshot jsonb,delivery_instructions text,legacy_backfill boolean,issue_notes text,UNIQUE(tenant_id,order_id,delivery_date));
CREATE TABLE public.audit_log(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,actor_id uuid,entity_type text,entity_id text,action text,old_data jsonb,new_data jsonb);
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY membership_own ON public.tenant_members TO authenticated USING(user_id=auth.uid());
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['customers','customer_phones','customer_addresses','customer_preferences','customer_dietary_profiles',
 'companies','company_locations','company_departments','delivery_groups','orders','dishes','order_items','kitchen_production_batches','weekly_menus','weekly_menu_slots','delivery_services','audit_log'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY existing_tenant ON public.%I TO authenticated USING(EXISTS(SELECT 1 FROM public.tenant_members m WHERE m.tenant_id=%I.tenant_id AND m.user_id=auth.uid() AND m.status=''approved'' AND m.deleted_at IS NULL)) WITH CHECK(EXISTS(SELECT 1 FROM public.tenant_members m WHERE m.tenant_id=%I.tenant_id AND m.user_id=auth.uid() AND m.status=''approved'' AND m.deleted_at IS NULL))',t,t,t);
 END LOOP; END $$;
INSERT INTO public.tenants VALUES('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
INSERT INTO auth.users SELECT ('20000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid FROM generate_series(1,7)i;
INSERT INTO public.tenant_members(tenant_id,user_id,status) SELECT '10000000-0000-4000-8000-000000000001',id,'approved' FROM auth.users;
INSERT INTO public.user_roles VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','operations_manager'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','customer'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','customer'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','kitchen'),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','company_admin'),
('20000000-0000-4000-8000-000000000006',NULL,'saas_admin');
UPDATE public.tenant_members SET status='suspended' WHERE user_id='20000000-0000-4000-8000-000000000007';
INSERT INTO public.user_roles VALUES('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','operations_manager');
INSERT INTO public.customers(id,tenant_id,user_id,display_name) VALUES
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Ana'),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',NULL,'Other');
INSERT INTO public.dishes(id,tenant_id,name,price,allergens) VALUES
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Captured soup',11.9,'{}'),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Foreign soup',3,'{milk}');
INSERT INTO public.weekly_menus(id,tenant_id,week_start,status) VALUES('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','2026-10-05','published');
INSERT INTO public.weekly_menu_slots(tenant_id,weekly_menu_id,dish_id,day_date)
 SELECT '10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',d::date FROM generate_series('2026-10-05'::date,'2026-10-09',interval '1 day')d;
