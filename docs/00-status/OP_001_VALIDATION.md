# OP-001 · Validation Report

**Fecha:** 2026-07-24  
**Branch:** `cursor/op-001-operational-bootstrap-f54a`  
**PR title:** `fix(OP-001): restore end-to-end operational bootstrap`

---

## Root cause (executive)

Auth/routing mostly worked. Bootstrap failed because the **first-run content chain** was incomplete:

| Break | Effect |
|-------|--------|
| `admin.dishes` PlaceholderPanel | No catalog → no menu slots |
| `admin.menus` PlaceholderPanel + read-only repo | No publish → no customer orders |
| `admin.users` read-only | No kitchen/delivery staff invite |
| `ROLE_CATALOG` missing `delivery` / `operations_manager` | SaaS role assign incomplete |
| Dishes/menus nav behind FF (default OFF) | Entry points hidden |
| Landing `/` no session redirect | OAuth stall |
| SaaS “Back to /admin” always shown | Dead path for pure saas_admin |

---

## Files modified

### Bootstrap surfaces
- `src/routes/_authenticated/admin.dishes.tsx` — DishService UI (create active)
- `src/routes/_authenticated/admin.menus.tsx` — WeeklyMenuService UI (draft/slots/publish)
- `src/routes/_authenticated/admin.users.tsx` — invite staff form
- `src/lib/tenant-admin.functions.ts` — `inviteTenantStaff` (RBAC + service-role invite)
- `src/modules/weekly-menu/application/weekly-menu-service.ts` — write/publish path
- `src/modules/weekly-menu/infrastructure/weekly-menu-repository.ts` — listAll/find/insert/publish/addSlot
- `src/modules/weekly-menu/index.ts` — export WeeklyMenuService

### Navigation / entry
- `src/components/admin-shell.tsx` — dishes/menus visible without FF
- `src/routes/index.tsx` — authenticated landing → `resolveHomePath`
- `src/routes/_authenticated/saas.tsx` — back-link only with tenant membership
- `src/lib/saas-admin.functions.ts` — ROLE_CATALOG + delivery/operations_manager
- `src/lib/home-path.spec.ts` — saas_admin / hybrid coverage

### Docs
- `docs/00-status/OP_001_OPERATIONAL_BOOTSTRAP.md`
- `docs/00-status/OP_001_ROOT_CAUSE.md`
- `docs/00-status/OP_001_FIRST_SAAS_ADMIN.md`
- `docs/00-status/OP_001_VALIDATION.md` (this file)

---

## Navigation fixes

| Entry | Fix |
|-------|-----|
| Landing session | Redirect to role home |
| Dishes / Menus nav | Ungated for capability holders |
| Pure saas_admin | Still `/saas`; no fake `/admin` back link |
| Hybrid | `/admin` + SaasOpsEntry → `/saas` (unchanged, covered by tests) |
| Centro de Operaciones | Existing BrandLeafMark / decideOperationsCenterEntry |

---

## Bootstrap fixes

1. Dish Library creates **active** dishes via DishService  
2. Weekly menu: ensure draft → add slots → publish (blocks empty publish)  
3. Company Admin invites kitchen/delivery via `inviteTenantStaff`  
4. SaaS ROLE_CATALOG includes delivery + operations_manager  
5. First saas_admin remains one-time SQL (documented Day-0)

---

## Automated checks

```text
vitest home-path + open-operations-center + weekly-menu-mapper → PASS (20)
```

---

## Operational journey (WP-6)

| Step | Status | Notes |
|------|--------|-------|
| Login | PASS (code) | resolveHomePath + landing redirect |
| Platform Ops `/saas` | PASS (code) | home-path pure saas_admin |
| Create Tenant | PASS (existing WP-5 UI) | `/saas/tenants` |
| Invite Company Admin | PASS (existing) | `/saas/company-admin` |
| Assign Roles | PASS (catalog fixed) | `/saas/roles` |
| Company Admin → `/admin` | PASS (code) | home-path |
| Dishes | PASS (code) | real UI |
| Weekly Menu publish | PASS (code) | real UI + service |
| Invite kitchen/delivery | PASS (code) | tenant-admin.functions |
| Customer order → Kitchen → Delivery → Completed | **PENDING live** | Requires deployed env + first saas_admin seed + real Auth invites |

### Verdict

**CODE PASS / LIVE JOURNEY PENDING**

Software blockers for bootstrap content chain are removed.  
Full Definition of Done (delivered order without SQL) requires a live Supabase session with service-role available to the server runtime and **`npm run seed`** for the first `saas_admin` (OP-001.1). Re-run CHECK-IT 05 after live pass.

Follow-up: [OP_001_1_BOOTSTRAP_VALIDATION](./OP_001_1_BOOTSTRAP_VALIDATION.md) — integrity audit, Day-0 checklist, state machine, `bootstrap:verify`.

### Constraints respected

- No mocks  
- No RBAC bypass  
- No architecture / home-path rule changes (only tests + catalog + UI wiring)  
- Existing services and routes reused  
