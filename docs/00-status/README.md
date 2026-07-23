# Estado del proyecto

**Última actualización:** 2026-07-23  
**Fase metodológica:** [cerrada](./05-methodology-construction-closed.md)  
**Objetivo:** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Hito operativo:** `HP-001 · Operational · ORR Passed · Ready for FOV` (en curso)

> Pregunta: **¿Cuál es la siguiente Capability?** — no la siguiente regla.  
> El software es una implementación del conocimiento. Nunca su origen.  
> [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)

---

## Carril B — HP-001

| CAP | Mock | Real | Estado | Happy Path |
|-----|------|------|--------|------------|
| CAP-001 Auth | — | ✅ | Connected | ✔ |
| CAP-002 Dish | ❌ | ✅ | Connected | Parcial |
| CAP-003 Menu | ❌ | ✅ | Connected | Parcial |
| CAP-004 Program | ❌ | ✅ | Connected | Parcial |
| CAP-005 Summary | ❌ | ✅ | Connected | Parcial |
| CAP-006 Confirm | ⏳ | ⏳ | Scaffold | ✖ |
| CAP-007 History | ⏳ | ⏳ | Scaffold | ✖ |

**Siguiente:** [CAP-006](../22-implementation/caps/CAP-006-order-confirmation.md) → [ORR](../22-implementation/ORR.md) (sin features).

### Etapa 2 Levels

| Level | Nombre | Estado |
|-------|--------|--------|
| L1 | Infrastructure Connection | ✅ CAP-001 Connected |
| L2 | Capability Connection | ✅ CAP-002…005 Connected |
| L3 | Operational Workflow | ▶️ CAP-006 siguiente |
| L4 | Operational Verification | ⏳ |

Detalle: [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md) · [KNOWLEDGE_COVERAGE](../22-implementation/KNOWLEDGE_COVERAGE.md)

---

## Carril A

| Fase | Estado |
|------|--------|
| Foundation · Blueprint · Discovery · Checks | ✅ |
| Operational Model | ✅ Table-Validated |
| Operational Validation · IOV | ✅ |
| FOV · KU · EC · G-01 | ⏳ — tras ORR Passed |

## Roles

| Herramienta | Rol |
|-------------|-----|
| FOPEBA | Qué sabe el sistema |
| Lovable | Cómo se ve (skeleton; sin más infra) |
| Cursor | Cómo funciona técnicamente |
| GitHub | Historia y evidencia ([PR levels](../22-implementation/PR_CHANGE_LEVELS.md)) |

## Índices

[22 Implementation](../22-implementation/README.md) · [Etapa 2 Levels](../22-implementation/ETAPA_2_LEVELS.md) · [Freeze](./04-methodology-frozen.md) · [FOV Brief](./FOV_MISSION_BRIEF.md) · [Philosophy](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md)
