# PHASE 2.2 — Cold Customer Tenant Association Contract

**Status:** Source implemented · **remote BLOCKED** (see `PHASE_2_2_STOP_SCHEMA_PREREQUISITES.md`)  
**Baseline:** `origin/main` @ `248037d`  
**Locks:** P2-DEC-001 / 002 / 003 · ADR 0018 · YOURMEAL_OS_TENANT_MODEL_001

## Flow

```text
/auth signup (name, email, password, TJ- join code)
  → Auth user + profiles (existing trigger)
  → request_tenant_association_by_join_code(code)
  → tenant_members(status=pending, type=customer, channel=self_registration)
  → SessionBootstrap: ActiveTenant = null while pending
  → staff approve (existing /admin/users lifecycle)
  → ActiveTenant unlocks → ensure_individual_customer (existing) → menu/orders
```

## Explicit non-goals

- Does **not** create Tenants
- Does **not** auto-approve on valid join code
- Does **not** redesign `ensure_individual_customer`
- Does **not** fix weekly_menu_slot day_date integrity (separate bug)

## Security

- No client `tenant_id` authority
- SECURITY DEFINER RPC · authenticated only
- Rejects `EC-` company codes
- Idempotent membership insert
