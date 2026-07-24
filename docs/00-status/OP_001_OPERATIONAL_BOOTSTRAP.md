# OP-001 · Operational Bootstrap

**Tipo:** fix — estabilización transversal (no feature)  
**Estado:** Active  
**Rama:** `cursor/op-001-operational-bootstrap-f54a`  
**Base:** `main`  
**Por qué no Lovable:** debugging arquitectónico de flujo real, no generación de CRUD.

---

## Declaración

RI-001 implementation is feature-complete, but the product is **not operational**.  
The problem is no longer missing modules — the **operational bootstrap is broken**.

A user cannot start operating the platform from a clean login.

---

## Objective

Restore a complete operational bootstrap:

```text
Login → Landing → Operational Entry
  → Platform Operations (/saas)
  → Tenant Operations (/admin)
  → Operational Setup
  → Weekly Menu → Orders → Kitchen → Delivery → Completed
```

---

## Work packages

| WP | Focus |
|----|--------|
| WP-1 | Audit every operational entry point |
| WP-2 | Fix Operational Entry → `/admin` (no dead buttons) |
| WP-3 | Platform Ops landing (`saas_admin` / hybrid) |
| WP-4 | Tenant Provisioning from `/saas` without SQL |
| WP-5 | Tenant Ops first-run (dishes · menu · staff · kitchen · delivery) |
| WP-6 | Bootstrap validation journey |

---

## Constraints

- ❌ No mocks  
- ❌ No RBAC bypass  
- ❌ No architecture changes / new patterns  
- ❌ No home-path change unless required by OCM-001  
- ✅ Use existing services and routes  

---

## Root cause (summary)

| Layer | Status |
|-------|--------|
| Login → role home | Mostly working |
| BrandLeafMark / auth.admin | Working |
| Landing OAuth return | Incomplete |
| WP-5 tenants / company admin UI | Mostly working (needs existing `saas_admin`) |
| First `saas_admin` | Still SQL/runbook |
| **Dishes UI** | Placeholder — blocks catalog |
| **Menus UI** | Placeholder + no write API — blocks orders |
| **Company Admin invite staff** | Read-only users table |
| ROLE_CATALOG | Missing `delivery` / `operations_manager` |

Primary deadlock: placeholders/read-only on dishes + menus ⇒ no published menu ⇒ no orders ⇒ empty kitchen/delivery.

Detail: [OP_001_ROOT_CAUSE](./OP_001_ROOT_CAUSE.md)

---

## Definition of Done

A brand-new SaaS Admin can, without SQL or source edits:

1. Login → Platform Operations  
2. Create Tenant · Create Company Admin · Assign Roles  
3. Login as Company Admin → Tenant Operations  
4. Configure · upload dishes · weekly menu  
5. Accept orders · kitchen · delivery · complete cycle  

Deliverables: RCA · files modified · navigation/bootstrap fixes · journey PASS/FAIL · evidence notes.

Validation: [OP_001_VALIDATION](./OP_001_VALIDATION.md) — **CODE PASS / LIVE JOURNEY PENDING**

---

## Relation to RI-001

Do **not** close RI-001 until this PR PASSes **live**.  
Then re-run [CHECK-IT 05](./CHECK_IT_05_EVIDENCE_AUDIT.md) — the bootstrap journey generates the missing certification evidence.
