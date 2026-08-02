# YourMeal OS — Next Execution Plan

**Documento:** `NEXT_EXECUTION_PLAN.md`  
**Fecha:** 2026-08-02  
**Estado:** ACTIVE · plan de ejecución post–FLOW-03  
**Baseline:** `main` · post–#161 governance · tags `ps002c-pass` · `flow01-pass` · `flow02-pass` · `flow03-pass`  
**Entrada canónica:** [PROJECT_HANDOFF](./PROJECT_HANDOFF.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**DoR estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)

> FLOW-03 is CLOSED.  
> Gobierno de Flow y gobierno de Release son niveles distintos — no mezclar.

---

## Estado institucional

```text
FOUNDATION                    ✅
PS-002C                       ✅  ps002c-pass
FLOW-01                       ✅  flow01-pass
FLOW-02                       ✅  flow02-pass
FLOW-03                       ✅  flow03-pass
FLOW-04 DoR                   ✅  #162
FLOW-04 Spec                  ✅  FROZEN #163 · 3d922ae
FLOW-04 Runner                ▶  BLOCKED at T1 (sin dominio)
RELEASE-01                    DRAFT  (eje B · #161 en main)
Definition of Release         DRAFT  (DoRl)
```

---

## Execution Rule

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

## Parallel Track A — Business Certification

**Current status:** FLOW-04 · Inventory Consumption

```text
DoR ✅ · Spec ✅ FROZEN
Runner ▶  → npm run test:flow04-canonical → BLOCKED at T1
```

Docs: [DoR](./FLOW_04_INVENTORY_CONSUMPTION_DOR.md) · [SPEC](./FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) · [Runner](../10-validation/flow-04/FLOW04_CANONICAL_RUNNER.md)

After Runner on `main` + Gate:

```text
FLOW04-001 … → flow04-pass
```

Then FLOW-05 / FLOW-06 con el mismo ciclo.

---

## Parallel Track B — RELEASE-01

Work independently from FLOW implementation.

Complete [Definition of Release](./DEFINITION_OF_RELEASE.md) progressively.

```text
RELEASE-01 DoRl checklist (DRAFT)
□ Required FLOWs certified
□ Smoke Tests
□ Cross Flow Tests
□ End-to-End Tests
□ Deployment validation
□ Rollback validation
□ Documentation complete
□ ADR synchronization
□ CHANGELOG
□ Version tag
□ Beta Acceptance
```

No Release Freeze until every applicable item is complete.  
Strategy: [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md).

---

## Repository Rules

- Keep Evidence Before Implementation  
- Keep one question per PR  
- Keep one transition per implementation PR  
- Keep contracts executable  
- Keep runners deterministic  
- Never implement future transitions  
- Never implement future FLOWs  

---

## Strategic milestones (after method has proven repeatable)

```text
FLOW-04 PASS
        ↓
FLOW-05 PASS
        ↓
FLOW-06 PASS
        ↓
RELEASE-01 DoRl PASS
        ↓
release-01-beta
        ↓
Beta pública controlada
        ↓
release-1.0
```

Goal: demonstrate that FOPEBA **scales**, not only that it works once.

### Post–FLOW-04 (candidatos · no abrir ahora)

Tras `flow04-pass`, valorar `FOPEBA_METRICS.md` — métricas del **proceso**, no del negocio:

- Tiempo DoR → Freeze · Freeze → Runner · Runner → `flowNN-pass`  
- PRs por FLOW · regresiones detectadas por runners  
- Cambios de Spec post-Freeze (ideal: 0)  
- Cobertura flows certificados / catálogo  

No forma parte de este PR ni de la Spec.

---

## Current Goal

```text
FLOW-04 Runner on main
npm run test:flow04-canonical → BLOCKED at FLOW04_T1_STARTED
Then Gate → FLOW04-001 (T1 only)
No domain in the runner PR.
```

---

## End of Next Execution Plan
