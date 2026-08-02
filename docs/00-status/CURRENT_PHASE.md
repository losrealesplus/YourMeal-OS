# CURRENT_PHASE

**Última actualización:** 2026-08-02  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
═══════════════════════════════════════════════
YOURMEAL OS · CURRENT GATE
═══════════════════════════════════════════════

Foundation                  ✅ COMPLETE
Identity                    ✅ COMPLETE
Operational Core            ✅ COMPLETE
Governance                  ✅ COMPLETE
Operating Model             ✅ COMPLETE (v1 ACTIVE)
Platform Stabilization      ✅ COMPLETE (Flow-ready)

PS-001                      ✅ PASS
PS-002-B                    ✅ PASS
PS-002-C                    ✅ PASS (2026-08-02)
                             Auth Supabase real · FCR-008
PS-003                      ✅ PASS

FCR-008                     ✅ CERTIFIED · FROZEN
                             (solo reabrir por regresión)
FCR-009                     🔍 Toaster ausente (no bloquea PS-002-C)

Mobile Foundation (MF-001)  ✅ Cimientos CLOSED
  → BETA_READINESS_CHECKPOINT.md
  → Foco: Product CTO · jornada EatClean

Fase proyecto
  0 · Plataforma              ✅ COMPLETE
  1 · Domain / Flow           ▶ ACTIVA
  Pregunta                    ¿El negocio cumple el contrato?
  Principio                   Evidence before Implementation
  Estándar                    Definition of Ready (FLOW-XX)
                              → ./FLOW_DEFINITION_OF_READY.md

