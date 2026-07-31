# CURRENT_PHASE

**Última actualización:** 2026-07-31  
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
Platform Stabilization      🟡 IN PROGRESS

PS-001                      ✅ PASS
PS-002-B                    ✅ PASS
PS-002-C                    ⏳ WAITING / BLOCKED
                             (Auth Supabase real · credenciales)
PS-003                      ✅ PASS

FCR-008                     ✅ Canonical session (código)
FCR-009                     🔍 Auth E2E investigation
                             (Toaster ausente · no fix aún)

Mobile Foundation (MF-001)  ✅ Cimientos CLOSED
  M-01 Capacitor            ✅ #117
  M-02 DeviceCapabilities   ✅ #119
  M-04 StorageProvider      ✅ #120
  M-03 Offline Queue        ✅ #122
  → INFRASTRUCTURE_PHASE_CLOSED.md
  → BETA_READINESS_CHECKPOINT.md
  → Foco: Product CTO · jornada EatClean

Sprint activo
  P0-1 PS-002-C             ⏳ BLOCKED (credenciales + cutover runtime)
  Kickoff: ../10-validation/PS002C_BETA_SPRINT_KICKOFF.md

═══════════════════════════════════════════════
OPEN GATE

  PS-002-C = PASS
  (status · pipeline completo · duplicates=[] · missing=[] · out_of_order=[])
  → DASHBOARD_RENDERED
  Evidencia: npm run test:ps002-canonical-auth
  duration_ms = telemetría diagnóstica (no criterio PASS/FAIL)
  BLOCKED ≠ FAIL (faltan PS002_EMAIL / PS002_PASSWORD)

═══════════════════════════════════════════════
NEXT PHASE (solo tras OPEN GATE)

  Platform Stabilization COMPLETE
  ↓
  FLOW-01
  Kitchen → Delivery
  Specification

En paralelo (beta móvil EatClean):
  Lema: cada PR acerca la jornada completa del piloto.
  P0 = PS-002-C · smoke nativo estricto · pedido real E2E
  Checklist oficial: BETA_READINESS_CHECKPOINT.md §4
  BR-03 Admin: Decisión B · Edit/Disable fuera de Beta v1
  Siguiente BR: BR-03.3 Runtime Validation (G3)
  → ../12-beta/BR-03_SCOPE_DECISION.md
  No abrir M-06/MF-002 / “de cara al futuro” salvo bloqueador real.

Prohibido prematuro: Event Bus · Notifications · Jobs · Analytics · AI
═══════════════════════════════════════════════
Ver: ../10-validation/PRIORITY_PS002C_BEFORE_FLOW.md
     ../10-validation/platform-stabilization/PS-002.md
     ../10-validation/FCR008_CANONICAL_POST_LOGIN_SESSION.md
     ../10-validation/auth/AUTH_E2E_INVESTIGATION.md
     ./BETA_READINESS_CHECKPOINT.md
═══════════════════════════════════════════════
```

**Constitución operativa:** [OPERATING_MODEL_v1](./OPERATING_MODEL_v1.md) — ACTIVE  
> La arquitectura ya no dirige el desarrollo; el **Flow** dirige el desarrollo sobre una arquitectura estable.

**Pregunta del producto:** ¿Cómo **opera** YourMeal OS? → solo Flow puede responderla.

**Locks vigentes:**  
[IDENTITY_FOUNDATION_LOCK_v1](./IDENTITY_FOUNDATION_LOCK_v1.md) · [IDENTITY_FREEZE_v1](./IDENTITY_FREEZE_v1.md) · [STRATEGIC_ORDER_POST_IDENTITY_LOCK](./STRATEGIC_ORDER_POST_IDENTITY_LOCK.md)  
**Stabilization:** [PLATFORM_STABILIZATION_COMPLETE](../10-validation/platform-stabilization/PLATFORM_STABILIZATION_COMPLETE.md) (Bootstrap PASS · Flow-ready = PS-002-C)

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

El bloque siguiente conserva contexto de fases anteriores.  
**Prioridad operativa:** cerrar PS-002-C · luego Flow Certification · Core sin cambios salvo evidencia.

```text
Siguiente artefacto activo:
  PS-002-C (Auth Supabase real) → luego Flow Certification (Bloque G)
  · Entry ✅ · Journey ✅ · Flow ⏳ NOT STARTED (elegible · Operating Model ACTIVE)
  · Paradigma G: organización · transferencias · no pantallas
  · Post-Identity: STRATEGIC_ORDER_POST_IDENTITY_LOCK.md

Mapa certificación (activo):
  A Foundation              □□□□□□□□□□  (platform lock; no reabrir)
  B Surfaces                ██████████  CERTIFIED · PASS · EP-OPS-002
  C Department Workspaces   ██████████  Journey COMPLETE · EP-OPS-003
  D Operational Language    □□□□□□□□□□
  E RBAC & Access           □□□□□□□□□□
  F Observability Ready     □□□□□□□□□□
  G Flow Certification      □□□□□□□□□□  elegible · NEXT (tras PS-002-C)
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
> ✅ Primero evidencia PS-002-C · luego **Flow Certification**.  
> Acta: [PLATFORM_FLOW_TRANSITION_DECLARED](./PLATFORM_FLOW_TRANSITION_DECLARED.md) · COMPLETE.
