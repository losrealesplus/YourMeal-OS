# Capability Matrix

**Single reference for authorization.** Code in `src/permissions` must stay aligned with this file. UI uses `useCan()` / `can()`; Services re-check capabilities; RLS remains the last line of defense.

```text
Route → Permission Guard → Service → Repository → Database (RLS)
```

Hiding a nav item is **not** security. Guards must prevent render and Service entry.

---

## Roles (columns)

| Code | Label |
|------|-------|
| `customer` | Customer |
| `employee` | Employee |
| `driver` | Driver |
| `kitchen` | Kitchen |
| `production` | Production |
| `purchasing` | Purchasing |
| `inventory` | Inventory |
| `support` | Customer Support |
| `accounting` | Accounting |
| `logistics` | Logistics |
| `company_admin` | Company Admin |
| `saas_admin` | SaaS Admin |

Legend: ✅ granted · ❌ denied

---

## Catalog — Dish Library

| Capability | customer | employee | driver | kitchen | production | purchasing | inventory | support | accounting | logistics | company_admin | saas_admin |
|------------|----------|----------|--------|---------|------------|------------|-----------|---------|------------|-----------|---------------|------------|
| dishes.read | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| dishes.create | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| dishes.update | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| dishes.archive | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| dishes.restore | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| dishes.purge | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> `dishes.write` in code is a **composite** meaning create+update (not archive/purge). Prefer granular checks in new code.

---

## Catalog — Ingredients & Recipes

| Capability | customer | employee | kitchen | production | purchasing | inventory | company_admin | saas_admin |
|------------|----------|----------|---------|------------|------------|-----------|---------------|------------|
| ingredients.read | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ingredients.create | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| ingredients.update | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| ingredients.archive | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| recipes.read | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| recipes.write | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |

*(Roles omitted in narrow tables inherit ❌ unless listed; full parity maintained in `src/permissions`.)*

---

## Menus

| Capability | customer | employee | kitchen | production | company_admin | saas_admin |
|------------|----------|----------|---------|------------|---------------|------------|
| menus.read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| menus.write | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## Orders

| Capability | customer | employee | driver | kitchen | production | support | accounting | logistics | company_admin | saas_admin |
|------------|----------|----------|--------|---------|------------|---------|------------|-----------|---------------|------------|
| orders.read | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.write | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| orders.manage | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## Customers & Support

| Capability | customer | support | company_admin | saas_admin |
|------------|----------|---------|---------------|------------|
| customers.read | ❌* | ✅ | ✅ | ✅ |
| customers.write | ❌* | ✅ | ✅ | ✅ |
| support.read | ❌ | ✅ | ✅ | ✅ |
| support.write | ❌ | ✅ | ✅ | ✅ |

\*Customers may read/update **self** via dedicated self-service capabilities later (`customers.self`); not shown as staff `customers.*`.

---

## Operations

| Capability | kitchen | production | purchasing | inventory | logistics | driver | company_admin | saas_admin |
|------------|---------|------------|------------|-----------|-----------|--------|---------------|------------|
| kitchen.operate | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| production.operate | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| purchasing.operate | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| inventory.operate | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| logistics.operate | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Accounting, admin & brand

| Capability | accounting | company_admin | saas_admin |
|------------|------------|---------------|------------|
| accounting.operate | ✅ | ✅ | ✅ |
| admin.settings | ❌ | ✅ | ✅ |
| brand.manage | ❌ | ✅ | ✅ |
| company.manage | ❌ | ✅ | ✅ |
| site.manage | ❌ | ✅ | ✅ |
| organization.manage | ❌ | ✅ | ✅ |
| employee.manage | ❌ | ✅ | ✅ |
| saas.manage | ❌ | ❌ | ✅ |
| records.purge | ❌ | ❌ | ✅ |

> **ADR 0015:** B2B Company Account portal admins are scoped by `company_employees.is_admin` (not the Tenant role `company_admin`). Tenant `company_admin` / `saas_admin` oversee any company in the tenant. Services enforce both paths.

### `brand.manage`

| | |
|--|--|
| **Qué** | Leer/actualizar Tenant Brand (logo · colores) vía BrandingService |
| **Quién** | `company_admin` · `saas_admin` |
| **Superficie** | `/admin/branding` |
| **Límites** | [BRAND_CONTRACT](../05-architecture/BRAND_CONTRACT.md) |
| **Objeto** | [Tenant Brand](../17-operational-model/02-core-objects/tenant-brand.md) |

La UI puede ocultar el acceso; la **seguridad** es Service + roles/capabilities + RLS/Storage policies.


---

## Surface access (route guards)

| Surface | Required |
|---------|----------|
| `/app/*` | Authenticated (customer or any member) |
| `/admin/*` | Any staff capability **or** `company_admin` / staff role |
| `/saas/*` | `saas.manage` |
| `/driver` | `logistics.operate` + driver context (or `driver` role) |

---

## Maintenance rule

1. Change this matrix first.
2. Update `src/permissions/index.ts` to match.
3. Add/adjust route guards and Service checks.
4. Never grant in UI only.
