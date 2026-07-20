# Foundation Lock

**Status:** In progress → must complete before Module 01 (Dish Library)  
**Target tag:** `v0.1.0` — `FOUNDATION LOCKED`  
**Rule after lock:** *No architectural changes without ADR.*

This is not feature work. It **closes the platform** so documented rules cannot be bypassed by accident.

---

## Why

> Foundation is real. The risk is false readiness.

Foundation Lock removes false readiness: runtime RBAC, soft-delete enforcement, unified ServiceContext, Repository layer, and domain errors.

---

## Checklist

### Lock 1 — Runtime RBAC

```text
Route → Permission Guard → Service → Repository → Database (RLS)
```

- [x] Capability matrix documented (`docs/09-security/CAPABILITY_MATRIX.md`)
- [x] `src/permissions` aligned to granular capabilities
- [x] `/admin` requires staff
- [x] `/saas` requires `saas.manage`
- [x] `/driver` requires logistics/driver
- [x] `/admin/dishes` requires `dishes.read`
- [ ] Permission-filtered admin nav (polish — ok after tag)
- [x] DishService methods re-check capabilities

### Lock 2 — Soft delete enforcement

- [x] Services expose `archive` / `restore` / `purge` — **no `delete()`**
- [x] Migration: staff DELETE policies removed; saas_admin purge only (catalog + companies + weekly_menus)
- [x] `deleted_by` on dishes / ingredients / suppliers
- [ ] Junction-table strategy ADR (cascade vs soft-delete)

### Lock 3 — ServiceContext

- [x] Expanded `ServiceContext` + `createServiceContext()`

### Lock 4 — Repository layer

- [x] `DishRepository` + DishService uses it
- [x] Module folder `src/modules/dish-library/...`

### Lock 5 — Domain errors

- [x] Typed errors in `src/domain/errors.ts`
- [x] DishService / AuditService / stubs use domain errors

---

## After lock

1. Git tag `v0.1.0` with message `FOUNDATION LOCKED` (human/CI when merged to main).
2. Any structural change requires a new ADR.
3. Start Module 01: **domain entities first**, then Services/Repos, then CRUD, then UI.

```text
Dish Entity → Ingredient Entity → Recipe Entity
  → DishService / Repositories → CRUD → UI
```

## Roadmap adjustment

```text
Dish Library → Ingredient Library → Recipe Builder → …
```

See [roadmap](../roadmap/README.md).
