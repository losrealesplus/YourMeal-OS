# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Current Phase:     Engineering Fix Sprint
Current Branch:    main  (tras merge IR-001 / PR #22)
Last Integration:  IR-001 · First Engineering Integration
Next Gate:         ORR  (PASSED | BLOCKED)
Current Objective: Resolve P1 findings

Operational Status:
  Ready for CAP-006  ✅
  Ready for ORR      ❌

══════════════════════════════════════════════════
```

> Si PR #22 aún no está en `main`, la **Current Branch** efectiva es el tip de integración hasta el merge.

---

## Project Phase detail

```text
Fase A  IR-001 · Stack → main     (PR #22)
Fase B  Engineering Fix Sprint    ← ahora (tras A)
Fase C  Verificación técnica      (tsc · tests · RLS · audit · flags · HP)
Fase D  ORR                       (sin código)
Fase E  FOV                       (aprendizaje en campo)
```

---

## Current Objective

Resolve **P1 Engineering Findings** — sin UX, OM, Capabilities ni Design System.

### Engineering Integrity

| ID | Tema |
|----|------|
| INC-01 | No confiar `total` / `dishIds` del cliente |
| INC-03 | Ownership order → customer en Confirm |
| INC-05 | Atomicidad draft + audit consistente |

### Engineering Completeness

| ID | Tema |
|----|------|
| INC-02 | Soft-delete (`deleted_at`) + types |
| INC-04 | N+1 en Order Summary |
| INC-06 | Eliminar `MOCK_ORDERS` (home / lista) |
| INC-07 | Cablear `featureFlagService` |

Detalle: [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md).

---

## Next Gate

```text
ORR  (PASSED | BLOCKED)  — sin features
```

---

## Next Milestone

```text
HP-001 · Operational · ORR PASSED · Ready for FOV
```

---

## Baseline tag (tras merge IR-001)

Tras fusionar PR #22 en `main`, crear tag de restauración:

```text
v0.2.0-engineering-baseline
```

Punto de referencia: metodología cerrada · skeleton · patrones · CAP conectadas · gobernanza · pila en `main`.

Ver [IR-001](./IR-001_FIRST_ENGINEERING_INTEGRATION.md).

---

Gobernanza: **no** abrir documentos metodológicos nuevos hasta terminar la primera FOV.
