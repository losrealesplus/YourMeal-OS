# Foundation Lock

**Estado:** ✅ **CERRADO** — 2026-07-20  
**Tag:** `v0.1.0` — `FOUNDATION LOCKED`  
**Regla:** *Ningún cambio arquitectónico sin ADR.*

La plataforma queda cerrada. La infraestructura y la arquitectura base se consideran estables. El foco pasa al dominio de negocio (Module 01).

Ver [CHANGELOG](../../CHANGELOG.md) y [estado del proyecto](../00-status/README.md).

---

## Por qué existió

> Foundation is real. The risk is false readiness.

Foundation Lock eliminó la falsa madurez: RBAC en runtime, soft delete, ServiceContext, repositorios y errores de dominio.

## Checklist (completado)

### Lock 1 — Runtime RBAC ✅

```text
Route → Permission Guard → Service → Repository → Database (RLS)
```

### Lock 2 — Soft delete ✅

`archive` / `restore` / `purge` — nunca `delete()` en Services de negocio.

### Lock 3 — ServiceContext ✅

Contexto único: tenant, user, capabilities, localization, audit, flags, cliente Supabase, IP.

### Lock 4 — Repository layer ✅

```text
UI → Service → Repository → Supabase
```

### Lock 5 — Domain errors ✅

Errores tipados (`PermissionDenied`, `DishNotFound`, …).

## Pulido pendiente (no bloquea Module 01)

- Filtrado de navegación admin por capabilities
- ADR de tablas junction (cascade vs soft-delete)

## Después del lock

1. Tag `v0.1.0` aplicado / documentado.
2. Module 01: **entidades de dominio primero**; UI al final.
3. Orden congelado: Dish → Ingredient → Recipe → … → UI → CRUD.
