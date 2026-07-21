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

## [Unreleased] — 2026-07-21

### Gobierno

- ADR 0011: Diario de Desarrollo + Principio de Intencionalidad
- ADR 0012: Cursor = CTO · Lovable = UI · Docs = fuente de verdad
- Diario en `docs/99-internal/development-journal/`
- Contexto estratégico: `docs/05-architecture/CONTEXTO_ESTRATEGICO_PERMANENTE.md`
- Contexto permanente: `docs/05-architecture/CONTEXTO_CTO.md`
- Docs de dominio Module 01: Dish / Ingredient / Recipe
- Definition of Done ampliada (Diario + intencionalidad)
- Cierre de jornada: paso de actualización del Diario
- `FOUNDATION.md` en la raíz como constitución global reusable
- Pirámide de decisión + principio de valor (Module 01+) en `AGENTS.md`
- Cierre de etapa constitucional → inicio de construcción de producto
- Roadmap Maestro v0.1 alineado con EatClean, Core y aprendizaje
- Dominio `Dish` cerrado en documentación
- Lenguaje del dominio `Dish` en código (VOs, errors, state machine)
- Principio Entity Simplicity en `FOUNDATION.md`
- Filosofía de Producto (`FILOSOFIA_DE_PRODUCTO.md`) — impacto operativo como criterio de éxito
- Actores oficiales del dominio (`docs/12-domain-model/ACTORS.md`) — fin de «Cliente» ambiguo
- Entity Guidelines (`docs/12-domain-model/ENTITY_GUIDELINES.md`) — estándar de modelado de entidades
- Fundación del dominio cerrada — el código es consecuencia del diseño