Sprint activo
  FLOW-01                      ✅ CERTIFIED · tag flow01-pass
  FLOW-02                      ✅ CERTIFIED · tag flow02-pass → a1e8d1e
  FLOW-03                      ✅ CERTIFIED · tag flow03-pass → 67a2e66
  Live: npm run test:flow03-canonical -- --live → FULL PASS
  Acta: ../10-validation/flow-03/FLOW03_PASS_ACTA.md
  FLOW Governance              ✅ COMPLETE (#147)
  Tags: ps002c-pass · flow01-pass · flow02-pass · flow03-pass
        (taxonomía: ./GIT_MILESTONE_TAGS.md)
  Activo                       FLOW-04 Inventory Consumption
                               ✅ FULL PASS · tag flow04-pass (este PR)
                               → ../10-validation/flow-04/FLOW04_PASS_ACTA.md
                               Next: FLOW-05 DoR · RELEASE-01 DoRl · FOPEBA_METRICS
                               Plan: ./NEXT_EXECUTION_PLAN.md
                               Metrics: ./FOPEBA_METRICS.md
  Handoff                      ./PROJECT_HANDOFF.md (congelado 2026-08-02)
  Release                      ./RELEASE_01_BETA_STRATEGY.md (DRAFT · eje B)
  DoRl                         ./DEFINITION_OF_RELEASE.md (DRAFT · gate de versión)
  Ejes                         A: FLOW-04+ FOPEBA · B: RELEASE-01 DoRl
  Beta paralelo: BR-03.3 Runtime Validation (G3)
  Disciplina: una transición / PR · DoR antes de código · DoRl ≠ DoR

═══════════════════════════════════════════════
CLOSED GATE

  PS-002-C = PASS
  duplicates=[] · missing=[] · out_of_order=[]
  → DASHBOARD_RENDERED
  duration_ms (diagnostic): login_to_session=531 · session_to_bootstrap=1 · bootstrap_to_dashboard=833

═══════════════════════════════════════════════
NEXT PHASE

  FLOW-01 CERTIFIED
  ↓
  FLOW Definition of Ready ✅ (#147)
  ↓
  FLOW-02 Spec ✅ FROZEN (#148)
  ↓
  FLOW-02 Runner ✅ (#150)
  ↓
  FLOW-02 ✅ FULL PASS · tag flow02-pass
  ↓
  FLOW-03 ✅ FULL PASS · tag flow03-pass → 67a2e66 (#160)
  ↓
  FLOW-04 · Spec FROZEN → Runner (BLOCKED at T1) → Gate → FLOW04-001
  ↓
  FLOW04-001… (solo tras Gate)

En paralelo (beta móvil EatClean):
  Lema: cada PR acerca la jornada completa del piloto.
  BR-03.3 Runtime Validation
  → ../12-beta/BR-03_SCOPE_DECISION.md
  No abrir M-06/MF-002 / “de cara al futuro” salvo bloqueador real.

Prohibido prematuro: Event Bus · Notifications · Jobs · Analytics · AI
═══════════════════════════════════════════════
Ver: ./NEXT_EXECUTION_PLAN.md
     ./FLOW_04_INVENTORY_CONSUMPTION_DOR.md
     ./PROJECT_HANDOFF.md
     ./RELEASE_01_BETA_STRATEGY.md
     ./DEFINITION_OF_RELEASE.md
     ../10-validation/flow-03/FLOW03_PASS_ACTA.md
     ./FLOW_DEFINITION_OF_READY.md
     ./EVIDENCE_BEFORE_IMPLEMENTATION.md
     ./FLOW_CATALOG.md
     ../10-validation/platform-stabilization/PS002C_PASS_ACTA.md
═══════════════════════════════════════════════
```

**Constitución operativa:** [OPERATING_MODEL_v1](./OPERATING_MODEL_v1.md) — ACTIVE  
> La arquitectura ya no dirige el desarrollo; el **Flow** dirige el desarrollo sobre una arquitectura estable.

**Pregunta del producto:** ¿Cómo **opera** YourMeal OS? → solo Flow puede responderla.

**Locks vigentes:**  
[IDENTITY_FOUNDATION_LOCK_v1](./IDENTITY_FOUNDATION_LOCK_v1.md) · [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) · [STRATEGIC_ORDER_POST_IDENTITY_LOCK](./STRATEGIC_ORDER_POST_IDENTITY_LOCK.md)  
**Stabilization:** [PLATFORM_STABILIZATION_COMPLETE](../10-validation/platform-stabilization/PLATFORM_STABILIZATION_COMPLETE.md) · [PS002C_PASS_ACTA](../10-validation/platform-stabilization/PS002C_PASS_ACTA.md)

**Acta de transición:** [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) — COMPLETE  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) — política permanente (6 reglas)  
**Regla diaria:** [FLOW_FIRST](./FLOW_FIRST.md) — ¿A qué Flow pertenece?  
**Done (fase):** [FLOW_DEFINITION_OF_DONE](./FLOW_DEFINITION_OF_DONE.md) — Handoff → Evidence → Certification → Merge  
**Jerarquía:** [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md) · **Catálogo:** [FLOW_CATALOG](./FLOW_CATALOG.md) (FLOW-01…03)

**Pregunta de fase (todo PR):**  
¿A qué Flow pertenece? → ¿Qué Outcome? → ¿Qué Handoff? → ¿Qué evidencia? → ¿Respeta Baseline/Core?  

**Categoría de PR (exactamente una):** [PR_TAXONOMY](./PR_TAXONOMY.md) — preferir títulos `FLOW-NN`  

**Actas:**  
[OPERATING_MODEL_v1](./OPERATING_MODEL_v1.md) · [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · [PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md) · [PLATFORM_BASELINE_v1](./PLATFORM_BASELINE_v1.md) · [FLOW_CERTIFICATION_OPEN](./FLOW_CERTIFICATION_OPEN.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) · [FLOW_FIRST](./FLOW_FIRST.md) · [CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md) · [OPERATIONAL_CORE_CONTRACT](./OPERATIONAL_CORE_CONTRACT.md)

**Certificación (detalle RI-001):** [RI001_OPERATIONAL_READINESS_BACKLOG](./RI001_OPERATIONAL_READINESS_BACKLOG.md) · [BLOCK_G_FLOW_FRAMING](../10-validation/ep-ops-003/BLOCK_G_FLOW_FRAMING.md)

---

## Continuación histórica (referencia)

```text
Siguiente artefacto activo:
  FLOW-01 · Kitchen → Delivery · Specification
  · Entry ✅ · Journey ✅ · Flow ⏳ NOT STARTED (elegible · PS-002-C PASS)
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
```

> ❌ No reabrir Foundation / Auth / Identity / Core / PS-002-C sin evidencia de regresión + ADR ([CHANGE_AUTHORITY](./CHANGE_AUTHORITY.md)).  
> ✅ **Flow Certification** es el siguiente gate.  
> Acta PS-002-C: [PS002C_PASS_ACTA](../10-validation/platform-stabilization/PS002C_PASS_ACTA.md).
