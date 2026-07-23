# Estado del proyecto

**Última actualización:** 2026-07-23  
**Fase actual:** [CURRENT_PHASE](./CURRENT_PHASE.md) ← abrir primero  
**Última integración:** [IR-001](./IR-001_FIRST_ENGINEERING_INTEGRATION.md) · PR #22  
**Pre-piloto:** [PRE_PILOT_AUDIT](./PRE_PILOT_AUDIT.md)  
**Gobernanza:** [Acta — Fin construcción metodológica](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) **Cerrada**  
**Historia:** [MILESTONES](./MILESTONES.md)  
**Auditoría ingeniería:** [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md)  
**Objetivo:** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Hito operativo:** `HP-001 · Operational · ORR PASSED · Ready for FOV` (en curso)

> Pregunta: **¿Cuál es la siguiente Capability?** — no la siguiente regla.  
> Ahora: **Engineering Fix Sprint** (P1) → luego **ORR** (PASSED \| BLOCKED) — no features.  
> El software es una implementación del conocimiento. Nunca su origen.  
> [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)  
> No abrir documentos metodológicos nuevos hasta la primera FOV.

---

## Carril B — HP-001

| CAP | Estado | Happy Path |
|-----|--------|------------|
| CAP-001…005 | Connected | Parcial → ✔ |
| CAP-006 Confirm | Operational | ✔ cierra HP-001 |
| CAP-007 History | Scaffold | — |

**Siguiente:** [CURRENT_PHASE](./CURRENT_PHASE.md) · Engineering Fix (P1) → [ORR](../22-implementation/ORR.md) → Phase 3 FOV.

### Etapa 2 Levels

| Level | Nombre | Estado |
|-------|--------|--------|
| L1 | Infrastructure Connection | ✅ CAP-001 Connected |
| L2 | Capability Connection | ✅ CAP-002…005 Connected |
| L3 | Operational Workflow | ✅ CAP-006 Operational |
| L4 | Operational Verification | ⏳ |

Detalle: [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md) · [KNOWLEDGE_COVERAGE](../22-implementation/KNOWLEDGE_COVERAGE.md)

---

## Carril A

FOV ⏳ tras ORR **PASSED**.

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

[CURRENT_PHASE](./CURRENT_PHASE.md) · [SMOKE_HP-001](./SMOKE_HP-001.md) · [IR-001](./IR-001_FIRST_ENGINEERING_INTEGRATION.md) · [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md) · [PRE_PILOT_AUDIT](./PRE_PILOT_AUDIT.md) · [Acta](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) · [MILESTONES](./MILESTONES.md) · [Etapa 2 Levels](../22-implementation/ETAPA_2_LEVELS.md) · [Freeze](./04-methodology-frozen.md) · [22 Implementation](../22-implementation/README.md) · [FOV Brief](./FOV_MISSION_BRIEF.md) · [Philosophy](../23-engineering/IMPLEMENTATION_PHILOSOPHY.md)

