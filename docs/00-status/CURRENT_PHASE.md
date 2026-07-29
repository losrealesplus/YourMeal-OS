# CURRENT_PHASE

**Última actualización:** 2026-07-29  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════════════════
YOURMEAL OS · PLATFORM BASELINE v1 · CLOSED
══════════════════════════════════════════════════════════════

Platform                  ✅ CLOSED (v1)
Baseline                  🔒 v1
Operational Core          🔒 LOCKED
Governance                🔒 COMPLETE

Foundation                🔒 LOCKED
Auth                      🔒 FROZEN
Identity                  🔒 FOUNDATION LOCKED

Entry                     ✅ CERTIFIED
Journeys                  ✅ COMPLETE
Flow                      ▶ CURRENT  (certificación operacional)

══════════════════════════════════════════════════════════════
CURRENT OBJECTIVE

  Flow Certification
  Outcome → Handoff → Outcome → Evidence → Certification
  (nunca Pantalla → API → Componente → PASS)

Progress metric:
  Certificaciones superadas

══════════════════════════════════════════════════════════════
```

**Pregunta del producto:** ¿Cómo **opera** YourMeal OS? → solo Flow puede responderla.

**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) — política permanente (6 reglas)  
**Regla diaria:** [FLOW_FIRST](./FLOW_FIRST.md) — ¿A qué Flow pertenece?  
**Done (fase):** [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md) — Handoff → Evidence → Certification → Merge  
**Jerarquía:** [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md) · **Catálogo:** [FLOW_CATALOG](./FLOW_CATALOG.md) (FLOW-01…03)

**Pregunta de fase (todo PR):**  
¿A qué Flow pertenece? → ¿Respeta Baseline? → ¿Respeta Core? → ¿Produce evidencia? → ¿Acerca Flow a certificación?  

**Categoría de PR (exactamente una):** [PR_TAXONOMY](./PR_TAXONOMY.md) — preferir títulos `FLOW-NN`  

**Actas:**  
[PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md) · [PLATFORM_BASELINE_v1](./PLATFORM_BASELINE_v1.md) · [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [FLOW_FIRST](./FLOW_FIRST.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) · [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md)

**Certificación (detalle RI-001):** [RI001_OPERATIONAL_READINESS_BACKLOG](./RI001_OPERATIONAL_READINESS_BACKLOG.md) · [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md)

---

## Continuación histórica (referencia)

El bloque siguiente conserva contexto de fases anteriores.  
**Prioridad operativa:** Flow Certification · Core sin cambios salvo evidencia.

```text
Siguiente artefacto activo:
  Flow Certification (Bloque G)
  · Entry ✅ · Journey ✅ · Flow ⏳ NOT STARTED
  · Paradigma G: organización · transferencias · no pantallas

Mapa certificación (activo):
  A Foundation              □□□□□□□□□□  (platform lock; no reabrir)
  B Surfaces                ██████████  CERTIFIED · PASS · EP-OPS-002
  C Department Workspaces   ██████████  Journey COMPLETE · EP-OPS-003
  D Operational Language    □□□□□□□□□□
  E RBAC & Access           □□□□□□□□□□
  F Observability Ready     □□□□□□□□□□
  G Flow Certification      □□□□□□□□□□  elegible · NEXT
  H Auth Transition         □□□□□□□□□□
  I Certification Report    □□□□□□□□□□

Auth Layer: IDENTITY_FREEZE_v1.md · Identity Foundation: IDENTITY_FOUNDATION_LOCK_v1.md
Layer Independence: ../05-architecture/OPERATIONAL_LAYER_INDEPENDENCE.md
```

Materialization: [ACT-002](./ACT-002_FOUNDATION_OF_MATERIALIZATION_FROZEN.md) ✅  
Experiencia base: [ACT-001](./ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md) ✅  
Capa Entry+Journey: [OPERATIONAL_CERTIFICATION_LAYER_CLOSED](./OPERATIONAL_CERTIFICATION_LAYER_CLOSED.md) ✅  
Journeys: [EP_OPS_003_JOURNEYS_COMPLETE](./EP_OPS_003_JOURNEYS_COMPLETE.md) ✅  

Programa RI-001: [RI001_PROGRAM_FROZEN](./RI001_PROGRAM_FROZEN.md) · Backlog A–I arriba.

> ❌ No reabrir Foundation / Auth / Identity / Core sin evidencia + ADR ([CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)).  
> ✅ Toda la energía en **Flow Certification**.
