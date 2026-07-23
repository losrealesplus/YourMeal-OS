# Estado del proyecto

**Última actualización:** 2026-07-23  
**Cadena:** Observation → Discovery → Model → Validation → IOV → **Product Skeleton** → **Connected Capabilities** → FOV → KU → G-01

> El software es una implementación del conocimiento. Nunca su origen.  
> [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)

---

## Auditoría

### Carril A

| Fase | Estado |
|------|--------|
| Foundation · Blueprint · Discovery · Checks | ✅ |
| Operational Model | ✅ Table-Validated |
| Operational Validation · IOV | ✅ |
| FOV · KU · EC · G-01 | ⏳ |

### Carril B

| Área | Estado |
|------|--------|
| IA · Product Skeleton · Apps · DS | ✅ |
| Cursor Rules · Backlog · CAP Framework | ✅ |
| CAP-001 Auth | ✅ Connected |
| **CAP-002 Dish Catalog (solo lectura)** | ▶️ Siguiente |

---

## Roles

| Herramienta | Rol |
|-------------|-----|
| FOPEBA | Qué sabe el sistema |
| Lovable | Cómo se ve (skeleton; sin más infra) |
| Cursor | Cómo funciona técnicamente |
| GitHub | Historia y evidencia ([PR levels](../22-implementation/PR_CHANGE_LEVELS.md)) |

---

## Siguiente

1. [CURSOR_MASTER_PROMPT](../22-implementation/CURSOR_MASTER_PROMPT.md)  
2. **[CAP-002 — solo lectura](../22-implementation/caps/CAP-002-dish-catalog.md)** — un PR, un nivel Capability  
3. Sin mezclar UX / refactors / animaciones  

---

## Índices

[22 Implementation](../22-implementation/README.md) · [PR Change Levels](../22-implementation/PR_CHANGE_LEVELS.md) · [Philosophy](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md) · [FOV Brief](./FOV_MISSION_BRIEF.md)
