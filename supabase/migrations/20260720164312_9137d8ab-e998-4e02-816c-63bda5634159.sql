
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
INSERT INTO public.tenants (slug, name, brand, locale_default, status)
VALUES (
  'eatclean-tenerife',
  'EatClean Tenerife',
  jsonb_build_object('primary','#059669','logo_text','EatClean Tenerife','country','ES'),
  'es',
  'active'
) ON CONFLICT (slug) DO NOTHING;
