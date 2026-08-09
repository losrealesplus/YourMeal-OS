# 2026-08-09 — Phase 2.1 tenant_join_code

## Intent

Implement the trusted tenant association credential (`tenant_join_code`) as a
**new** primitive, distinct from `companies.company_code`, per P2-DEC-001.

## Decisions locked

- P2-DEC-001: new globally resolvable join code (not EC- company codes)
- P2-DEC-002: pending membership remains for Phase 2.2 (not this increment)
- P2-DEC-003: `ensure_individual_customer` untouched

## What shipped

- Migration: `tenants.join_code` + unique index + generate/resolve RPCs
- Application contract: `TenantJoinCodeService`
- Static + unit behavioral tests
- No membership creation, no UI, no APK

## Next

Phase 2.2 — cold signup → durable pending membership using this resolver.
