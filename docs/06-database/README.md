# Database

## Engine

PostgreSQL via Supabase (Lovable Cloud).

## Multi-tenant model

Every business row carries `tenant_id`. RLS policies use:

- `current_user_tenants()`
- `is_tenant_member(tenant_id)`
- `has_role(uid, tenant_id, role)`
- `has_any_staff_role(uid, tenant_id)`
- `is_saas_admin(uid)`

No shared business data across tenants.

## Canonical storage

| Domain | Stored as |
|--------|-----------|
| Weight | grams (`weight_g`, ingredient qty in g) |
| Volume | milliliters |
| Distance | kilometers |
| Temperature | Celsius |
| Date/time | `timestamptz` (UTC) |
| Currency | `numeric` + ISO currency code (tenant/profile settings) |

## Soft delete

Business records are never permanently deleted from the application layer.

Pattern:

- Column: `deleted_at timestamptz NULL`
- Active rows: `deleted_at IS NULL`
- Services filter soft-deleted rows by default
- Prefer UPDATE setting `deleted_at = now()` over DELETE

## Audit log

Table `audit_log` records: who, what, when, old value, new value, tenant, IP (when available).

## Feature flags

Table `feature_flags` supports plan/beta/tenant-scoped rollout. Evaluation lives in Services / permissions — not scattered UI conditionals.

## Core domains (existing)

```text
tenants, tenant_domains, profiles, tenant_members, user_roles
customers (+ addresses, phones, allergies, preferences)
companies (+ locations, departments, employees)
suppliers, ingredients, dishes, dish_ingredients
weekly_menus, weekly_menu_slots
orders, order_items
routes, route_stops
invoices, payments
promotions, support_notes
audit_log, feature_flags
```

## Migrations

Location: `supabase/migrations/`

Apply via Lovable Cloud / Supabase CLI. Do not edit applied migrations; add new ones.

## First module tables

Dish Library centers on `dishes`, `dish_ingredients`, `ingredients`, `suppliers`.
