# ADR 0064 — Trusted Deployment Customer Auto-Approval (Phase 2.3 Hardening)

## Status

Accepted — additive reinforcement (Identity Freeze & ADR 0018 respected).

## Context

In Phase 2.3, the platform introduced the **SaaS Deployment Registry** (`public.tenant_deployments`) to bind monotenant client runtimes (`platform` + `identifier`) server-side to their respective tenant (`tenant_id`), removing client-side tenant selection.

However, the initial implementation of `request_tenant_association_for_deployment()` reused the `self_registration` channel from ADR 0018 with `status = 'pending'`. While ADR 0018 designed `pending` to guard staff/administrative onboarding (`Create ≠ Access`), applying `pending` to end-user customer self-registrations on official, active deployments created a contract mismatch:

```text
Authenticated Customer on Active Deployment
  → tenant_members(status = 'pending')
  → SessionBootstrapService resolves tenantId = null
  → useWeeklyMenu disabled
  → Postgres RLS is_tenant_member() evaluates FALSE
  → Customer is blocked from viewing public published catalog/menus
```

## Decision

Establish the **Canonical Customer Self-Registration Rule (Option B)**:

1. **Active Trusted Deployment Authority:** When an authenticated user (`auth.uid() IS NOT NULL`) presents a deployment claim (`platform` + `identifier`), and the server resolves this claim to an `active` record in `public.tenant_deployments` belonging to an `active` tenant, the user is automatically granted an **`approved`** membership with `membership_type = 'customer'` and `provisioning_channel = 'self_registration'`.
2. **Administrative Role Protection:**
   - Staff, employee, and administrator incorporations (`membership_type IN ('employee', 'company_admin', 'tenant_admin', 'platform_owner', 'saas_admin')`) and invitations **continue under strict human approval (ADR 0018)**.
   - `request_tenant_association_for_deployment()` will **never** mutate, escalate, or auto-approve administrative memberships.
3. **Atomic Concurrency:** The association uses `INSERT ... ON CONFLICT (tenant_id, user_id) DO UPDATE ...` to guarantee race-condition safety under simultaneous logins.
4. **`AUTH USER != CUSTOMER` Invariant:** Creating an approved customer membership provides tenant scoping (`tenantId`) and catalog RLS access (`is_tenant_member = true`), but **does NOT create rows in `public.customers`** or generate commercial orders/payments.

## Security Model

- **No Client Tenant Injection:** The client never passes `tenant_id`. Authority resides 100% in the SaaS Deployment Registry.
- **No Role Assignment:** Self-registration assigns 0 roles in `user_roles`. The user only gains consumer capabilities (`/app/*`), remaining strictly blocked from administrative surfaces (`/admin/*`, `/saas/*`).
- **Tenant Isolation:** A deployment registered to Tenant A can never associate a user with Tenant B.

## Consequences

- End-user customers logging in via OAuth or email on official web/mobile domains immediately receive active tenant context and can view published weekly menus.
- Zero impact on staff RBAC or administrative invitation lifecycles.
- Existing and new customer self-registrations are safely reconciled upon login without mass-modifying unrelated historical memberships.

## Rollback Plan

Re-apply `supabase/migrations/rollback/20260908120000_customer_deployment_auto_approval.rollback.sql` to restore the pre-ADR 0064 implementation if necessary.

## References

- ADR [0003](./0003-multi-tenant.md) · [0004](./0004-authentication-rbac.md) · [0018](./0018-identity-membership-lifecycle.md)
- [PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK](../00-status/PHASE_2_3_DEPLOYMENT_REGISTRY_SCOPE_LOCK.md)
- Migration: `20260908120000_customer_deployment_auto_approval.sql`
