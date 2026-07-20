
# YourMeal OS — Foundation Plan

> **Constitution (source of truth):** see [`docs/`](../docs/README.md) and permanent ADRs in [`docs/adr/`](../docs/adr/).
> This plan remains the original foundation checklist; architecture rules in `docs/` supersede when they differ.

Ship the skeleton, not the features. After you approve this, feature modules (Weekly Menu ordering, Production, Routes, Accounting, etc.) become their own follow-up plans.

## 1. Backend: Lovable Cloud (Supabase)

Enable Lovable Cloud. Multi-tenant model = single DB, `tenant_id` column on every business row, RLS filters by `tenant_id`.

### Auth
- Email + password
- Google OAuth (via Lovable broker)
- Apple OAuth (via Lovable broker)
- Phone / SMS OTP
- Password reset page at `/reset-password`

### Core tables (migration #1 — schema only, seed EatClean Tenerife tenant)

Grants + RLS + `GRANT` blocks on every table.

```text
tenants                (id, slug, name, brand_json, locale_default, status)
tenant_domains         (id, tenant_id, domain, is_primary)
profiles               (id=auth.uid, full_name, avatar_url, locale, phone)
tenant_members         (tenant_id, user_id, joined_at, status)  -- which tenants a user belongs to
app_role               ENUM: saas_admin, company_admin, kitchen, purchasing, inventory,
                             production, support, accounting, logistics, driver, employee, customer
user_roles             (id, tenant_id, user_id, role app_role)  -- roles are per-tenant
has_role(_uid,_tid,_role)  security definer

-- Customer domain (empty scaffolds, no rows)
customers              (id, tenant_id, user_id, kind: individual|company_employee)
customer_addresses     (id, customer_id, tenant_id, label, street, city, zip, geo)
customer_phones        (id, customer_id, tenant_id, phone, is_primary)
customer_allergies     (id, customer_id, tenant_id, allergen)
customer_preferences   (id, customer_id, tenant_id, key, value)

companies              (id, tenant_id, name, billing_rule)
company_locations      (id, company_id, tenant_id, name, address)
company_departments    (id, company_location_id, tenant_id, name)
company_employees      (id, company_id, tenant_id, customer_id, department_id, pay_mode)

-- Catalog
dishes                 (id, tenant_id, name, description, photo_url, kcal, weight_g,
                        macros_json, cost, price, prep_minutes, status)
dish_ingredients       (dish_id, ingredient_id, qty, unit)
dish_allergens         (dish_id, allergen)
ingredients            (id, tenant_id, supplier_id, name, unit, cost, min_stock,
                        stock, expiration)
suppliers              (id, tenant_id, name, contact_json)
ingredient_allergens   (ingredient_id, allergen)

weekly_menus           (id, tenant_id, week_start, status, published_at)
weekly_menu_slots      (id, weekly_menu_id, day_date, dish_id)

-- Orders / operations (empty; features fill these later)
orders                 (id, tenant_id, customer_id, week_start, status, total, notes)
order_items            (id, order_id, tenant_id, dish_id, day_date, qty, comment)

routes                 (id, tenant_id, delivery_date, driver_id, status)
route_stops            (id, route_id, tenant_id, order_id, sequence, eta, delivered_at, geo)

invoices               (id, tenant_id, customer_id, company_id, amount, status,
                        billing_period, pdf_url)
payments               (id, tenant_id, invoice_id, method, amount, paid_at, status)

promotions             (id, tenant_id, scope: global|group|personal, title, body,
                        image_url, starts_at, ends_at)

support_notes          (id, tenant_id, customer_id, kind: note|incident|request, body, author_id)
```

### RLS pattern (every business table)
```sql
-- read/write only if the caller belongs to that tenant
USING  (tenant_id = ANY (public.current_user_tenants()))
WITH CHECK (tenant_id = ANY (public.current_user_tenants()))
```
Plus role-scoped policies via `has_role(auth.uid(), tenant_id, 'company_admin')` for admin surfaces.

`saas_admin` role bypass policy: `has_role(auth.uid(), null, 'saas_admin')`.

Email-domain auto-grant trigger for verified `@eatclean.*` addresses → `company_admin` on the EatClean tenant (safe verified-domain pattern from knowledge).

## 2. Frontend architecture

### Routes (all empty, correctly gated)

