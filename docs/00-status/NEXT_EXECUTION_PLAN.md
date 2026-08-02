# YourMeal OS — Next Execution Plan

**Documento:** `NEXT_EXECUTION_PLAN.md`  
**Fecha:** 2026-08-02  
**Estado:** ACTIVE · post–`flow04-pass`  
**Baseline:** `main` · tags `ps002c-pass` · `flow01-pass` · `flow02-pass` · `flow03-pass` · `flow04-pass`  
**Entrada canónica:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**DoR estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
**Métricas de proceso:** [FOPEBA_METRICS](./FOPEBA_METRICS.md) (v0 · sin estimaciones)

> Hasta FLOW-04 la pregunta dominante era: *¿podemos certificar un flujo?*  
> Con cuatro ciclos completos, esa pregunta ya tiene evidencia suficiente.  
> La pregunta que empieza a dominar: *¿qué falta para una beta funcional?*

---

## Estado institucional

```text
FOUNDATION                    ✅
PS-002C                       ✅  ps002c-pass
FLOW-01                       ✅  flow01-pass
FLOW-02                       ✅  flow02-pass
FLOW-03                       ✅  flow03-pass
FLOW-04                       ✅  flow04-pass
PROJECT_HANDOFF               ✅
RELEASE_01_BETA_STRATEGY      ✅  DRAFT
DEFINITION_OF_RELEASE         ✅  DRAFT (DoRl)
FOPEBA_METRICS                ✅  v0
RELEASE-01                    🚧  Track B · acumular evidencia DoRl
FLOW-05                       ⏳  DoR NOT STARTED (no abrir salvo bloqueador beta)
```

---

## Cambio de foco (post–FLOW-04 PASS)

| Antes (FLOW-01…04) | Ahora |
|--------------------|--------|
| Validar que FOPEBA funciona | Evaluar el **producto como sistema** |
| Una pregunta / Flow | DoRl medible + Flows solo si alimentan la beta |
| Runners aislados | Runners + **cross-flow** (complementarios) |

FOPEBA no se relaja. Cambia el **peso relativo** de los ejes.

---

## Prioridad

**Track B tiene prioridad ligeramente mayor** que abrir FLOW-05.

No abrir FLOW-05 de inmediato salvo que sea un **bloqueador directo** de la beta  
(documentado en DoRl / estrategia RELEASE-01). Mientras tanto, Track A permanece  
elegible con el patrón FOPEBA intacto — sin excepciones cuando se abra.

---

## Execution Rule (Track A · sin excepciones)

Never open business implementation before completing:

```text
Definition of Ready
        ↓
Specification
        ↓
Freeze
        ↓
Canonical Runner
        ↓
Canonical BLOCKED verification
        ↓
FLOWXX-001
```

This rule applies to every remaining FLOW.

---

## Parallel Track B — RELEASE-01 (prioridad ligeramente mayor)

Convertir la beta en algo **verificable**. Matriz viva:

| Gate DoRl | Estado | Evidencia |
|-----------|--------|-----------|
| FOUNDATION | ✅ | Platform / foundation locks |
| PS-002C | ✅ | Tag `ps002c-pass` |
| FLOW-01 | ✅ | Tag `flow01-pass` |
| FLOW-02 | ✅ | Tag `flow02-pass` |
| FLOW-03 | ✅ | Tag `flow03-pass` |
| FLOW-04 | ✅ | Tag `flow04-pass` |
| Smoke Tests | ✅ | Tag `release-smoke-pass` · [PASS acta](../10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md) |
| Cross-flow | ✅ | Tag `release-crossflow-pass` → `0a0c51b` · [PASS](../10-validation/release-crossflow/RELEASE_CROSSFLOW_PASS_ACTA.md) |
| E2E | ▶ | Spec ✅ FROZEN #186 · Runner ⏳ READY TO OPEN · [SPEC](./RELEASE_E2E_SPEC.md) → `release-e2e-pass` |
| Deployment | ⏳ | → `release-deploy-pass` |
| Rollback | ⏳ | → `release-rollback-pass` |
| Beta Acceptance | ⏳ | → `release-01-beta` |

Detalle: [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md).

**Track B roadmap (orden fijo):**

```text
B-01 Smoke → B-02 Cross-flow → B-03 E2E
→ B-04 Deployment → B-05 Rollback → B-06 Beta Acceptance
→ release-01-beta
```

**Objetivo actual Track B:** **RELEASE-E2E Runner** · BLOCKED at E1 (siguiente PR).  
DoR ✅ (#185) · Spec ✅ FROZEN (#186 · `6d11ae8`) · Land Check docs PASSED.  
Decision: **READY TO OPEN Runner** · Gate NOT READY · E2E-001 CLOSED.  
Do **not** open E2E-001 / Deploy / Rollback / FLOW-05 until Gate READY.  
**Reglas:** (1) Release gates ≠ Flow runners · (2) Land Check desde `main` (Regla 9).

Cross-flow **no sustituye** runners canónicos: los runners certifican contratos;  
el cross-flow demuestra que los contratos encadenan:

```text
Pedido → Producción → Packaging → Entrega
→ Incidencia → Facturación → Inventario → Cierre
```

---

## Parallel Track A — Business Certification

**Current status:** FLOW-04 ✅ CERTIFIED · `flow04-pass`

```text
FLOW-05 (cuando proceda — no inmediato)
DoR → Spec → Freeze → Runner → FLOW05-001… → flow05-pass
```

Sin excepciones. Sin features futuras. Una transición / PR.

Catálogo: [FLOW_CATALOG](./FLOW_CATALOG.md) (FLOW-05 · Customer Order Lifecycle).

---

## FOPEBA_METRICS

Marco v0 en [FOPEBA_METRICS](./FOPEBA_METRICS.md).

**No** rellenar con estimaciones. Solo evidencia objetiva de ciclos reales:

- Tiempo DoR → Freeze · Freeze → Runner · Runner → primer / FULL PASS  
- Tiempo total por FLOW · # PRs por FLOW  
- Regresiones detectadas · Spec post-Freeze (ideal: 0)  
- Cobertura catálogo (`certificados / planificados`)

---

## Repository Rules

- Keep Evidence Before Implementation  
- Keep one question per PR  
- Keep one transition per implementation PR  
- Keep contracts executable  
- Keep runners deterministic  
- Never implement future transitions  
- Never implement future FLOWs  
- DoRl ≠ DoR · `flowNN-pass` ≠ `release-01-beta`

---

## Strategic milestones

```text
flow04-pass                              ✅
        ↓
RELEASE-01 acumula evidencia DoRl        ▶  (prioridad)
        +
FLOW-05… solo si alimentan / no bloquean la beta
        ↓
RELEASE-01 DoRl PASS
        ↓
release-01-beta
        ↓
Beta pública controlada
        ↓
release-1.0
```

Goal: demostrar que FOPEBA **escala** y que el producto es certificable como conjunto.

---

## Current Goal

```text
Track B (prioridad): RELEASE-E2E Runner (BLOCKED at E1) → Gate → 001…
Track A:             Do NOT open FLOW-05 unless Track B finds a blocker
FOPEBA_LAND_CHECK:   ACTIVE · before every 001 / tag
FOPEBA_METRICS:      v0 marco; filas cuantitativas solo con datos objetivos
```

---

## End of Next Execution Plan
