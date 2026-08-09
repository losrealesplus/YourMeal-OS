# PHASE 2.1 — Tenant Join Code Contract

**Status:** Implemented (source) · pending PR review  
**Authority:** P2-DEC-001 / 002 / 003  
**Baseline:** `origin/main` post MVP-01 (#425 + #426)

## Primitive

| Concept | Storage | Purpose |
|---------|---------|---------|
| `companies.company_code` | `companies.company_code` | Intra-tenant company identity (unchanged) |
| `tenant_join_code` | `tenants.join_code` | Cold association credential → server resolves tenant |

## RPCs

| Function | Who | Effect |
|----------|-----|--------|
| `generate_tenant_join_code(tenant_id)` | company_admin / operations_manager / saas_admin | Allocate/rotate code |
| `resolve_tenant_join_code(code)` | authenticated | Returns `{ tenant_id, display_name }` only |

Neither RPC creates `tenant_members`, roles, or customers.

## Format

`TJ-` + 6–16 alphanumeric. Company-shaped `EC-…` codes are rejected.

## Security

- No client `tenant_id` input to resolve
- No anon EXECUTE
- No companies SELECT widening
- SECURITY DEFINER + `search_path = public`

## Out of this increment

Membership pending/approved · signup UI · menu/order · ensure_individual_customer · OPPO APK
