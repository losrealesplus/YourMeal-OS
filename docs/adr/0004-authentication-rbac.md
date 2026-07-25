# ADR 0004 — Authentication and RBAC

## Status

Accepted — permanent

## Context

All users enter one application. Departments and capabilities differ by role. Hardcoded role checks in UI become unmaintainable.

## Decision

- Authentication: Supabase Auth (**native** — OAuth, email/password, OTP, session).
- Application entrypoint: `src/auth/*` (UI must not call Lovable cloud-auth or raw SDK auth APIs).
- OAuth providers use `supabase.auth.signInWithOAuth` with PKCE callback at `/auth/callback`.
- Identity profile: `profiles` (1:1 with `auth.users`).
- Membership: `tenant_members`.
- Roles: `user_roles` + `app_role` enum; roles are tenant-aware.
- Roles include: Customer, Employee, Company Administrator, Customer Support, Kitchen, Production, Purchasing, Inventory, Accounting, Logistics, Driver, SaaS Administrator.
- **Permissions must never be hardcoded** as scattered role string comparisons in components.
- Prefer a PermissionService / capability map; UI asks `can("…")`.

## Consequences

- Adding a role or capability is a data/config change, not a UI rewrite.
- RLS helpers (`has_role`, …) remain the database safety net.
- Route gates use capabilities or shared permission helpers, not one-off role lists.
- Auth works on localhost and production without Lovable’s `/~oauth/initiate` broker (INFRA-003).
