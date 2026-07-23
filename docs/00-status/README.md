# Estado del proyecto

**Última actualización:** 2026-07-23  
**Gobernanza:** [Acta — Fin construcción metodológica](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) **Cerrada**  
**Historia:** [MILESTONES](./MILESTONES.md)  
**Objetivo:** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Hito operativo:** `HP-001 · Operational · ORR PASSED · Ready for FOV` (en curso)

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

**Siguiente:** [CAP-006](../22-implementation/caps/CAP-006-order-confirmation.md) — solo `Draft→Confirm→Persist→Audit→Invalidate`.  
Luego: [ORR](../22-implementation/ORR.md) → **PASSED \| BLOCKED** → Phase 3 FOV.

### Etapa 2 Levels

| Level | Nombre | Estado |
|-------|--------|--------|
| L1 | Infrastructure Connection | ✅ CAP-001 Connected |
| L2 | Capability Connection | ✅ CAP-002…005 Connected |
| L3 | Operational Workflow | ▶️ CAP-006 siguiente |
| L4 | Operational Verification | ⏳ |

Detalle: [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md) · [KNOWLEDGE_COVERAGE](../22-implementation/KNOWLEDGE_COVERAGE.md)

---

## Carril A / Phase 3

Tras ORR **PASSED**: Field Operational Validation (FOV).  
No abrir FOV con ORR **BLOCKED**.

| Fase | Estado |
|------|--------|
| Foundation · Blueprint · Discovery · Checks | ✅ |
| Operational Model | ✅ Table-Validated |
| Operational Validation · IOV | ✅ |
| FOV · KU · EC · G-01 | ⏳ — tras ORR PASSED |

## Roles

| Herramienta | Rol |
|-------------|-----|
| FOPEBA | Qué sabe el sistema |
| Lovable | Cómo se ve (skeleton; sin más infra) |
| Cursor | Cómo funciona técnicamente |
| GitHub | Historia y evidencia ([PR levels](../22-implementation/PR_CHANGE_LEVELS.md)) |

## Índices

[Acta](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) · [MILESTONES](./MILESTONES.md) · [Etapa 2 Levels](../22-implementation/ETAPA_2_LEVELS.md) · [Freeze](./04-methodology-frozen.md) · [22 Implementation](../22-implementation/README.md) · [FOV Brief](./FOV_MISSION_BRIEF.md) · [Philosophy](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md)

