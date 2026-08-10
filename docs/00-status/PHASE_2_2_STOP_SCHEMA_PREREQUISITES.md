# PHASE 2.2 STOP — Schema prerequisites missing on remote

**Date:** 2026-08-10  
**Project:** `djangucecsphnejplvic`  
**Verdict:** **BLOCKED — SCHEMA PREREQUISITES NOT APPLIED**

## Why we STOP

Phase 2.2 source is implemented against the **intended** identity model
(ADR 0018 · P2-DEC-002 · `membership_status=pending`).

Applying `request_tenant_association_by_join_code` alone **fails** on remote:

```text
ERROR: type "public.membership_status" does not exist
```

## Remote facts (verified)

| Fact | Remote reality |
|------|----------------|
| `tenant_members` columns | `tenant_id`, `user_id`, `joined_at` only |
| `membership_status` enum | **missing** |
| `tenants.join_code` | **missing** |
| `resolve_tenant_join_code` / `generate_tenant_join_code` | **missing** |
| Last applied migration | `20260809163438_drop_recursive_company_employees_rls` |
| `is_tenant_member` | membership row exists ⇒ access (**no status filter**) |
| `ensure_individual_customer` | `INSERT tenant_members (tenant_id, user_id)` only |

## Migration gap (repo → remote)

Repo contains (among others) **not applied** on remote:

- `20260729100000_identity_membership_lifecycle.sql` (enums + status columns + approved-gated `is_tenant_member`)
- `20260729120000_identity_hardening_v1.sql` (+ related Jul 28–29 chain)
- `20260809181400_tenant_join_code.sql` (Phase 2.1)
- `20260810143000_request_tenant_association.sql` (Phase 2.2)

Remote jumped from `20260725123000` → `20260809163438`, skipping the identity/join-code chain.

## Policy (no invention)

| Lock | Decision |
|------|----------|
| P2-DEC-002 / ADR 0018 | Cold association → **pending**; Create ≠ access |
| P2-DEC-003 | Do **not** redesign `ensure_individual_customer` for cold membership |
| Absolute rules | Do **not** create Tenants; do **not** client-spoof `tenant_id` |

We will **not** invent a Phase 2.2 that inserts bare `tenant_members` without status
(that would auto-unlock access via the **current** remote `is_tenant_member`).

## Required next step (human authorization)

1. Apply the **missing migration backlog** in order (identity lifecycle → join code → Phase 2.2), **or**
2. Explicitly authorize a controlled schema cutover plan for `djangucecsphnejplvic`.

Until then: device E2E for Phase 2.2 remains **BLOCKED**. Source PR may still land as contract materialization.

## Isolated (unchanged)

- Menu `week_start` vs `day_date` integrity bug — **not** touched.
- Customer Bulk / Google-Apple / Tenant creation — out of scope.
