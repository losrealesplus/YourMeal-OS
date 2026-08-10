# 2026-08-10 — Phase 2.2 cold customer tenant association

## Intent

Close BLOCKER-003: cold signup associates an authenticated customer with an
**existing** Tenant via `tenant_join_code`, creating durable `tenant_members`
in **pending** status (P2-DEC-002 · ADR 0018).

## Policy (no invention)

| Lock | Decision applied |
|------|------------------|
| RULE 001–007 | SaaS creates Tenants; signup never creates Tenants; join code resolves server-side |
| P2-DEC-002 | Membership = **pending** (valid code ≠ auto-approve) |
| P2-DEC-003 | `ensure_individual_customer` untouched for cold membership |
| ADR 0018 | Create ≠ access; Session ActiveTenant only when `approved` |

## Materialization

- RPC `request_tenant_association_by_join_code`
- `TenantJoinCodeService.requestAssociation`
- `/auth` signup join-code field
- SessionBootstrap filters `status = approved` for ActiveTenant

## Out of scope

Menu day_date bug · Google/Apple · Customer Bulk · Nutrition · Tenant creation
