# Database

**Source of truth for schema intent:** migrations in `supabase/migrations/` + this document.  
Do not redesign tables from Lovable prompts without an ADR or migration reviewed against ADRs 0001, 0003, 0006.

## Engine

PostgreSQL via Supabase (Lovable Cloud). Generated types: `src/integrations/supabase/types.ts`.

## Migrations (as-built)

| Migration | Purpose |
|-----------|---------|
| `20260720164312_…` | Core enums, multi-tenant schema, RLS, EatClean seed |
| `20260720164327_…` | `touch_updated_at` search_path fix |
| `20260720170834_…` | Regional settings on tenants/profiles |
| `20260720210000_…` | Soft delete columns, `audit_log`, `feature_flags` |

## Multi-tenant model

Every business row carries `tenant_id` (except platform identity tables).

**Helpers (SECURITY DEFINER):**

| Function | Role |
|----------|------|
| `has_role(uid, tenant_id, role)` | Exact role check |
| `is_saas_admin(uid)` | Platform admin |
| `current_user_tenants()` | Membership set |
| `is_tenant_member(tenant_id)` | Member **or** saas_admin |
| `has_any_staff_role(uid, tenant_id)` | Company staff roles (not customer/driver/saas alone) |

## Canonical storage

| Domain | Stored as |
|--------|-----------|
| Weight | grams (`weight_g`, qty in g by convention) |
| Volume | milliliters |
| Distance | kilometers |
| Temperature | Celsius |
| Date/time | `timestamptz` (UTC) |
| Money | `numeric` + ISO currency in regional settings |

## Table inventory

### Platform / identity

`tenants`, `tenant_domains`, `profiles`, `tenant_members`, `user_roles`

### Customer

`customers`, `customer_addresses`, `customer_phones`, `customer_allergies`, `customer_preferences`

### B2B company

`companies`, `company_locations`, `company_departments`, `company_employees`

### Catalog (Dish Library heart)

`suppliers`, `ingredients`, `dishes`, `dish_ingredients`

### Menus & orders

`weekly_menus`, `weekly_menu_slots`, `orders`, `order_items`

### Operations & finance

`routes`, `route_stops`, `invoices`, `payments`, `promotions`, `support_notes`

### Cross-cutting

`audit_log`, `feature_flags`

## Soft delete

**Rule:** business records are never hard-deleted from application flows (ADR 0006).

**Columns:** `deleted_at` on major business tables (customers, companies, suppliers, ingredients, dishes, menus, orders, routes, invoices, payments, promotions, support_notes, …).

**Gaps:**

| Gap | Risk |
|-----|------|
| Junction tables without `deleted_at` (`dish_ingredients`, `weekly_menu_slots`, allergies, preferences) | Orphan vs cascade ambiguity |
| `GRANT DELETE` + DELETE RLS policies remain on many tables | Hard delete still possible via PostgREST |
| No DB trigger forbidding DELETE on soft-delete tables | Enforcement only by convention / Services |

**Recommended direction (P0):** revoke DELETE grants on soft-delete business tables; allow UPDATE of `deleted_at` only; Services never call `.delete()`.

## Audit log

`audit_log`: `tenant_id`, `actor_id`, `entity_type`, `entity_id`, `action`, `old_data`, `new_data`, `ip`, `created_at`.

Written by `AuditService`. RLS: company_admin/saas read; insert as self actor + tenant member.

## Feature flags

`feature_flags`: global (`tenant_id` null) or tenant override. Seeded: `dish_library = true`.

## RLS review (architecture)

**Strengths:** helper-based policies; tenant membership on reads; staff checks on many writes.

**Issues to resolve before Module 01:**

1. **Soft delete vs DELETE policies** — e.g. `dishes_delete` allows hard delete.
2. **saas_admin writes** — `is_tenant_member` helps reads; several `WITH CHECK (has_any_staff_role(...))` omit `is_saas_admin`, so platform admins without membership may fail writes.
3. **Profiles** — self-only; support staff cannot read customer profiles via profiles table (may need staff read policy later).
4. **Broad `FOR ALL`** on child tables — acceptable for foundation; tighten per module.

## Seed

EatClean Tenerife tenant (`slug: eatclean-tenerife`) with Spanish/Canary regional defaults.

**Missing runbook:** how to assign `company_admin` / `saas_admin` for local testing (document when Module 01 starts).

## Module 01 schema focus

Dish Library uses: `dishes`, `dish_ingredients`, `ingredients`, `suppliers` (+ `audit_log`, `feature_flags`).

Do not expand schema into Production/Accounting until those modules start — foresight tables may remain empty.
