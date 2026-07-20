# Security

## Capability matrix

**Authoritative table:** [CAPABILITY_MATRIX.md](./CAPABILITY_MATRIX.md)

Code: `src/permissions` must stay aligned. Route guards: `src/permissions/route-guards.ts`.

```text
Route → Permission Guard → Service → Repository → Database (RLS)
```

## Authentication

- Supabase Authentication
- `profiles` (`id = auth.uid()`)
- `tenant_members`, `user_roles` (tenant-aware; `saas_admin` platform-scoped)

## Authorization

- Never hardcode role strings in feature UI.
- Use `useCan` / `can` / `requireCapability`.
- Services re-check capabilities; RLS is last line of defense.

## Soft delete / purge

- Staff: `archive` / `restore` only.
- Hard DELETE policies limited to `is_saas_admin` on locked tables.
- Service API: `archive`, `restore`, `purge` — never `delete()`.

## Roles (`app_role`)

See capability matrix columns. Labels: Customer, Employee, Driver, Kitchen, Production, Purchasing, Inventory, Support, Accounting, Logistics, Company Admin, SaaS Admin.

## Audit

Mutations write `audit_log` (who/what/when/old/new/tenant/IP).