```text
src/routes/
  __root.tsx                       shell + providers + i18n
  index.tsx                        public marketing landing (SaaS)
  auth.tsx                         email/pw + Google + Apple + phone tabs
  reset-password.tsx               public

  _authenticated/
    route.tsx                      integration-managed gate

    (customer app — mobile-first)
    app/index.tsx                  Home
    app/menu.tsx                   Weekly Menu
    app/settings.tsx               Settings hub
    app/settings.profile.tsx
    app/settings.addresses.tsx
    app/settings.phones.tsx
    app/settings.payment.tsx
    app/settings.invoices.tsx
    app/settings.orders.tsx
    app/settings.allergies.tsx
    app/settings.preferences.tsx
    app/settings.language.tsx

    (company suite — admin desktop + responsive)
    admin/route.tsx                sidebar shell
    admin/index.tsx                Dashboard
    admin/customers.tsx
    admin/support.tsx
    admin/menus.tsx
    admin/dishes.tsx               Dish Library
    admin/production.tsx
    admin/kitchen.tsx
    admin/purchasing.tsx
    admin/inventory.tsx
    admin/routes.tsx
    admin/accounting.tsx
    admin/reports.tsx
    admin/promotions.tsx
    admin/settings.tsx

    (SaaS admin — tenant management)
    saas/index.tsx                 Tenants
    saas/licenses.tsx
    saas/domains.tsx
    saas/branding.tsx
```

Each route: real `head()` metadata (title, description, og), placeholder body ("Coming soon" + hint of intended layout from the chosen prototype), permission gate via `beforeLoad` reading `context.auth.role`.

### Post-login routing
- role `customer` → `/app`
- role `driver` → `/driver` (deferred)
- any staff role → `/admin`
- `saas_admin` → `/saas`

## 3. Design system (from "Stainless industrial precision")

Port these tokens verbatim into `src/styles.css`:

- Fonts: Inter (400/600/800) display, JetBrains Mono for data. Loaded via `<link>` in `__root.tsx` head.
- Colors (oklch conversions):
  - `--background: #f8fafc`
  - `--foreground: #0f172a`
  - `--muted: #64748b`
  - `--border: #e2e8f0`
  - `--primary: #059669` (emerald)
  - `--accent-warn: #f59e0b`, `--accent-critical: #dc2626`
  - Card surface: `bg-white` + `ring-1 ring-black/5 border border-slate-200`
- Radius: `--radius: 1rem` (cards `rounded-2xl`, phone frame `rounded-[32px]`).
- Motion: `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`, `slideUp` 600ms reveal keyframe.
- Data typography: mono for numbers, uppercase 9–10px labels with `tracking-widest`.
- Multi-tenant theming hook: `--brand-primary` overridable per tenant via a `<style>` injected from `tenants.brand_json` on load.

Shared UI primitives (all shadcn, restyled to tokens):
- `MetricCard` (label / big number / delta)
- `DataTable` header (mono uppercase)
- `StatusPill` (queued / in-progress / completed / critical)
- `MobileFrame` wrapper (dev preview only)
- `PhoneBottomNav` (Home / Menu / Cuenta)
- `AdminSidebar` (shadcn Sidebar, collapsible="icon", tenant chip pinned to footer)

## 4. i18n

- `i18next` + `react-i18next`, `es` (default) + `en`, browser detection, persisted per user in `profiles.locale`.
- Namespaces: `common`, `auth`, `customer`, `admin`.
- Language switcher lives in `/app/settings/language` and admin topbar.
- All placeholder screen copy already keyed.

## 5. Cross-cutting

- TanStack Query set up per template rules; `defaultPreloadStaleTime: 0`.
- `onAuthStateChange` wired once in `__root.tsx` (filtered to identity transitions).
- Sign-in header affordance reflects session; sign-out hygiene (cancelQueries → clear → signOut → replace to `/auth`).
- Root `head()` replaced: "YourMeal OS — The Operating System for Meal Prep & Catering".
- `/` becomes the public marketing landing (placeholder replaced), NOT the customer home.

## 6. Explicitly out of scope for this phase

Weekly menu ordering logic, production/kitchen calculators, route optimization + Google Maps, Stripe/Resend/PostHog wiring, push notifications, tenant white-label admin UI, real dish/ingredient data. Those are follow-up plans once you approve this foundation.

## Deliverable when built
- Cloud enabled, migration #1 applied, EatClean Tenerife tenant seeded.
- Auth works end-to-end for the four methods.
- Sign in as a customer → land on `/app` (empty Home). Sign in as company admin → land on `/admin` (empty Dashboard styled per chosen direction). Sign in as SaaS admin → `/saas`.
- Every listed route renders without errors, with correct metadata and RBAC gate.
- No feature logic beyond navigation and design tokens.
