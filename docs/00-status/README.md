# Estado del proyecto

**Última actualización:** 2026-07-24  
**Fase actual:** [CURRENT_PHASE](./CURRENT_PHASE.md) ← abrir primero  
**Dominios:** [PROJECT_DOMAINS](./PROJECT_DOMAINS.md) — Knowledge · Engineering · Experience · Operations  
**Engineering Phase:** [ENGINEERING_PHASE](./ENGINEERING_PHASE.md) — Complete (pending operational authorization)  
**Última integración:** [IR-001](./IR-001_FIRST_ENGINEERING_INTEGRATION.md) · PR #22  
**Pre-piloto:** [PRE_PILOT_AUDIT](./PRE_PILOT_AUDIT.md) · [ORR Party/B2B/B2C](./ORR_B2B_B2C_PARTY.md) · [**PILOT_ACCEPTANCE_CHECKLIST**](./PILOT_ACCEPTANCE_CHECKLIST.md) (G-02) · [Functional Completeness Review](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md) · [**EP-001**](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md) · [EP-002A](./EP002A_CUSTOMER_EXPERIENCE_COMPLETION.md) · [EP-002B](./EP002B_OPERATIONAL_EXECUTION.md) · [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) · [Pilot Security](../09-security/PILOT_SECURITY_CHECKLIST.md)  
**Gobernanza:** [Acta — Fin construcción metodológica](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) **Cerrada** · [ACT-001 Experience Baseline Frozen](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅ · [ACT-002 Materialization Frozen](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) ✅  
**Historia:** [MILESTONES](./MILESTONES.md)  
**Auditoría ingeniería:** [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md)  
**Objetivo:** demostrar que un negocio real puede operar una semana con YourMeal OS y que FOPEBA genera evidencia usable.  
**Hito operativo:** `HP-001 · Operational · ORR PASSED · Ready for FOV` (en curso)  
**Hito experiencia:** CJ-001 usable sin explicación ([CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md))  
**Hito piloto:** [EatClean Pilot Ready](./MILESTONE_EATCLEAN_PILOT_READY.md) 🟡 · [PILOT_EXECUTION_GUIDE](../18-operational-validation/PILOT_EXECUTION_GUIDE.md) · EP-001…EP-005  
**Hito experiencia base:** ✅ [ACT-001 Frozen](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) (#24→#30)  
**Hito materialization:** ✅ [ACT-002 Frozen v1](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) (#24→#31) · [FOUR_LAYERS](../05-architecture/FOUR_LAYERS.md)  
**Party / B2B:** [ADR 0015](../adr/0015-b2b-b2c-customer-model.md) · [ADR 0016](../adr/0016-party-model-demand-actors.md) · [Traceability](../17-operational-model/CORE_OBJECT_TRACEABILITY.md)  
**Documentación:** [Knowledge Lifetime](../18-operational-validation/knowledge-lifetime.md) — Contract · Implementation · Iteration

> Ops: **¿ORR Party PASSED?** · Experience: **¿Mi madre podría pedir sin ayuda?** · Piloto: **¿Cliente pide, equipo entrega, FOPEBA observa?**  
> Empresas = alta EatClean · Empleados = vínculo (código/invite) · Particular = CJ-001.  
> ❌ No diseñar materialization / no polish estético (ACT-001 · ACT-002).  
> [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)

---

## Carril B — HP-001

| CAP | Estado | Happy Path |
|-----|--------|------------|
| CAP-001…005 | Connected | Parcial → ✔ |
| CAP-006 Confirm | Operational | ✔ cierra HP-001 |
| CAP-007 History | Scaffold | — |

**Siguiente:** [CURRENT_PHASE](./CURRENT_PHASE.md) · migración → [SMOKE_HP-001](./SMOKE_HP-001.md) → [ORR](../22-implementation/ORR.md) · Experience: [CJ-001](../07-experience/CUSTOMER_JOURNEYS.md)

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

[CURRENT_PHASE](./CURRENT_PHASE.md) · [PROJECT_DOMAINS](./PROJECT_DOMAINS.md) · [PROJECT_DICTIONARY](../99-reference/PROJECT_DICTIONARY.md) · [CUSTOMER_JOURNEYS](../07-experience/CUSTOMER_JOURNEYS.md) · [SMOKE_HP-001](./SMOKE_HP-001.md) · [ORR_HP-001](./ORR_HP-001.md) · [IR-001](./IR-001_FIRST_ENGINEERING_INTEGRATION.md) · [ENGINEERING_PHASE](./ENGINEERING_PHASE.md) · [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md) · [PRE_PILOT_AUDIT](./PRE_PILOT_AUDIT.md) · [Acta](./ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md) · [MILESTONES](./MILESTONES.md) · [FOV-001](../30-field-validation/FOV-001_HP-001.md) · [22 Implementation](../22-implementation/README.md) · [FOV Brief](./FOV_MISSION_BRIEF.md)

