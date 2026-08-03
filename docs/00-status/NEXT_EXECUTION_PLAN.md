# YourMeal OS — Next Execution Plan

**Documento:** `NEXT_EXECUTION_PLAN.md`  
**Fecha:** 2026-08-02  
**Estado:** ACTIVE · post–`flow04-pass`  
**Baseline:** `main` · tags `ps002c-pass` · `flow01-pass` · `flow02-pass` · `flow03-pass` · `flow04-pass`  
**Entrada canónica:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md) · [RELEASE_01_SPEC](./RELEASE_01_SPEC.md) · [RELEASE_01_DOR](./RELEASE_01_DOR.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**DoR estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
**Métricas de proceso:** [FOPEBA_METRICS](./FOPEBA_METRICS.md) (v0 · sin estimaciones)

> Hasta `release-01-beta` la pregunta era: *¿podemos certificar cómo liberar?*  
> Esa pregunta ya tiene evidencia (tag `release-01-beta`).  
> La pregunta que empieza a dominar: *¿YourMeal OS opera como plataforma SaaS?*

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
RELEASE-01-BETA               ✅  tag release-01-beta → facb917
RELEASE-01                    ▶  002 P2 OPEN · P1 ✅ · Gate READY
FLOW-05                       ⏳  no por inercia · candidato como criterio RELEASE-01
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
| E2E | ✅ | Tag `release-e2e-pass` → `73623ae` · [PASS](../10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md) |
| Deployment | ✅ | Tag `release-deploy-pass` → `7896a2a` · [PASS](../10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md) |
| Rollback | ✅ | Tag `release-rollback-pass` → `0ba856e` · [PASS](../10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md) |
| Beta Acceptance | ✅ | CERTIFIED · tag `release-01-beta` → `facb917` · [PASS](../10-validation/release-01-beta/RELEASE_01_BETA_PASS_ACTA.md) · producto → [RELEASE_01_DOR](./RELEASE_01_DOR.md) |

Detalle: [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md).

**Track B roadmap (orden fijo):**

```text
B-01 Smoke → B-02 Cross-flow → B-03 E2E
→ B-04 Deployment → B-05 Rollback → B-06 Beta Acceptance
→ release-01-beta
```

**Objetivo actual:** **FLOW05-001 · B1 Registration** (este PR) · PASS through B1 · BLOCKED at B2.  
DoR ✅ · Spec ✅ FROZEN · Runner ✅ · Gate ✅ (#239 · `eb07a1a`) · CERTIFIED_THROUGH=1.  
Acta: [FLOW05_001_B1_ACTA](../10-validation/flow-05/FLOW05_001_B1_ACTA.md).  
Do **not** abrir B2…B8 · Capacitor · Stores · Deploy en este PR.  
**Siguiente:** Land Check desde `main` → **FLOW05-002** (B2 Authentication only).  
**Reglas:** (1) Producto ≠ framework · (2) Land Check desde `main` (Regla 9) · (3) un bloque / PR.  
**Nota:** restaurar `docs/10-validation/**/evidence/*.json` antes de Land Check si bloquean `git pull`.

Cross-flow **no sustituye** runners canónicos: los runners certifican contratos;  
el cross-flow demuestra que los contratos encadenan:

```text
Pedido → Producción → Packaging → Entrega
→ Incidencia → Facturación → Inventario → Cierre
```

---

## Parallel Track A — Business Certification

**Current status:** FLOW05-001 ▶ B1 Registration · CERTIFIED_THROUGH=1 · BLOCKED at B2

```text
FLOW-05 ▶ FLOW05-001 (este PR) → Land Check → FLOW05-002 (B2 only)
DoR ✅ → Spec ✅ → Runner ✅ → Gate ✅ → FLOW05-001 ▶ → … → flow05-pass
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
RELEASE-01-BETA                          ✅  tag release-01-beta → facb917
        ↓
RELEASE-01 DoR                           ▶  (siguiente · docs only)
        ↓
RELEASE-01 Spec → Runner → Gate → 001…
        ↓
FLOW-05 solo como criterio de RELEASE-01 (no por inercia)
        ↓
RELEASE-01 PASS
        ↓
Beta pública controlada / release-1.0
```

Goal: demostrar que FOPEBA **escala** y que el producto es certificable como conjunto.

---

## Current Goal

```text
Track B (cerrado):   RELEASE-01 ✅ · tag release-01-pass → 8e91a49
Track A (prioridad): FLOW05-001 ▶ B1 → Land Check → FLOW05-002 (B2)
FOPEBA_LAND_CHECK:   ACTIVE · pull + fetch --tags --prune before every runner
FOPEBA_METRICS:      v0 marco; filas cuantitativas solo con datos objetivos
```

---

## End of Next Execution Plan
