# ADR 0018 — Identity & Membership Lifecycle (User Provisioning)

## Status

Accepted — additive reinforcement (Identity Freeze respected)

## Context

Tenant Admins need to create and invite users inside their organization. Historically, invite flows wrote `tenant_members` **and** `user_roles` in one step, which made **create ≡ access** and bypassed the FOPEBA pipeline.

RI-001 still constrains **one user → one tenant** at the application layer. Multi-membership across tenants remains deferred.

## Decision

Separate layers explicitly:

| Layer | Storage | Responsibility |
|-------|---------|----------------|
| Identity | Supabase Auth `auth.users` | UUID, email, password, verification, MFA (future) |
| Profile | `profiles` | Global person data (`first_name`, `last_name`, `full_name`, phone, locale, …) |
| Membership | `tenant_members` + status/type | Persona ↔ Tenant relationship |
| Role | `user_roles` + capabilities | Permissions (unchanged RBAC) |
| Employment | `employee_profiles` | Department, position, hire data |

**Create ≠ access.** Provisioning / invitation creates Identity (if needed) + Profile + Membership(`pending`) + `user_invitations`. Access requires:

```text
Identity → Profile → Membership(Approved) → Role → Workspace
```

Three incorporation channels (same pipeline):

1. **Self Registration** — user requests access → Membership `pending`
2. **Invitation** — Tenant Admin invites by email → Membership `pending` + invitation
3. **Provisioning** — Tenant Admin creates user directly → Membership `pending` (+ invitation when identity is new)

New capability: `users.create` (company_admin, operations_manager, saas_admin).  
Role assignment remains under `employee.manage` and requires Approved membership.

`is_tenant_member` / `current_user_tenants` only consider `status = approved`.

SaaS Admin alone creates tenants / Tenant Owners (`createCompanyAdmin` remains SaaS-scoped and may grant Approved + Role intentionally).

## Consequences

- Duplicate emails reuse Identity; never create a second auth user.
- Pending members cannot pass RLS tenant membership checks.
- Approved without Role still cannot enter staff workspaces (no capabilities).
- Existing members are backfilled to `approved`.
- Auth / OAuth / RBAC role catalog / Workspaces / Journeys / Flows are untouched.

## References

- ADR [0003](./0003-multi-tenant.md) · [0004](./0004-authentication-rbac.md)
- Capability matrix · `users.create`
- Module: `src/modules/user-provisioning`
