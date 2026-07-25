# Bootstrap State Machine

**OP-001.1 · WP-10**  
**Module:** `src/modules/bootstrap-integrity`  
**Related:** [OP001_DAY0_CHECKLIST](../10-validation/OP001_DAY0_CHECKLIST.md) · [TENANT_OPERATIONAL_AUTONOMY](./TENANT_OPERATIONAL_AUTONOMY.md)

---

## Purpose

YourMeal OS must not only *allow* forward motion. It must **refuse impossible states** for a new tenant.

This document is the FOPEBA-facing model of operational bootstrap.

---

## Ladder

```text
No Tenant
    ↓
Tenant
    ↓
Company Admin
    ↓
Staff
    ↓
Dish Library
    ↓
Weekly Menu (published)
    ↓
Customer
    ↓
Orders (confirmed)
    ↓
Kitchen / Production
    ↓
Delivery
    ↓
Operational
```

`resolveBootstrapStage()` derives the furthest completed stage from counts.

---

## Transitions

| From → To | Actor | Service / surface | Preconditions | Evidence | Error if violated |
|-----------|-------|-------------------|---------------|----------|-------------------|
| ∅ → Tenant | `saas_admin` | `createTenant` · `/saas/tenants` | Actor is platform admin | Tenant row `active` | Forbidden / validation |
| Tenant → Company Admin | `saas_admin` | `createCompanyAdmin` | Tenant exists + **active** | `user_roles.company_admin` | `Tenant not found` / not active |
| Company Admin → Staff | `company_admin` / `operations_manager` | `inviteTenantStaff` · `/admin/users` | ≥1 Company Admin on tenant | Membership + role | `BOOTSTRAP_NO_COMPANY_ADMIN` |
| → Dish Library | Company Admin | `DishService.create` · `/admin/dishes` | Tenant membership + `dishes.create` | Active dish | Capability / validation |
| Dish → Weekly Menu draft | Company Admin | `WeeklyMenuService.ensureDraft` | **≥1 active dish** | Draft `weekly_menus` | `BOOTSTRAP_NO_DISHES` |
| Draft → Published | Company Admin | `WeeklyMenuService.publish` | ≥1 slot + dishes | `status=published` | `BOOTSTRAP_EMPTY_MENU` |
| Menu → Customer order | Customer | `OrderService.programDraft*` | Published menu for week | Draft order | `MENU_LOCKED` / `BOOTSTRAP_NO_PUBLISHED_MENU` |
| Order → Kitchen | Kitchen | `OperationsService.transitionKitchen` | Order in kitchen queue + **tenant kitchen demand > 0** | Status advance | `BOOTSTRAP_NO_KITCHEN_DEMAND` / `INVALID_STATE` |
| Kitchen → Delivery | Delivery | `OperationsService.transitionDelivery` | Delivery queue non-empty | Status advance | `BOOTSTRAP_NO_DELIVERY_DEMAND` |
| Delivery → Operational | Delivery | `delivered` | Out for delivery | Delivered count ≥1 | Transition refused |

**Event table (certification form):** [BOOTSTRAP_STATE_MACHINE_TRANSITIONS.md](./BOOTSTRAP_STATE_MACHINE_TRANSITIONS.md)

---

## Impossible-state matrix (WP-7)

| Case | Forbidden | Guard |
|------|-----------|-------|
| 1 | Orders without published menu | `canAcceptOrders` · **OrderService** |
| 2 | Production/kitchen without orders | `canOperateKitchen` · **OperationsService.transition** |
| 3 | Delivery without production output | `canOperateDelivery` · **OperationsService.transition** |
| 4 | Staff without Company Admin | `canInviteOperationalStaff` · **inviteTenantStaff** |
| 5 | Menu without dishes | `canComposeWeeklyMenu` / `canPublishWeeklyMenu` · **WeeklyMenuService** |

UI banners are advisory only — enforcement is in services / server functions.


---

## Platform Day-0 (exception)

First `saas_admin` is **not** a tenant transition. It is platform install:

```text
npm run seed
```

No SQL editor. Idempotent. See [OP_001_FIRST_SAAS_ADMIN](../00-status/OP_001_FIRST_SAAS_ADMIN.md).

---

## Verify

```bash
npm run bootstrap:verify
npm run bootstrap:verify:ci
npm run bootstrap:verify -- --live --tenant=<slug|uuid> --json=docs/10-validation/evidence/op001/bootstrap-report.json
```

Pure / CI mode asserts the negative rule matrix (exit 0/1/2/3).  
Live mode prints snapshot + **relationship chain** + OPEN/BLOCK per gate.
