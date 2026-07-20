# CHANGELOG

## [v0.1.0] — FOUNDATION LOCKED — 2026-07-20

```text
YourMeal OS v0.1.0

Foundation Locked

The project architecture is now considered stable.

Future development focuses on business capabilities instead of infrastructure.

Any architectural change requires an ADR approval.
```

### Español (resumen del hito)

La arquitectura de YourMeal OS se considera **estable**.

- Foundation y Foundation Lock cerrados.
- El desarrollo futuro se centra en capacidades de negocio, no en reinventar infraestructura.
- Cualquier cambio arquitectónico requiere un ADR aprobado.
- Idioma oficial del desarrollo: **español** (código y BD en inglés). Ver ADR 0010.

### Incluye

- Multi-tenant + RLS
- RBAC en runtime (guards de ruta)
- Soft delete (`archive` / `restore` / `purge`)
- Service → Repository → Supabase
- ServiceContext unificado
- Domain errors tipados
- Feature flags + localización + auditoría preparados
- Constitución (`docs/`), ADRs, matriz de capabilities, lenguaje ubicuo
- Scaffold de eventos (`packages/events`)
- Convención de módulos `src/modules/...`

### Siguiente fase

**Module 01 — Dish Library** (dominio primero; UI al final).

---

## [Unreleased] — 2026-07-20

### Gobierno

- ADR 0011: Diario de Desarrollo + Principio de Intencionalidad
- Diario en `docs/99-internal/development-journal/`
- Docs de dominio Module 01: Dish / Ingredient / Recipe
- Definition of Done ampliada (Diario + intencionalidad)
- Cierre de jornada: paso de actualización del Diario
