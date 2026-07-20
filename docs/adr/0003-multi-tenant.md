# ADR 0003 — Multi-tenant isolation

## Status

Accepted — permanent

## Context

YourMeal OS is a multi-tenant SaaS. The first tenant is EatClean Tenerife; hundreds of companies must share the architecture without redesign.

## Decision

- One database, one platform.
- Everything business-related belongs to a tenant: users (membership), orders, menus, ingredients, invoices, storage, routes, notifications, reports.
- No shared business data across tenants.
- Isolation enforced with `tenant_id` columns and Postgres RLS.
- SaaS administrators may operate cross-tenant via explicit `saas_admin` role checks.

## Consequences

- Every new table with business data must include `tenant_id` and RLS.
- Queries without tenant context are bugs.
- Global reference data (if any) must be documented as non-business and carefully scoped.
