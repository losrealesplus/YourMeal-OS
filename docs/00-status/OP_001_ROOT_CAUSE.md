# OP-001 · Root Cause Analysis

**Fecha:** 2026-07-24  
**Branch:** `cursor/op-001-operational-bootstrap-f54a`  
**Spec:** [OP_001_OPERATIONAL_BOOTSTRAP](./OP_001_OPERATIONAL_BOOTSTRAP.md)

---

## Verdict

Auth/routing for known roles largely works. Bootstrap fails because the **first-run content chain is incomplete**: dishes UI placeholder, weekly menus without write path, tenant staff invite read-only, and first `saas_admin` still requires SQL/runbook.

---

## Failure map

```text
Landing (/) ──CTA──► /auth ──resolveHomePath──► /saas | /admin | /app
                                              │
                         /saas WP-5 ──────────┤ mostly OK (needs saas_admin)
                         /admin dishes ───────┤ PLACEHOLDER (+ was FF-gated)
                         /admin menus ────────┤ PLACEHOLDER · no write API
                         /admin users ────────┤ READ-ONLY
                         orders/kitchen/delivery┤ work IF data exists
```

---

## Findings by WP

### WP-1 / WP-2 · Entry

- `BrandLeafMark` + `decideOperationsCenterEntry` work.
- Landing does not redirect authenticated sessions (OAuth return sits on `/`).
- `PoweredByLine` is non-interactive (by design for customer brand).

### WP-3 · Platform Ops

- Pure `saas_admin` → `/saas` (fixed).
- Hybrid → `/admin` + `SaasOpsEntry`.
- SaaS shell “Back to tenant Ops Center” always links `/admin` even without membership.

### WP-4 · Provisioning

- Tenants / company admin / roles / membership / audit implemented in `saas-admin.functions.ts`.
- `ROLE_CATALOG` omitted `delivery` and `operations_manager`.
- First platform admin: no UI — runbook required.

### WP-5 · Tenant Ops

- `DishService` exists; `admin.dishes.tsx` was PlaceholderPanel.
- Weekly menu repo is published-read only; `admin.menus.tsx` was PlaceholderPanel.
- `admin.users.tsx` lists members; cannot invite kitchen/delivery.

### WP-6 · Journey

Cannot complete without fixing WP-5 surfaces.

---

## Fix ranking (this PR)

1. Dishes admin UI → DishService  
2. Weekly menu write + admin UI  
3. Company Admin invite staff (tenant-scoped server fn)  
4. ROLE_CATALOG + SaaS back-link + landing session redirect  
5. Remove FF gate for dishes/menus (modules become real)  
6. home-path specs · bootstrap runbook  
