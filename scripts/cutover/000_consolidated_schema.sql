-- =====================================================================
-- YourMeal OS · Script consolidado de migración (INFRA-008 · Carril B)
-- Destino: proyecto Supabase externo (BYO)
-- Generado por concatenación ordenada de supabase/migrations/*.sql
-- Ejecutar UNA sola vez sobre una base de datos VACÍA.
-- Ejecutar como owner/postgres en el SQL Editor del proyecto destino.
-- =====================================================================

BEGIN;


-- ---------------------------------------------------------------------
-- MIGRATION: 20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql
-- ---------------------------------------------------------------------


-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'saas_admin','company_admin','kitchen','purchasing','inventory',
  'production','support','accounting','logistics','driver','employee','customer'
);
CREATE TYPE public.tenant_status AS ENUM ('active','suspended','trial');
CREATE TYPE public.order_status AS ENUM ('draft','confirmed','in_production','delivered','cancelled');
CREATE TYPE public.route_status AS ENUM ('planned','in_progress','completed','cancelled');
CREATE TYPE public.invoice_status AS ENUM ('pending','paid','overdue','void');
CREATE TYPE public.dish_status AS ENUM ('draft','active','archived');
CREATE TYPE public.promotion_scope AS ENUM ('global','group','personal');
CREATE TYPE public.pay_mode AS ENUM ('employee_pays','company_pays','grouped','custom');
CREATE TYPE public.customer_kind AS ENUM ('individual','company_employee');
CREATE TYPE public.support_kind AS ENUM ('note','incident','request','allergy_update','complaint');

-- ============ CORE ============
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  locale_default text NOT NULL DEFAULT 'es',
  status public.tenant_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text UNIQUE NOT NULL,
  is_primary boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.tenant_domains TO anon, authenticated;
GRANT ALL ON public.tenant_domains TO service_role;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'es',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_members (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
GRANT SELECT ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _tenant_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (tenant_id = _tenant_id OR (_tenant_id IS NULL AND tenant_id IS NULL))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'saas_admin')
$$;

CREATE OR REPLACE FUNCTION public.current_user_tenants()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
  ) OR public.is_saas_admin(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.has_any_staff_role(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('company_admin','kitchen','purchasing','inventory','production','support','accounting','logistics')
  )
$$;

-- ============ RLS POLICIES: CORE ============
CREATE POLICY tenants_read ON public.tenants FOR SELECT
  USING (public.is_saas_admin(auth.uid()) OR id IN (SELECT public.current_user_tenants()));
CREATE POLICY tenants_admin_write ON public.tenants FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid())) WITH CHECK (public.is_saas_admin(auth.uid()));

CREATE POLICY tenant_domains_read ON public.tenant_domains FOR SELECT
  USING (public.is_saas_admin(auth.uid()) OR tenant_id IN (SELECT public.current_user_tenants()));
CREATE POLICY tenant_domains_admin_write ON public.tenant_domains FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid())) WITH CHECK (public.is_saas_admin(auth.uid()));

CREATE POLICY profiles_self_read ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_upsert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY tenant_members_self_read ON public.tenant_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin'));

CREATE POLICY user_roles_self_read ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin'));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CUSTOMER DOMAIN ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.customer_kind NOT NULL DEFAULT 'individual',
  display_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_tenant_read ON public.customers FOR SELECT
  USING (public.is_tenant_member(tenant_id) OR user_id = auth.uid());
CREATE POLICY customers_self_write ON public.customers FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label text,
  street text NOT NULL,
  city text,
  zip text,
  lat double precision,
  lng double precision,
  is_default boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY caddr_all ON public.customer_addresses FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE TABLE public.customer_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_phones TO authenticated;
GRANT ALL ON public.customer_phones TO service_role;
ALTER TABLE public.customer_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY cphone_all ON public.customer_phones FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE TABLE public.customer_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  severity text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_allergies TO authenticated;
GRANT ALL ON public.customer_allergies TO service_role;
ALTER TABLE public.customer_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY callergy_all ON public.customer_allergies FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE TABLE public.customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_preferences TO authenticated;
GRANT ALL ON public.customer_preferences TO service_role;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpref_all ON public.customer_preferences FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  billing_rule public.pay_mode NOT NULL DEFAULT 'grouped',
  vat_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_all ON public.companies FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE TABLE public.company_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_locations TO authenticated;
GRANT ALL ON public.company_locations TO service_role;
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloc_all ON public.company_locations FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.company_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_location_id uuid NOT NULL REFERENCES public.company_locations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_departments TO authenticated;
GRANT ALL ON public.company_departments TO service_role;
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY cdept_all ON public.company_departments FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.company_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.company_departments(id) ON DELETE SET NULL,
  pay_mode public.pay_mode NOT NULL DEFAULT 'company_pays'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_employees TO authenticated;
GRANT ALL ON public.company_employees TO service_role;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY cemp_all ON public.company_employees FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ CATALOG ============
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY suppliers_all ON public.suppliers FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  cost numeric(12,4) NOT NULL DEFAULT 0,
  stock numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  expiration date,
  allergens text[] NOT NULL DEFAULT '{}'::text[]
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredients_all ON public.ingredients FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  kcal integer,
  weight_g integer,
  macros jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost numeric(12,4) NOT NULL DEFAULT 0,
  price numeric(12,4) NOT NULL DEFAULT 0,
  prep_minutes integer,
  prep_instructions text,
  allergens text[] NOT NULL DEFAULT '{}'::text[],
  status public.dish_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dishes TO authenticated;
GRANT ALL ON public.dishes TO service_role;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY dishes_read ON public.dishes FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY dishes_write ON public.dishes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));
CREATE POLICY dishes_update ON public.dishes FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id));
CREATE POLICY dishes_delete ON public.dishes FOR DELETE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.dish_ingredients (
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  qty numeric(12,3) NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  PRIMARY KEY (dish_id, ingredient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dish_ingredients TO authenticated;
GRANT ALL ON public.dish_ingredients TO service_role;
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY dish_ing_all ON public.dish_ingredients FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ WEEKLY MENUS ============
CREATE TABLE public.weekly_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  UNIQUE (tenant_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_menus TO authenticated;
GRANT ALL ON public.weekly_menus TO service_role;
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY wm_read ON public.weekly_menus FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY wm_write ON public.weekly_menus FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.weekly_menu_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id uuid NOT NULL REFERENCES public.weekly_menus(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  dish_id uuid NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_menu_slots TO authenticated;
GRANT ALL ON public.weekly_menu_slots TO service_role;
ALTER TABLE public.weekly_menu_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY wms_read ON public.weekly_menu_slots FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY wms_write ON public.weekly_menu_slots FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  status public.order_status NOT NULL DEFAULT 'draft',
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_customer_read ON public.orders FOR SELECT TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );
CREATE POLICY orders_customer_write ON public.orders FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES public.dishes(id),
  day_date date NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  comment text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY oi_all ON public.order_items FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = order_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
            WHERE o.id = order_id AND c.user_id = auth.uid())
  );

-- ============ ROUTES ============
CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.route_status NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY routes_read ON public.routes FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR driver_id = auth.uid());
CREATE POLICY routes_write ON public.routes FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  sequence integer NOT NULL DEFAULT 0,
  eta timestamptz,
  delivered_at timestamptz,
  lat double precision,
  lng double precision
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY rs_read ON public.route_stops FOR SELECT TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.routes r WHERE r.id = route_id AND r.driver_id = auth.uid())
  );
CREATE POLICY rs_write ON public.route_stops FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ ACCOUNTING ============
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  billing_period text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_read ON public.invoices FOR SELECT TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id) OR
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );
CREATE POLICY inv_write ON public.invoices FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  method text,
  amount numeric(12,2) NOT NULL,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pay_all ON public.payments FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ PROMOTIONS ============
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scope public.promotion_scope NOT NULL DEFAULT 'global',
  title text NOT NULL,
  body text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY promo_read ON public.promotions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY promo_write ON public.promotions FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ SUPPORT ============
CREATE TABLE public.support_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind public.support_kind NOT NULL DEFAULT 'note',
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_notes TO authenticated;
GRANT ALL ON public.support_notes TO service_role;
ALTER TABLE public.support_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sn_all ON public.support_notes FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

-- ============ SEED: EATCLEAN TENERIFE ============
-- Canonical minimal seed lives in scripts/cutover/010_seed_eatclean.sql
-- (fixed UUIDs). Do not insert a second tenant here — avoids slug/id drift.

-- ---------------------------------------------------------------------
-- MIGRATION: 20260720164327_63fdc61e-1100-4fa6-ad62-e2a91eb9f2b1.sql
-- ---------------------------------------------------------------------


CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260720170834_2a394c23-2b57-4ded-87ae-7824d406b01e.sql
-- ---------------------------------------------------------------------

-- Regional settings on tenants (company defaults)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS country          text,
  ADD COLUMN IF NOT EXISTS currency         text,
  ADD COLUMN IF NOT EXISTS timezone         text,
  ADD COLUMN IF NOT EXISTS time_format      text,
  ADD COLUMN IF NOT EXISTS unit_weight      text,
  ADD COLUMN IF NOT EXISTS unit_volume      text,
  ADD COLUMN IF NOT EXISTS unit_distance    text,
  ADD COLUMN IF NOT EXISTS unit_temperature text;

-- Regional settings on profiles (per-user overrides; NULL = inherit tenant)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country          text,
  ADD COLUMN IF NOT EXISTS currency         text,
  ADD COLUMN IF NOT EXISTS timezone         text,
  ADD COLUMN IF NOT EXISTS time_format      text,
  ADD COLUMN IF NOT EXISTS unit_weight      text,
  ADD COLUMN IF NOT EXISTS unit_volume      text,
  ADD COLUMN IF NOT EXISTS unit_distance    text,
  ADD COLUMN IF NOT EXISTS unit_temperature text;

-- Validation triggers (values kept flexible so we can add locales without migrations)
CREATE OR REPLACE FUNCTION public.validate_regional_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.time_format IS NOT NULL AND NEW.time_format NOT IN ('12h','24h') THEN
    RAISE EXCEPTION 'time_format must be 12h or 24h';
  END IF;
  IF NEW.unit_weight IS NOT NULL AND NEW.unit_weight NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_weight must be metric or imperial';
  END IF;
  IF NEW.unit_volume IS NOT NULL AND NEW.unit_volume NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_volume must be metric or imperial';
  END IF;
  IF NEW.unit_distance IS NOT NULL AND NEW.unit_distance NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_distance must be metric or imperial';
  END IF;
  IF NEW.unit_temperature IS NOT NULL AND NEW.unit_temperature NOT IN ('C','F') THEN
    RAISE EXCEPTION 'unit_temperature must be C or F';
  END IF;
  IF NEW.country IS NOT NULL AND length(NEW.country) <> 2 THEN
    RAISE EXCEPTION 'country must be an ISO 3166-1 alpha-2 code';
  END IF;
  IF NEW.currency IS NOT NULL AND length(NEW.currency) <> 3 THEN
    RAISE EXCEPTION 'currency must be an ISO 4217 code';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_validate_regional ON public.tenants;
CREATE TRIGGER tenants_validate_regional
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_regional_settings();

DROP TRIGGER IF EXISTS profiles_validate_regional ON public.profiles;
CREATE TRIGGER profiles_validate_regional
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_regional_settings();

-- Seed sensible defaults for the existing EatClean Tenerife tenant
UPDATE public.tenants
SET country          = COALESCE(country, 'ES'),
    currency         = COALESCE(currency, 'EUR'),
    timezone         = COALESCE(timezone, 'Atlantic/Canary'),
    time_format      = COALESCE(time_format, '24h'),
    unit_weight      = COALESCE(unit_weight, 'metric'),
    unit_volume      = COALESCE(unit_volume, 'metric'),
    unit_distance    = COALESCE(unit_distance, 'metric'),
    unit_temperature = COALESCE(unit_temperature, 'C');

-- ---------------------------------------------------------------------
-- MIGRATION: 20260720210000_soft_delete_audit_feature_flags.sql
-- ---------------------------------------------------------------------

-- YourMeal OS: soft delete, audit_log, feature_flags
-- @see docs/adr/0006-soft-delete-audit.md
-- @see docs/adr/0007-feature-flags.md

-- ============ SOFT DELETE COLUMNS ============
-- Business records are never permanently deleted via application flows.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_phones ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_locations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_departments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.company_employees ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.weekly_menus ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.route_stops ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.support_notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS dishes_tenant_active_idx
  ON public.dishes (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ingredients_tenant_active_idx
  ON public.ingredients (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_tenant_active_idx
  ON public.orders (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_tenant_active_idx
  ON public.customers (tenant_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS dishes_touch_updated_at ON public.dishes;
CREATE TRIGGER dishes_touch_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AUDIT LOG ============

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_created_idx
  ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON public.audit_log (entity_type, entity_id);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_read ON public.audit_log;
CREATE POLICY audit_log_read ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.is_saas_admin(auth.uid())
    OR (
      tenant_id IS NOT NULL
      AND public.has_role(auth.uid(), tenant_id, 'company_admin')
    )
  );

DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.is_saas_admin(auth.uid())
      OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))
    )
  );

-- ============ FEATURE FLAGS ============

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  -- NULL tenant_id = global / platform flag; set for tenant override
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Free-form: plan keys, rollout %, beta cohorts, etc.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NULLs are distinct in UNIQUE constraints; use partial indexes instead
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_global_key_uidx
  ON public.feature_flags (key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_tenant_key_uidx
  ON public.feature_flags (tenant_id, key) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS feature_flags_tenant_idx
  ON public.feature_flags (tenant_id);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_read ON public.feature_flags;
CREATE POLICY feature_flags_read ON public.feature_flags FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL
    OR public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid()))
  WITH CHECK (public.is_saas_admin(auth.uid()));

DROP TRIGGER IF EXISTS feature_flags_touch_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_touch_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed: Dish Library flag enabled globally (first module)
INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'dish_library',
  'Dish Library module — heart of the domain model',
  true,
  NULL,
  '{"module":"catalog","phase":"first"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'dish_library' AND tenant_id IS NULL
);

-- ---------------------------------------------------------------------
-- MIGRATION: 20260720220000_foundation_lock_soft_delete_rbac.sql
-- ---------------------------------------------------------------------

-- Foundation Lock: soft-delete enforcement
-- Application clients must not hard-delete business rows (except saas_admin purge).
-- @see docs/05-architecture/FOUNDATION_LOCK.md
-- @see docs/adr/0009-foundation-lock.md

-- deleted_by on catalog core
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Replace staff DELETE policies with saas_admin-only purge policies
DROP POLICY IF EXISTS dishes_delete ON public.dishes;
CREATE POLICY dishes_purge ON public.dishes FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

DROP POLICY IF EXISTS ingredients_all ON public.ingredients;
CREATE POLICY ingredients_read ON public.ingredients FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY ingredients_write ON public.ingredients FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_update ON public.ingredients FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_purge ON public.ingredients FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

DROP POLICY IF EXISTS suppliers_all ON public.suppliers;
CREATE POLICY suppliers_read ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY suppliers_write ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY suppliers_purge ON public.suppliers FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Customers / companies / ops: drop unrestricted DELETE via ALL policies where possible
-- Keep UPDATE for soft-delete; DELETE only saas_admin

DROP POLICY IF EXISTS companies_all ON public.companies;
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY companies_write ON public.companies FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_purge ON public.companies FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Weekly menus: split ALL into insert/update + saas purge
DROP POLICY IF EXISTS wm_write ON public.weekly_menus;
CREATE POLICY wm_insert ON public.weekly_menus FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY wm_update ON public.weekly_menus FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY wm_purge ON public.weekly_menus FOR DELETE TO authenticated
  USING (public.is_saas_admin(auth.uid()));

-- Allow saas_admin on dish insert/update (Architecture Review gap)
DROP POLICY IF EXISTS dishes_write ON public.dishes;
CREATE POLICY dishes_write ON public.dishes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
DROP POLICY IF EXISTS dishes_update ON public.dishes;
CREATE POLICY dishes_update ON public.dishes FOR UPDATE TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- MIGRATION: 20260721190000_dish_infra_align_domain.sql
-- ---------------------------------------------------------------------

-- Infrastructure Validation: align dishes persistence with Dish domain aggregate.
-- Does NOT change domain or application — schema follows the Core.

-- 1) Domain status `inactive`
ALTER TYPE public.dish_status ADD VALUE IF NOT EXISTS 'inactive';

-- 2) Fields required / used by the Dish aggregate
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT 'legacy-uncategorized',
  ADD COLUMN IF NOT EXISTS recipe_id text NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.dishes.category_id IS 'Domain CategoryId — Category aggregate may arrive later';
COMMENT ON COLUMN public.dishes.recipe_id IS 'Domain RecipeId reference — nullable';
COMMENT ON COLUMN public.dishes.tags IS 'Domain dish tags';

-- ---------------------------------------------------------------------
-- MIGRATION: 20260722172703_596a291b-6c2c-4e61-a38a-27760d7bc0bc.sql
-- ---------------------------------------------------------------------

-- Re-assert dish schema alignment to trigger types.ts regeneration.
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT 'legacy-uncategorized',
  ADD COLUMN IF NOT EXISTS recipe_id text NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'dish_status' AND e.enumlabel = 'inactive'
  ) THEN
    ALTER TYPE public.dish_status ADD VALUE 'inactive';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260722172737_55b5491b-422d-4966-b5df-fb5c62d8ed02.sql
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_tenant_created_idx ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_read ON public.audit_log;
CREATE POLICY audit_log_read ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_saas_admin(auth.uid()) OR (tenant_id IS NOT NULL AND public.has_role(auth.uid(), tenant_id, 'company_admin')));
DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (public.is_saas_admin(auth.uid()) OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))));

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_global_key_uidx ON public.feature_flags (key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_tenant_key_uidx ON public.feature_flags (tenant_id, key) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS feature_flags_tenant_idx ON public.feature_flags (tenant_id);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flags_read ON public.feature_flags;
CREATE POLICY feature_flags_read ON public.feature_flags FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));
DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid())) WITH CHECK (public.is_saas_admin(auth.uid()));
DROP TRIGGER IF EXISTS feature_flags_touch_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_touch_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT 'dish_library','Dish Library module',true,NULL,'{"module":"catalog","phase":"first"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key='dish_library' AND tenant_id IS NULL);

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723120000_program_draft_order_atomic.sql
-- ---------------------------------------------------------------------

-- Hardening INC-05: atomic draft order + items
-- Hardening INC-07: seed order programming / confirmation flags

CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_row public.order_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_tenant_member(_tenant_id) THEN
    RAISE EXCEPTION 'not a tenant member';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  -- Customer must belong to tenant; customers may only program for themselves.
  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(_tenant_id, auth.uid())
        OR public.is_saas_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'customer not allowed';
  END IF;

  INSERT INTO public.orders (
    tenant_id,
    customer_id,
    week_start,
    status,
    total,
    notes
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1)
    )
    RETURNING * INTO v_row;

    v_items := v_items || jsonb_build_array(to_jsonb(v_row));
  END LOOP;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO service_role;

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'order_programming',
  'CAP-004 — program Draft order mutation',
  true,
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'order_programming' AND tenant_id IS NULL
);

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'order_confirmation',
  'CAP-006 — confirm Draft → Confirmed mutation',
  true,
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'order_confirmation' AND tenant_id IS NULL
);

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723174724_de4a9047-5477-4932-abcc-94ce217570b3.sql
-- ---------------------------------------------------------------------


-- 1. Extend tenants with brand columns
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS brand_logo_path text,
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS brand_primary_foreground text,
  ADD COLUMN IF NOT EXISTS brand_accent text,
  ADD COLUMN IF NOT EXISTS brand_updated_at timestamptz;

-- 2. Validation trigger: colors HEX, logo path scoped to tenant id
CREATE OR REPLACE FUNCTION public.validate_tenant_branding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.brand_primary IS NOT NULL
     AND NEW.brand_primary !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_primary must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_primary_foreground IS NOT NULL
     AND NEW.brand_primary_foreground !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_primary_foreground must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_accent IS NOT NULL
     AND NEW.brand_accent !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_accent must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_logo_path IS NOT NULL
     AND position(NEW.id::text || '/' in NEW.brand_logo_path) <> 1 THEN
    RAISE EXCEPTION 'brand_logo_path must live under {tenant_id}/';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS tenants_validate_branding ON public.tenants;
CREATE TRIGGER tenants_validate_branding
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_branding();

-- 3. Storage bucket + policies on tenant-branding
--    Path convention: {tenant_id}/logo.<ext>
--    Read: any member of the tenant
--    Write: company_admin of that tenant, or saas_admin
-- INFRA-009/011: idempotent bucket create before policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tenant_branding_read"          ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_insert"  ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_update"  ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_delete"  ON storage.objects;

CREATE POLICY "tenant_branding_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND public.is_tenant_member(
    NULLIF(split_part(name, '/', 1), '')::uuid
  )
);

CREATE POLICY "tenant_branding_write_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);

CREATE POLICY "tenant_branding_write_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);

CREATE POLICY "tenant_branding_write_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723183000_b2b_b2c_customer_model.sql
-- ---------------------------------------------------------------------

-- B2B / B2C Customer Model — structural correction (ADR 0015)
-- Evolves foresight companies/* tables; does not break individual CJ-001.

-- ========== Company Account enrichment ==========
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_code text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS commercial_terms text,
  ADD COLUMN IF NOT EXISTS fiscal_address text,
  ADD COLUMN IF NOT EXISTS org_unit_label text NOT NULL DEFAULT 'Departamento',
  ADD COLUMN IF NOT EXISTS internal_location_label text NOT NULL DEFAULT 'Ubicación',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill codes for any existing rows
UPDATE public.companies c
SET company_code = 'EC-' || upper(substr(replace(c.id::text, '-', ''), 1, 4))
WHERE c.company_code IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN company_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS companies_tenant_code_uidx
  ON public.companies (tenant_id, company_code)
  WHERE deleted_at IS NULL;

-- ========== Site (= company_locations) ==========
ALTER TABLE public.company_locations
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ========== Organizational Unit (= company_departments) ==========
ALTER TABLE public.company_departments
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ========== Employee Membership (= company_employees) ==========
ALTER TABLE public.company_employees
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.company_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_location text,
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS company_employees_active_uidx
  ON public.company_employees (tenant_id, company_id, customer_id)
  WHERE deleted_at IS NULL;

-- ========== Delivery Group ==========
CREATE TABLE IF NOT EXISTS public.delivery_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.company_locations(id) ON DELETE CASCADE,
  organizational_unit_id uuid NOT NULL REFERENCES public.company_departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_groups TO authenticated;
GRANT ALL ON public.delivery_groups TO service_role;
ALTER TABLE public.delivery_groups ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS delivery_groups_natural_uidx
  ON public.delivery_groups (tenant_id, company_id, site_id, organizational_unit_id)
  WHERE deleted_at IS NULL;

CREATE POLICY delivery_groups_read ON public.delivery_groups FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));

CREATE POLICY delivery_groups_write ON public.delivery_groups FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.tenant_id = delivery_groups.tenant_id
        AND ce.company_id = delivery_groups.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.tenant_id = delivery_groups.tenant_id
        AND ce.company_id = delivery_groups.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

-- ========== Order B2B context ==========
DO $$ BEGIN
  CREATE TYPE public.demand_channel AS ENUM ('individual', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS demand_channel public.demand_channel NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.company_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organizational_unit_id uuid REFERENCES public.company_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_group_id uuid REFERENCES public.delivery_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

-- ========== Helpers ==========
CREATE OR REPLACE FUNCTION public.generate_company_code(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_n int;
BEGIN
  FOR v_n IN 1..50 LOOP
    v_code := 'EC-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.tenant_id = p_tenant_id
        AND c.company_code = v_code
        AND c.deleted_at IS NULL
    );
  END LOOP;
  RETURN v_code;
END;
$$;

-- Ensure Individual customer + tenant membership + customer role (CJ-001 safety)
CREATE OR REPLACE FUNCTION public.ensure_individual_customer(
  p_tenant_id uuid,
  p_user_id uuid,
  p_display_name text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (p_tenant_id, p_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, p_tenant_id, 'customer')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (tenant_id, user_id, kind, display_name, email)
    VALUES (
      p_tenant_id,
      p_user_id,
      'individual',
      COALESCE(p_display_name, p_email, 'Customer'),
      p_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_company_code(uuid) TO authenticated;

-- Resolve or create Delivery Group for Site + OU
CREATE OR REPLACE FUNCTION public.resolve_delivery_group(
  p_tenant_id uuid,
  p_company_id uuid,
  p_site_id uuid,
  p_ou_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_site_name text;
  v_ou_name text;
BEGIN
  SELECT id INTO v_id
  FROM public.delivery_groups
  WHERE tenant_id = p_tenant_id
    AND company_id = p_company_id
    AND site_id = p_site_id
    AND organizational_unit_id = p_ou_id
    AND deleted_at IS NULL;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT name INTO v_site_name FROM public.company_locations WHERE id = p_site_id;
  SELECT name INTO v_ou_name FROM public.company_departments WHERE id = p_ou_id;

  INSERT INTO public.delivery_groups (tenant_id, company_id, site_id, organizational_unit_id, name)
  VALUES (
    p_tenant_id,
    p_company_id,
    p_site_id,
    p_ou_id,
    coalesce(v_site_name, 'Site') || ' · ' || coalesce(v_ou_name, 'Unit')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) TO authenticated;

-- ========== RLS: allow company portal admins to manage their company ==========
-- Foundation Lock (20260720220000) split the legacy companies_all
-- policy into companies_read / companies_write / companies_update /
-- companies_purge.
--
-- B2B replaces those policies with a richer authorization model.
-- Therefore previous policies must be removed before recreating them.
DROP POLICY IF EXISTS companies_all ON public.companies;
DROP POLICY IF EXISTS companies_read ON public.companies;
DROP POLICY IF EXISTS companies_write ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
DROP POLICY IF EXISTS companies_purge ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
CREATE POLICY companies_read ON public.companies FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY companies_write ON public.companies FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = companies.id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
    OR NOT EXISTS (SELECT 1 FROM public.companies c2 WHERE c2.id = companies.id)
  );

-- Insert path for new company registration (authenticated tenant member)
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

DROP POLICY IF EXISTS cloc_all ON public.company_locations;
CREATE POLICY cloc_read ON public.company_locations FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cloc_write ON public.company_locations FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_locations.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS cdept_all ON public.company_departments;
CREATE POLICY cdept_read ON public.company_departments FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = (
        SELECT cl.company_id FROM public.company_locations cl
        WHERE cl.id = company_departments.company_location_id
      )
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cdept_write ON public.company_departments FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      JOIN public.company_locations cl ON cl.company_id = ce.company_id
      WHERE cl.id = company_departments.company_location_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      JOIN public.company_locations cl ON cl.company_id = ce.company_id
      WHERE cl.id = company_departments.company_location_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS cemp_all ON public.company_employees;
CREATE POLICY cemp_read ON public.company_employees FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );
CREATE POLICY cemp_write ON public.company_employees FOR ALL TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.customers cu
      WHERE cu.id = company_employees.customer_id AND cu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees ce
      JOIN public.customers cu ON cu.id = ce.customer_id
      WHERE ce.company_id = company_employees.company_id
        AND ce.is_admin = true
        AND ce.deleted_at IS NULL
        AND cu.user_id = auth.uid()
    )
  );

-- ========== program_draft_order: stamp B2B context (CJ-001 individual default) ==========
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb,
  _demand_channel public.demand_channel DEFAULT 'individual',
  _company_id uuid DEFAULT NULL,
  _site_id uuid DEFAULT NULL,
  _organizational_unit_id uuid DEFAULT NULL,
  _delivery_group_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_row public.order_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_tenant_member(_tenant_id) THEN
    RAISE EXCEPTION 'not a tenant member';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(auth.uid(), _tenant_id)
        OR public.is_saas_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'customer not allowed';
  END IF;

  INSERT INTO public.orders (
    tenant_id,
    customer_id,
    week_start,
    status,
    total,
    notes,
    demand_channel,
    company_id,
    site_id,
    organizational_unit_id,
    delivery_group_id
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes,
    COALESCE(_demand_channel, 'individual'),
    _company_id,
    _site_id,
    _organizational_unit_id,
    _delivery_group_id
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1)
    )
    RETURNING * INTO v_row;

    v_items := v_items || jsonb_build_array(to_jsonb(v_row));
  END LOOP;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb, public.demand_channel, uuid, uuid, uuid, uuid) TO service_role;

-- Keep old signature working for callers that omit B2B args
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.program_draft_order(
    _tenant_id, _customer_id, _week_start, _total, _notes, _items,
    'individual'::public.demand_channel, NULL, NULL, NULL, NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO service_role;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723190000_company_provision_staff_only.sql
-- ---------------------------------------------------------------------

-- Tighten Company Account creation: only Tenant staff / SaaS (commercial event).
-- Employees join via membership; they must not INSERT companies.

DROP POLICY IF EXISTS companies_insert ON public.companies;

CREATE POLICY companies_insert_staff ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  );

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql
-- ---------------------------------------------------------------------


-- Owner helper for customer-scoped tables
CREATE OR REPLACE FUNCTION public.is_customer_owner(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = _customer_id AND user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_customer_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_customer_owner(uuid) TO authenticated;

-- customers: restrict SELECT to staff / saas admin / self
DROP POLICY IF EXISTS customers_tenant_read ON public.customers;
CREATE POLICY customers_tenant_read ON public.customers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
  );

-- customer_addresses: staff or owner
DROP POLICY IF EXISTS caddr_all ON public.customer_addresses;
CREATE POLICY caddr_all ON public.customer_addresses
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_allergies
DROP POLICY IF EXISTS callergy_all ON public.customer_allergies;
CREATE POLICY callergy_all ON public.customer_allergies
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_phones
DROP POLICY IF EXISTS cphone_all ON public.customer_phones;
CREATE POLICY cphone_all ON public.customer_phones
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- customer_preferences
DROP POLICY IF EXISTS cpref_all ON public.customer_preferences;
CREATE POLICY cpref_all ON public.customer_preferences
  FOR ALL TO authenticated
  USING (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  )
  WITH CHECK (
    has_any_staff_role(auth.uid(), tenant_id)
    OR is_saas_admin(auth.uid())
    OR is_customer_owner(customer_id)
  );

-- company_departments: staff-only
DROP POLICY IF EXISTS cdept_all ON public.company_departments;
CREATE POLICY cdept_all ON public.company_departments
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- company_employees: staff-only
DROP POLICY IF EXISTS cemp_all ON public.company_employees;
CREATE POLICY cemp_all ON public.company_employees
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- company_locations: staff-only
DROP POLICY IF EXISTS cloc_all ON public.company_locations;
CREATE POLICY cloc_all ON public.company_locations
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- suppliers: staff-only
DROP POLICY IF EXISTS suppliers_all ON public.suppliers;
CREATE POLICY suppliers_all ON public.suppliers
  FOR ALL TO authenticated
  USING (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()))
  WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR is_saas_admin(auth.uid()));

-- Lock down SECURITY DEFINER helpers from anonymous callers.
-- These are RLS helpers; anon has no reason to call them. Authenticated must
-- retain EXECUTE because policies evaluate them in the caller's role context.
REVOKE EXECUTE ON FUNCTION public.current_user_tenants() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_saas_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_staff_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_user_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_staff_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723200000_operations_workspace_statuses.sql
-- ---------------------------------------------------------------------

-- Part 1: extend enums (must commit before function uses new labels)

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'prepared';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivery_issue';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';

-- ---------------------------------------------------------------------
-- MIGRATION: 20260723200100_operations_transition_rpc.sql
-- ---------------------------------------------------------------------

-- Part 2: staff role helper + transition RPC (after new enum values are committed)

CREATE OR REPLACE FUNCTION public.has_any_staff_role(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN (
        'company_admin',
        'operations_manager',
        'kitchen',
        'purchasing',
        'inventory',
        'production',
        'support',
        'accounting',
        'logistics',
        'delivery'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_tenant_id uuid,
  p_order_id uuid,
  p_to_status public.order_status
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_from public.order_status;
  v_ok boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.has_any_staff_role(auth.uid(), p_tenant_id)
    OR public.is_saas_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT * INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.tenant_id = p_tenant_id
    AND o.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  v_from := v_order.status;

  IF v_from = 'confirmed' AND p_to_status = 'in_production' THEN v_ok := true; END IF;
  IF v_from = 'in_production' AND p_to_status = 'prepared' THEN v_ok := true; END IF;
  IF v_from = 'prepared' AND p_to_status = 'ready_for_delivery' THEN v_ok := true; END IF;
  IF v_from = 'ready_for_delivery' AND p_to_status = 'out_for_delivery' THEN v_ok := true; END IF;
  IF v_from = 'out_for_delivery' AND p_to_status IN ('delivered', 'delivery_issue') THEN v_ok := true; END IF;
  IF v_from = 'delivery_issue' AND p_to_status = 'out_for_delivery' THEN v_ok := true; END IF;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'invalid transition % → %', v_from, p_to_status;
  END IF;

  UPDATE public.orders
  SET status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_status(uuid, uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order_status(uuid, uuid, public.order_status) TO service_role;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260724132839_f9e39003-6584-4d8b-af26-975d95c6dd20.sql
-- ---------------------------------------------------------------------


-- 1) ensure_individual_customer: authorize caller
CREATE OR REPLACE FUNCTION public.ensure_individual_customer(
  p_tenant_id uuid,
  p_user_id uuid,
  p_display_name text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_user_id <> auth.uid()
     AND NOT (public.has_any_staff_role(auth.uid(), p_tenant_id)
              OR public.is_saas_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (p_tenant_id, p_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, p_tenant_id, 'customer')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (tenant_id, user_id, kind, display_name, email)
    VALUES (
      p_tenant_id,
      p_user_id,
      'individual',
      COALESCE(p_display_name, p_email, 'Customer'),
      p_email
    )
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;

-- 2) resolve_delivery_group: require staff / tenant membership
CREATE OR REPLACE FUNCTION public.resolve_delivery_group(
  p_tenant_id uuid,
  p_company_id uuid,
  p_site_id uuid,
  p_ou_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_site_name text;
  v_ou_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (public.has_any_staff_role(auth.uid(), p_tenant_id)
          OR public.is_saas_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT id INTO v_id
  FROM public.delivery_groups
  WHERE tenant_id = p_tenant_id
    AND company_id = p_company_id
    AND site_id = p_site_id
    AND organizational_unit_id = p_ou_id
    AND deleted_at IS NULL;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT name INTO v_site_name FROM public.company_locations WHERE id = p_site_id;
  SELECT name INTO v_ou_name FROM public.company_departments WHERE id = p_ou_id;

  INSERT INTO public.delivery_groups (tenant_id, company_id, site_id, organizational_unit_id, name)
  VALUES (
    p_tenant_id,
    p_company_id,
    p_site_id,
    p_ou_id,
    coalesce(v_site_name, 'Site') || ' · ' || coalesce(v_ou_name, 'Unit')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3) Revoke anon EXECUTE on handle_new_user trigger helper
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

-- 4) Split RLS on companies, ingredients, dish_ingredients:
--    reads restricted to staff / saas_admin; writes already staff-only.

-- companies
DROP POLICY IF EXISTS companies_all ON public.companies;
CREATE POLICY companies_select_staff ON public.companies
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY companies_write_staff ON public.companies
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- ingredients
DROP POLICY IF EXISTS ingredients_all ON public.ingredients;
CREATE POLICY ingredients_select_staff ON public.ingredients
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY ingredients_write_staff ON public.ingredients
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- dish_ingredients
DROP POLICY IF EXISTS dish_ing_all ON public.dish_ingredients;
CREATE POLICY dish_ingredients_select_staff ON public.dish_ingredients
  FOR SELECT TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
CREATE POLICY dish_ingredients_write_staff ON public.dish_ingredients
  FOR ALL TO authenticated
  USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- MIGRATION: 20260724132857_5f8e76e5-5e14-45a6-b36a-d890ab2e6d20.sql
-- ---------------------------------------------------------------------


REVOKE EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260724160000_customer_dish_favorites.sql
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- MIGRATION: 20260724170000_kitchen_production_batches.sql
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- MIGRATION: 20260724185434_2bdc2c0f-86fa-45f7-bb2a-d34dfe96ee30.sql
-- ---------------------------------------------------------------------

ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260725120000_op002_platform_owners_bootstrap.sql
-- ---------------------------------------------------------------------

-- OP-002 · Permanent Platform Owners Bootstrap
-- Auth → Profile → Membership → user_roles → RBAC
-- Idempotent. No new roles/enums. No RBAC bypass.

-- Prevent duplicate platform saas_admin rows (NULL tenant_id breaks UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_saas_admin_uidx
  ON public.user_roles (user_id)
  WHERE role = 'saas_admin' AND tenant_id IS NULL;

-- Placeholder until 20260725123000_op002_platform_owners_config.sql installs
-- public.platform_owners and replaces this with a table-backed check.
-- Owner emails live in config/bootstrap/platform-owners.json (ops config),
-- not in application source.
CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT false;
$$;

COMMENT ON FUNCTION public.is_platform_owner_email(text) IS
  'OP-002: Platform Owner allowlist check (replaced by config-backed implementation in later migration).';

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_for_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_tenant_id uuid;
  v_full_name text;
  v_created_saas boolean := false;
  v_created_company boolean := false;
  v_member_rows int := 0;
  v_profile_ok boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_user_id');
  END IF;

  SELECT lower(trim(u.email)),
         coalesce(
           nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
           nullif(trim(u.raw_user_meta_data->>'name'), ''),
           'Platform Owner'
         )
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = _user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
  END IF;

  IF NOT public.is_platform_owner_email(v_email) THEN
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'not_platform_owner',
      'email', v_email
    );
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = 'eatclean-tenerife'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'tenant_missing',
      'tenant_slug', 'eatclean-tenerife',
      'email', v_email
    );
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, v_full_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
      WHEN public.profiles.full_name IS NULL
        OR btrim(public.profiles.full_name) = ''
      THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;
  v_profile_ok := true;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, _user_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_member_rows = ROW_COUNT;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'saas_admin'
      AND tenant_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, NULL, 'saas_admin');
    v_created_saas := true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = v_tenant_id
      AND role = 'company_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, v_tenant_id, 'company_admin');
    v_created_company := true;
  END IF;

  -- Audit only when something new was granted (idempotent re-runs stay quiet).
  IF v_member_rows > 0 OR v_created_saas OR v_created_company THEN
    INSERT INTO public.audit_log (
      tenant_id, actor_id, entity_type, entity_id, action, new_data
    ) VALUES (
      v_tenant_id,
      _user_id,
      'user_role',
      _user_id,
      'PLATFORM_OWNER_ENSURED',
      jsonb_build_object(
        'email', v_email,
        'tenant_slug', 'eatclean-tenerife',
        'roles', jsonb_build_array('saas_admin', 'company_admin'),
        'via', 'ensure_platform_owner_for_user',
        'created_membership', v_member_rows > 0,
        'created_saas_admin', v_created_saas,
        'created_company_admin', v_created_company
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'applied', true,
    'email', v_email,
    'user_id', _user_id,
    'tenant_id', v_tenant_id,
    'tenant_slug', 'eatclean-tenerife',
    'profile', v_profile_ok,
    'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

COMMENT ON FUNCTION public.ensure_platform_owner_for_user(uuid) IS
  'OP-002: idempotent Platform Owner grants (saas_admin + company_admin on EatClean Tenerife).';

-- First-login path: authenticated caller ensures grants for self only.
CREATE OR REPLACE FUNCTION public.ensure_platform_owner_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  RETURN public.ensure_platform_owner_for_user(v_uid);
END;
$$;

COMMENT ON FUNCTION public.ensure_platform_owner_session() IS
  'OP-002: session bootstrap for permanent Platform Owners on first login.';

-- Extend signup trigger: profile (existing) + platform-owner grants when email matches.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF public.is_platform_owner_email(NEW.email) THEN
    PERFORM public.ensure_platform_owner_for_user(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_for_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_session() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_for_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_session() TO authenticated, service_role;

-- Backfill runs in 20260725123000_op002_platform_owners_config.sql after the
-- platform_owners config table is populated from bootstrap configuration.

-- ---------------------------------------------------------------------
-- MIGRATION: 20260725123000_op002_platform_owners_config.sql
-- ---------------------------------------------------------------------

-- OP-002.1 · Platform Owners as bootstrap configuration (not hardcoded app logic)
-- Source of operational truth: config/bootstrap/platform-owners.json
-- Runtime allowlist: public.platform_owners (synced by npm run seed:platform-owners)

CREATE TABLE IF NOT EXISTS public.platform_owners (
  email text PRIMARY KEY,
  full_name text,
  tenant_slug text NOT NULL DEFAULT 'eatclean-tenerife',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_owners_email_lower CHECK (email = lower(btrim(email))),
  CONSTRAINT platform_owners_tenant_slug_format CHECK (tenant_slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.platform_owners IS
  'OP-002: bootstrap allowlist for Platform Owners. Synced from config/bootstrap/platform-owners.json — do not hardcode emails in application source.';

CREATE INDEX IF NOT EXISTS platform_owners_active_idx
  ON public.platform_owners (email)
  WHERE active;

GRANT ALL ON public.platform_owners TO service_role;
-- No direct client reads — emails stay out of the browser bundle / RLS surface.
REVOKE ALL ON public.platform_owners FROM PUBLIC, anon, authenticated;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;

-- Initial bootstrap rows (match config/bootstrap/platform-owners.json).
-- Future ownership changes: edit the JSON config and re-run seed:platform-owners.
INSERT INTO public.platform_owners (email, full_name, tenant_slug, active)
VALUES
  ('alex1409h@gmail.com', 'Alex Hernandez', 'eatclean-tenerife', true),
  ('alexhdezmtinez@gmail.com', 'Alex Hdez Martinez', 'eatclean-tenerife', true)
ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      tenant_slug = EXCLUDED.tenant_slug,
      active = true,
      updated_at = now();

-- Allowlist now reads configuration table (was hardcoded IMMUTABLE list).
CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_owners po
    WHERE po.active
      AND po.email = lower(trim(coalesce(_email, '')))
  );
$$;

COMMENT ON FUNCTION public.is_platform_owner_email(text) IS
  'OP-002: true when email is an active row in public.platform_owners (bootstrap config).';

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_for_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_tenant_id uuid;
  v_tenant_slug text;
  v_full_name text;
  v_owner_name text;
  v_created_saas boolean := false;
  v_created_company boolean := false;
  v_member_rows int := 0;
  v_profile_ok boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_user_id');
  END IF;

  SELECT lower(trim(u.email)),
         coalesce(
           nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
           nullif(trim(u.raw_user_meta_data->>'name'), ''),
           NULL
         )
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = _user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
  END IF;

  SELECT po.full_name, po.tenant_slug
    INTO v_owner_name, v_tenant_slug
  FROM public.platform_owners po
  WHERE po.active
    AND po.email = v_email;

  IF v_tenant_slug IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'not_platform_owner',
      'email', v_email
    );
  END IF;

  v_full_name := coalesce(v_full_name, v_owner_name, 'Platform Owner');

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = v_tenant_slug
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'tenant_missing',
      'tenant_slug', v_tenant_slug,
      'email', v_email
    );
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, v_full_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
      WHEN public.profiles.full_name IS NULL
        OR btrim(public.profiles.full_name) = ''
      THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;
  v_profile_ok := true;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, _user_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_member_rows = ROW_COUNT;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'saas_admin'
      AND tenant_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, NULL, 'saas_admin');
    v_created_saas := true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = v_tenant_id
      AND role = 'company_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, v_tenant_id, 'company_admin');
    v_created_company := true;
  END IF;

  IF v_member_rows > 0 OR v_created_saas OR v_created_company THEN
    INSERT INTO public.audit_log (
      tenant_id, actor_id, entity_type, entity_id, action, new_data
    ) VALUES (
      v_tenant_id,
      _user_id,
      'user_role',
      _user_id,
      'PLATFORM_OWNER_ENSURED',
      jsonb_build_object(
        'email', v_email,
        'tenant_slug', v_tenant_slug,
        'roles', jsonb_build_array('saas_admin', 'company_admin'),
        'via', 'ensure_platform_owner_for_user',
        'created_membership', v_member_rows > 0,
        'created_saas_admin', v_created_saas,
        'created_company_admin', v_created_company
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'applied', true,
    'email', v_email,
    'user_id', _user_id,
    'tenant_id', v_tenant_id,
    'tenant_slug', v_tenant_slug,
    'profile', v_profile_ok,
    'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

-- Revoke Platform Owner grants when an email is removed/deactivated from bootstrap config.
CREATE OR REPLACE FUNCTION public.revoke_platform_owner_for_email(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_user_id uuid;
  v_tenant_slug text;
  v_tenant_id uuid;
  v_removed_saas int := 0;
  v_removed_company int := 0;
BEGIN
  IF v_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_email');
  END IF;

  SELECT po.tenant_slug INTO v_tenant_slug
  FROM public.platform_owners po
  WHERE po.email = v_email;

  IF v_tenant_slug IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'applied', false, 'reason', 'unknown_email');
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'auth_user_not_found',
      'email', v_email
    );
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = v_tenant_slug
  LIMIT 1;

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'saas_admin'
    AND tenant_id IS NULL;
  GET DIAGNOSTICS v_removed_saas = ROW_COUNT;

  IF v_tenant_id IS NOT NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id
      AND role = 'company_admin'
      AND tenant_id = v_tenant_id;
    GET DIAGNOSTICS v_removed_company = ROW_COUNT;
  END IF;

  IF v_removed_saas > 0 OR v_removed_company > 0 THEN
    INSERT INTO public.audit_log (
      tenant_id, actor_id, entity_type, entity_id, action, new_data
    ) VALUES (
      v_tenant_id,
      v_user_id,
      'user_role',
      v_user_id,
      'PLATFORM_OWNER_REVOKED',
      jsonb_build_object(
        'email', v_email,
        'tenant_slug', v_tenant_slug,
        'removed_saas_admin', v_removed_saas > 0,
        'removed_company_admin', v_removed_company > 0,
        'via', 'revoke_platform_owner_for_email'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'applied', v_removed_saas > 0 OR v_removed_company > 0,
    'email', v_email,
    'user_id', v_user_id,
    'removed_saas_admin', v_removed_saas > 0,
    'removed_company_admin', v_removed_company > 0
  );
END;
$$;

COMMENT ON FUNCTION public.revoke_platform_owner_for_email(text) IS
  'OP-002: revoke saas_admin + bootstrap-tenant company_admin when ownership config drops an email.';

REVOKE ALL ON FUNCTION public.revoke_platform_owner_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_platform_owner_for_email(text) TO service_role;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;

-- Backfill: Auth users whose email is an active Platform Owner in config table.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id
    FROM auth.users u
    WHERE public.is_platform_owner_email(u.email)
  LOOP
    PERFORM public.ensure_platform_owner_for_user(r.id);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260728200000_support_note_lifecycle.sql
-- ---------------------------------------------------------------------

-- EP-OPS-003 Support Correction: issue lifecycle (resolve → close)
-- Enables Outcome "Issues Resolved" without redesigning Auth/RBAC.

DO $$ BEGIN
  CREATE TYPE public.support_note_status AS ENUM ('open', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.support_notes
  ADD COLUMN IF NOT EXISTS status public.support_note_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

COMMENT ON COLUMN public.support_notes.status IS
  'Support case lifecycle: open → resolved → closed (EP-OPS-003 Issues Resolved)';

CREATE INDEX IF NOT EXISTS support_notes_tenant_status_kind_idx
  ON public.support_notes (tenant_id, status, kind)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260728202853_48233bd7-5fd1-4f21-a721-7ad67caacaed.sql
-- ---------------------------------------------------------------------

-- Part 1: enum catch-up (values only, no usage in this migration)
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'prepared';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivery_issue';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';

-- Part 2: soft-delete columns (ADR 0006)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_tenant_active_idx
  ON public.orders (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_tenant_active_idx
  ON public.customers (tenant_id) WHERE deleted_at IS NULL;

-- Part 3: B2B / delivery columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

-- Part 4: OP-002 platform owner bootstrap functions
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_saas_admin_uidx
  ON public.user_roles (user_id)
  WHERE role = 'saas_admin' AND tenant_id IS NULL;

CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_for_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_tenant_id uuid;
  v_full_name text;
  v_created_saas boolean := false;
  v_created_company boolean := false;
  v_member_rows int := 0;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_user_id');
  END IF;

  SELECT lower(trim(u.email)),
         coalesce(
           nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
           nullif(trim(u.raw_user_meta_data->>'name'), ''),
           'Platform Owner'
         )
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = _user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
  END IF;

  IF NOT public.is_platform_owner_email(v_email) THEN
    RETURN jsonb_build_object('ok', true, 'applied', false, 'reason', 'not_platform_owner', 'email', v_email);
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = 'eatclean-tenerife'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_missing', 'email', v_email);
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, v_full_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
      WHEN public.profiles.full_name IS NULL OR btrim(public.profiles.full_name) = ''
      THEN EXCLUDED.full_name ELSE public.profiles.full_name END;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, _user_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_member_rows = ROW_COUNT;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'saas_admin' AND tenant_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, NULL, 'saas_admin');
    v_created_saas := true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = v_tenant_id AND role = 'company_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, v_tenant_id, 'company_admin');
    v_created_company := true;
  END IF;

  IF v_member_rows > 0 OR v_created_saas OR v_created_company THEN
    INSERT INTO public.audit_log (tenant_id, actor_id, entity_type, entity_id, action, new_data)
    VALUES (
      v_tenant_id, _user_id, 'user_role', _user_id, 'PLATFORM_OWNER_ENSURED',
      jsonb_build_object(
        'email', v_email,
        'via', 'ensure_platform_owner_for_user',
        'created_membership', v_member_rows > 0,
        'created_saas_admin', v_created_saas,
        'created_company_admin', v_created_company
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'applied', true, 'email', v_email, 'user_id', _user_id,
    'tenant_id', v_tenant_id, 'tenant_slug', 'eatclean-tenerife',
    'profile', true, 'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  RETURN public.ensure_platform_owner_for_user(v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_for_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_session() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_for_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_session() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260728202923_9631ede0-19f6-416e-9706-84e99e666f9c.sql
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.support_note_status AS ENUM ('open', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.support_notes
  ADD COLUMN IF NOT EXISTS status public.support_note_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS support_notes_tenant_status_kind_idx
  ON public.support_notes (tenant_id, status, kind)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- MIGRATION: 20260728210000_accounting_invoice_orders.sql
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- MIGRATION: 20260728220000_accounting_review_period_close.sql
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- MIGRATION: 20260729100000_identity_membership_lifecycle.sql
-- ---------------------------------------------------------------------

-- Identity & Membership lifecycle reinforcement
-- Separates Identity ≠ Profile ≠ Membership ≠ Role ≠ Employment.
-- Creating a user does NOT grant access (Membership Approved + Role required).
-- Does NOT modify Supabase Auth / OAuth / RBAC role catalog / Workspaces.
-- RI-001: multi-tenant membership across tenants remains application-gated (1 user → 1 tenant).

-- ============ ENUMS ============
CREATE TYPE public.membership_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended',
  'revoked'
);

CREATE TYPE public.membership_type AS ENUM (
  'customer',
  'employee',
  'supplier',
  'company',
  'company_employee'
);

CREATE TYPE public.invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

CREATE TYPE public.provisioning_channel AS ENUM (
  'self_registration',
  'invitation',
  'provisioning'
);

-- ============ PROFILES (global person data — not tenant-scoped) ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

COMMENT ON TABLE public.profiles IS
  'Global person profile (1:1 with auth.users). Not tenant-scoped. Identity ≠ Profile.';

-- Optional uniqueness for phone when present
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND length(trim(phone)) > 0;

-- ============ MEMBERSHIP (Persona ↔ Tenant) ============
ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS membership_type public.membership_type NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS status public.membership_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provisioning_channel public.provisioning_channel NOT NULL DEFAULT 'provisioning',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Existing rows are already operational → Approved
UPDATE public.tenant_members
SET
  status = 'approved',
  approved_at = COALESCE(approved_at, joined_at, now()),
  created_at = COALESCE(created_at, joined_at, now())
WHERE status = 'approved';

CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_id_unique
  ON public.tenant_members (id);

COMMENT ON TABLE public.tenant_members IS
  'Membership Persona↔Tenant. Access requires status=approved AND a Role. Create ≠ access.';

-- Access helpers: only Approved memberships count
CREATE OR REPLACE FUNCTION public.current_user_tenants()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
      AND tenant_id = _tenant_id
      AND status = 'approved'
  ) OR public.is_saas_admin(auth.uid())
$$;

-- ============ INVITATIONS ============
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  membership_type public.membership_type NOT NULL,
  intended_role public.app_role,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  channel public.provisioning_channel NOT NULL DEFAULT 'invitation',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One pending invitation per email+tenant
CREATE UNIQUE INDEX IF NOT EXISTS user_invitations_pending_unique
  ON public.user_invitations (tenant_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS user_invitations_tenant_idx
  ON public.user_invitations (tenant_id);

GRANT SELECT ON public.user_invitations TO authenticated;
GRANT ALL ON public.user_invitations TO service_role;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_invitations_admin_read ON public.user_invitations FOR SELECT
  USING (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin')
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
  );

-- ============ EMPLOYMENT (tenant staff labour data — not Identity) ============
CREATE TABLE public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text,
  position text,
  employee_number text,
  hire_date date,
  manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

GRANT SELECT ON public.employee_profiles TO authenticated;
GRANT ALL ON public.employee_profiles TO service_role;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_profiles_self_or_admin_read ON public.employee_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin')
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
  );

COMMENT ON TABLE public.employee_profiles IS
  'Employment data for tenant staff. Separate from Identity, Profile, Membership, and Role.';

-- ---------------------------------------------------------------------
-- MIGRATION: 20260729120000_identity_hardening_v1.sql
-- ---------------------------------------------------------------------

-- Identity Hardening v1 — architectural guarantees (no new product features).
-- Prepares membership_id as operational identity; soft-delete; identity_events;
-- invitation cancelled; membership lifecycle audit stamps.
-- Does NOT modify Auth / OAuth / RBAC catalog / Workspaces / Journeys / Flows.
-- FUTURE: Multi-membership, SSO, SCIM, impersonation — not implemented (P10).

-- ============ P4 · invitation status: cancelled ============
ALTER TYPE public.invitation_status ADD VALUE IF NOT EXISTS 'cancelled';

-- ============ P1 · membership_id as operational identity ============
-- tenant_members.id already exists (ADR 0018). Stabilize + document.
COMMENT ON COLUMN public.tenant_members.id IS
  'Operational membership identity (membership_id). Prefer this over user_id for future operational FKs (orders.created_by_membership_id, etc.). RI-001 still enforces 1 user → 1 tenant in app layer.';

-- Link employment + invitations to membership when known (nullable for backfill)
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS membership_id uuid;

ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS membership_id uuid,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resent_at timestamptz,
  ADD COLUMN IF NOT EXISTS resent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resent_count integer NOT NULL DEFAULT 0;

-- Backfill membership_id on employee_profiles from tenant_members
UPDATE public.employee_profiles ep
SET membership_id = tm.id
FROM public.tenant_members tm
WHERE ep.membership_id IS NULL
  AND ep.user_id = tm.user_id
  AND ep.tenant_id = tm.tenant_id;

UPDATE public.user_invitations ui
SET membership_id = tm.id
FROM public.tenant_members tm
WHERE ui.membership_id IS NULL
  AND ui.user_id = tm.user_id
  AND ui.tenant_id = tm.tenant_id;

CREATE INDEX IF NOT EXISTS employee_profiles_membership_id_idx
  ON public.employee_profiles (membership_id);
CREATE INDEX IF NOT EXISTS user_invitations_membership_id_idx
  ON public.user_invitations (membership_id);

-- Optional FK (soft — membership PK is composite historically; id is unique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_profiles_membership_id_fkey'
  ) THEN
    ALTER TABLE public.employee_profiles
      ADD CONSTRAINT employee_profiles_membership_id_fkey
      FOREIGN KEY (membership_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  -- If FK cannot attach (missing unique/target), keep column without FK
  RAISE NOTICE 'employee_profiles.membership_id FK skipped: %', SQLERRM;
END $$;

-- ============ P3 · soft delete (archive, never destroy) ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- P5 · lifecycle stamps
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Phone uniqueness ignores archived profiles
DROP INDEX IF EXISTS profiles_phone_unique;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL
    AND length(trim(phone)) > 0
    AND deleted_at IS NULL;

-- Access helpers: Approved + not archived
CREATE OR REPLACE FUNCTION public.current_user_tenants()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND status = 'approved'
    AND deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid()
      AND tenant_id = _tenant_id
      AND status = 'approved'
      AND deleted_at IS NULL
  ) OR public.is_saas_admin(auth.uid())
$$;

-- Resolve active membership_id for current user in a tenant (operational identity)
CREATE OR REPLACE FUNCTION public.current_membership_id(_tenant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id
  FROM public.tenant_members
  WHERE user_id = auth.uid()
    AND tenant_id = _tenant_id
    AND status = 'approved'
    AND deleted_at IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_membership_id(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.current_membership_id(uuid) IS
  'Returns operational membership_id for auth.uid() in tenant. Prefer over user_id for new operational writes. FUTURE: multi-membership will need explicit membership selection.';

-- ============ P2 · identity_events (business audit / Activity Timeline) ============
CREATE TYPE public.identity_event_type AS ENUM (
  'USER_REGISTERED',
  'PROFILE_CREATED',
  'PROFILE_UPDATED',
  'INVITATION_SENT',
  'INVITATION_RESENT',
  'INVITATION_ACCEPTED',
  'INVITATION_EXPIRED',
  'INVITATION_CANCELLED',
  'INVITATION_REVOKED',
  'MEMBERSHIP_CREATED',
  'MEMBERSHIP_APPROVED',
  'MEMBERSHIP_REJECTED',
  'MEMBERSHIP_SUSPENDED',
  'MEMBERSHIP_REVOKED',
  'MEMBERSHIP_REACTIVATED',
  'MEMBERSHIP_ARCHIVED',
  'ROLE_ASSIGNED',
  'ROLE_REMOVED',
  'USER_LAST_LOGIN',
  'PASSWORD_RESET',
  'EMAIL_CHANGED',
  'PHONE_CHANGED',
  'ACCESS_DENIED_INCONSISTENT'
);

CREATE TABLE public.identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  membership_id uuid,
  event_type public.identity_event_type NOT NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS identity_events_tenant_user_idx
  ON public.identity_events (tenant_id, user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS identity_events_membership_idx
  ON public.identity_events (membership_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS identity_events_type_idx
  ON public.identity_events (event_type, performed_at DESC);

GRANT SELECT ON public.identity_events TO authenticated;
GRANT ALL ON public.identity_events TO service_role;
ALTER TABLE public.identity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY identity_events_admin_read ON public.identity_events FOR SELECT
  USING (
    public.is_saas_admin(auth.uid())
    OR (
      tenant_id IS NOT NULL
      AND (
        public.has_role(auth.uid(), tenant_id, 'company_admin')
        OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
      )
    )
    OR user_id = auth.uid()
  );

COMMENT ON TABLE public.identity_events IS
  'Business identity audit / Activity Timeline. Does not replace technical audit_log. Soft-delete never removes history.';

-- ============ FUTURE READY (P10) — comments only ============
COMMENT ON TABLE public.tenant_members IS
  'Membership Persona↔Tenant. Access = Approved + Role + not archived. Create ≠ access. FUTURE: multi-membership / tenant switch / SSO / SCIM / impersonation — do not implement without ADR.';

COMMIT;

-- =====================================================================
-- POST-CHECK sugerido (ejecutar aparte, fuera de la transacción):
--   select count(*) from public.tenants;
--   select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--     where n.nspname='public' order by 1;
--   select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;
-- =====================================================================
