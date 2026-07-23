# Estado del proyecto

**Última actualización:** 2026-07-23  
**Objetivo (desde CAP-002):** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Cadena:** Observation → Discovery → Model → Validation → IOV → Product Skeleton → **Connected Capabilities (L1→L2)** → Workflow (L3) → FOV (L4) → KU → G-01

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

### Carril B — Etapa 2 Levels

| Level | Nombre | Estado |
|-------|--------|--------|
| L1 | Infrastructure Connection | ✅ CAP-001 Connected |
| L2 | Capability Connection | ▶️ CAP-002 lectura siguiente |
| L3 | Operational Workflow | ⏳ |
| L4 | Operational Verification | ⏳ |

| Área | Estado |
|------|--------|
| IA · Product Skeleton · Apps · DS | ✅ |
| Cursor Rules · Backlog · CAP Framework · ADR 0013 | ✅ |
| **Hito:** Happy Path sin mocks | ⏳ |

Detalle: [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md) · [KNOWLEDGE_COVERAGE](../22-implementation/KNOWLEDGE_COVERAGE.md)

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
2. **[CAP-002 — solo lectura](../22-implementation/caps/CAP-002-dish-catalog.md)** — Level 2 · un PR Capability  
3. Rumbo al **[Happy Path sin mocks](../22-implementation/HAPPY_PATH_E2E.md)**  

---

## Índices

[22 Implementation](../22-implementation/README.md) · [Etapa 2 Levels](../22-implementation/ETAPA_2_LEVELS.md) · [PR Change Levels](../22-implementation/PR_CHANGE_LEVELS.md) · [Philosophy](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md) · [FOV Brief](./FOV_MISSION_BRIEF.md)
