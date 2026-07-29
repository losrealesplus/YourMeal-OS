# CURRENT_PHASE

**Última actualización:** 2026-07-29  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
═══════════════════════════════════════════════
        YOURMEAL OS · PLATFORM STATUS
═══════════════════════════════════════════════

Platform                  COMPLETE

Operational Core          LOCKED
  · Declared              ✅
  · Contract              ACTIVE
  · Docs                  CLOSED

Foundation                🔒 LOCKED
Auth                      🔒 FROZEN
Identity                  🔒 FOUNDATION LOCKED

Entry                     ✅ CERTIFIED
Journeys                  ✅ COMPLETE
Flow                      ⏳ NEXT

═══════════════════════════════════════════════
CURRENT OBJECTIVE

  Flow Certification
  (Bloque G · handoffs · no pantallas)

═══════════════════════════════════════════════
```

**Pregunta obligatoria en todo PR:**  
¿Este cambio **consume** el Operational Core o intenta **redefinirlo**?  
→ Redefine = ❌ rechazado · Consume = ✅ continúa revisión  
→ Checklist: plantilla de PR · Contrato: [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md)  
→ Autoridad de cambio: [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)

**Actas de plataforma:**  
[OPERATIONAL_CORE_DECLARED](./OPERATIONAL_CORE_DECLARED.md) · [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md) · [CORE_DOCUMENTATION_CLOSED](./CORE_DOCUMENTATION_CLOSED.md) · [PLATFORM_PHASE_COMPLETE](./PLATFORM_PHASE_COMPLETE.md)

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
