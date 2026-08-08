# CURRENT_PHASE

**Última actualización:** 2026-08-07  
**Acta de eras:** [ERA_DECLARATION](./ERA_DECLARATION.md) · ADR [0091](../adr/0091-era-declaration.md) · **Era 1 CLOSED · Era 2 OPEN**  
**Active Experience:** ▶ **[CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md)** · alta/gestión **&lt; 30s**  
**Sprint board:** [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
**Observation instrument (sessions deferred · LAW 001-A):** [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md) · ADR [0096](../adr/0096-tenant-success-law-001a.md)  
**Institutional:** [OPERATIONAL_ENGINE_V1](./OPERATIONAL_ENGINE_V1.md) · **Construction COMPLETE**  
**Playbook:** [TENANT_SUCCESS_PLAYBOOK](./TENANT_SUCCESS_PLAYBOOK.md)  
**Prompt:** [ERA2_CURSOR_PROMPT](./ERA2_CURSOR_PROMPT.md)  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
═══════════════════════════════════════════════
YOURMEAL OS · CURRENT GATE
═══════════════════════════════════════════════

ERA 1 · Build the Engine    ✅ COMPLETE
Operational Engine v1.0     ✅ DECLARED · Architecture FROZEN

ERA 2 · Return Time         ▶ OPEN
Sprint type                 Experience Sprint
Active                      CUSTOMER EXPERIENCE 001
Mission                     Zero Friction Customer Management
TTA                         Time-to-Create Customer < 30 seconds

EXPERIENCE LAW 001          Minimum first interaction (ADR 0098)
Progressive Completion      Rest later

Observation Framework       ✅ READY (instrument)
Isabella / Sara sessions    ⏸ After usable Experience chain (LAW 001-A)

Laws
  · PRODUCT LAW 001 · 002
  · EXPERIENCE LAW 001 (ADR 0098)
  · TENANT SUCCESS LAW 001 · 001-A
  · TEAM LAW 001

Roadmap (missions)
  Customer → Order → Menu → Production → Kitchen → Delivery
  → Android → OPPO → Dogfood → Isabella → Backlog
```

---

**Histórico (pre–Engine v1.0):**

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
  1 · Domain / Flow           ✅ FLOW-01…04 CERTIFIED (metodología probada)
  2 · Product as system       ✅ RELEASE-01 CERTIFIED · tag release-01-pass
  Pregunta dominante          ¿Qué capacidades de distribución reales añadimos
                              sobre el Core ya certificable en Web · Android · iOS?
  Pregunta Flow (sigue)       ¿Este flujo cumple el contrato?
  Principio                   Evidence before Implementation
  Estándar Flow               Definition of Ready (FLOW-XX)
  Estándar Release            Definition of Release (DoRl)
                              → ./DEFINITION_OF_RELEASE.md

Sprint activo
  FLOW-01                      ✅ CERTIFIED · tag flow01-pass
  FLOW-02                      ✅ CERTIFIED · tag flow02-pass
  FLOW-03                      ✅ CERTIFIED · tag flow03-pass → 67a2e66
  FLOW-04                      ✅ CERTIFIED · tag flow04-pass → 8be1c26
  FLOW-05                      ✅ CERTIFIED · tag flow05-pass
                               FULL PASS · certified_through=B8 · blocked_at=—
                               Acta: ../10-validation/flow-05/FLOW_05_PASS_ACTA.md
                               Gate CLOSED · B1…B8
  Live: npm run test:flow-05 → FULL PASS
  CAPACITOR                    ✅ CERTIFIED · tag capacitor-pass → 400a010 (#256)
                               FULL PASS · certified_through=C5 · blocked_at=—
                               Acta: ../10-validation/capacitor/CAPACITOR_PASS_ACTA.md
                               Gate CLOSED · C1…C5 · Distribution Certified
  Live: npm run test:capacitor → FULL PASS
  FLOW Governance              ✅ COMPLETE (#147)
  Tags: ps002c-pass · flow01…05-pass · release-01-beta · release-01-pass
        · capacitor-pass · mobile-release-01-pass
        (taxonomía: ./GIT_MILESTONE_TAGS.md)
  Prioridad                    STORE-RELEASE-01 · Spec FROZEN ▶ (este ciclo)
                               DoR ✅ · Runner 🔒 · Gate 🔒 · no uploads
                               MOBILE-RELEASE-01 ✅ · tag mobile-release-01-pass
                               NO reabrir MR1–MR5 / C1–C5 · Core Integrity intacta
                               Regla: Native Tool Artifacts (FOUNDATION.md)
                               Order States ≠ Operational States
  Regla Release                capacidades plataforma ≠ entidades dominio
  Regla Gate                   cierra solo verificado desde main (Regla 9)
  Land Check                   ./FOPEBA_LAND_CHECK.md (antes de cualquier 001)
  Paralelo                     Track A · device APIs solo cuando aporten valor
  Plan                         ./NEXT_EXECUTION_PLAN.md
  Metrics                      ./FOPEBA_METRICS.md (v0 · sin estimaciones)
  Handoff                      ./PROJECT_HANDOFF.md
  DoRl                         ./DEFINITION_OF_RELEASE.md (DRAFT)
  Ejes                         A: STORE-RELEASE-01 ▶ · B: RELEASE-01 ✅ · C: MOBILE-RELEASE-01 ✅
  Disciplina: un milestone / ciclo · DoR antes de código · consolidar ≠ correr
  Riesgo emergente: confundir store upload con reabrir MOBILE-RELEASE / Capacitor

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
  FLOW-04 ✅ FULL PASS · tag flow04-pass → 8be1c26 (#167)
  ↓
  RELEASE-01-BETA ✅ · tag release-01-beta
  ↓
  RELEASE-01 ✅ CERTIFIED · tag release-01-pass → 8e91a49
  ↓
  FLOW-05 DoR ✅ (#236)
  ↓
  FLOW-05 Spec ✅ FROZEN (#237)
  ↓
  FLOW-05 Runner ✅ (#238)
  ↓
  ▶ FLOW-05 Gate READY (este PR) · autoriza FLOW05-001
  ↓
  FLOW05-001 · B1 Registration only
  ↓
  FLOW-05 ✅ FULL PASS · tag flow05-pass
  ↓
  Capacitor DoR → Spec → Runner → C1…C5
  ↓
  ▶ CAPACITOR ✅ CERTIFIED · tag capacitor-pass → 400a010
  ↓
  MOBILE-RELEASE-01 DoR ✅ · Spec ✅ · Runner ✅ · Gate CLOSED
  ↓
  MR01-001…005 ✅ · FULL PASS · Ready for Internal Testing
  ↓
  tag mobile-release-01-pass → ca3e823
  ↓
  ▶ STORE-RELEASE-01 DoR ✅ (#269)
  ↓
  ▶ STORE-RELEASE-01 Spec FROZEN (este PR)
  ↓
  Next · STORE-RELEASE-01 Runner only
  (baseline BLOCKED at STORE_RELEASE_SR1_STARTED)
  Separación: MOBILE-RELEASE = binarios · STORE-RELEASE = distribución en stores

En paralelo (beta móvil EatClean):
  Lema: cada PR acerca la jornada completa del piloto.
  BR-03.3 Runtime Validation
  → ../12-beta/BR-03_SCOPE_DECISION.md
  No abrir M-06/MF-002 / “de cara al futuro” salvo bloqueador real.

Prohibido prematuro: Event Bus · Notifications · Jobs · Analytics · AI
═══════════════════════════════════════════════
Ver: ./NEXT_EXECUTION_PLAN.md
     ./RELEASE_01_BETA_STRATEGY.md
     ./DEFINITION_OF_RELEASE.md
     ./FOPEBA_METRICS.md
     ./PROJECT_HANDOFF.md
     ../10-validation/flow-04/FLOW04_PASS_ACTA.md
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
**Jerarquía:** [FLOW_WORK_HIERARCHY](./FLOW_WORK_HIERARCHY.md) · **Catálogo:** [FLOW_CATALOG](./FLOW_CATALOG.md) (FLOW-01…04 ✅ · FLOW-05 Gate READY ▶)

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
