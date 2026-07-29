# ADR 0019 — Identity Hardening v1

## Status

Accepted — Identity layer **architecture frozen** (guarantees only; no new product features)

## Context

ADR 0018 delivered Identity → Profile → Membership → Role → Provisioning. Growth risk is missing guarantees: business audit, soft-delete, membership as operational identity, invitation edge cases, and consistency checks.

## Decision

Add architectural guarantees without changing Auth, OAuth, RBAC catalog, Workspaces, Journeys, or Flows:

1. **membership_id** as preferred operational actor (`tenant_members.id`); helpers `current_membership_id`.
2. **identity_events** business audit + Admin Activity Timeline.
3. **Soft-archive** on profiles / tenant_members / employee_profiles (`deleted_at`, `deleted_by`).
4. Invitation status includes **cancelled**; resend supported; accept rules hardened.
5. Membership lifecycle stamps: approved / rejected / suspended / revoked / reactivated by+at.
6. **assertAccessConsistency** before treating a user as active.
7. Duplicate identity prevention reinforced (1 email → 1 auth user).
8. Bulk ops **stubs only** (P9).
9. Explicit non-goals (P10): multi-membership, SSO, SCIM, impersonation, tenant switch.

## Consequences

- Identity considered Foundation-stable for product phases ahead.
- Future operational tables should add `created_by_membership_id` without rewriting Identity.
- Technical `audit_log` remains; `identity_events` is the business timeline.

## References

- [IDENTITY_LIFECYCLE.md](../05-architecture/IDENTITY_LIFECYCLE.md)
- ADR [0006](./0006-soft-delete-audit.md) · [0018](./0018-identity-membership-lifecycle.md)
