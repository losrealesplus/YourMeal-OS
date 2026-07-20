# Security

## Authentication

- Supabase Authentication
- Profiles table (`profiles.id = auth.uid()`)
- Tenant membership via `tenant_members`
- Roles via `user_roles` (per-tenant; `saas_admin` may have null tenant)

## Authorization

- Permissions must never be hardcoded as role string checks scattered in UI.
- Prefer capability checks: `can("dishes.write")` backed by PermissionService.
- RLS is the last line of defense; Services still enforce business authorization.

## Roles (`app_role`)

| Role | Scope |
|------|-------|
| `customer` | Tenant customer app |
| `employee` | Generic staff |
| `company_admin` | Tenant administration |
| `support` | Customer support |
| `kitchen` | Kitchen |
| `production` | Production |
| `purchasing` | Purchasing |
| `inventory` | Inventory |
| `accounting` | Accounting |
| `logistics` | Logistics |
| `driver` | Delivery |
| `saas_admin` | Platform (cross-tenant) |

## Tenant isolation

- No shared business data.
- RLS: `tenant_id` must match membership (or saas_admin bypass).
- Storage, reports, notifications: always tenant-scoped.

## Audit

Sensitive mutations should write `audit_log` with actor, tenant, entity, old/new, IP when available.

## Soft delete

Prevents accidental permanent loss; retain history for compliance and ops.
