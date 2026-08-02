# RELEASE-01 · B-05 · Rollback · Definition of Ready

**Documento:** `RELEASE_ROLLBACK_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DoR READY FOR REVIEW** (docs only · este PR)  
**Nivel:** Release Track B · B-05 Rollback  
**Pregunta (única):** ¿Qué debe certificar RELEASE-ROLLBACK antes de considerar recuperable un fallo de publicación?  
**Estándar Flow Ready:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) (mismo ciclo FOPEBA)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Land Check:** [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Precondiciones certificadas:**

| Hito | Tag |
|------|-----|
| PS-002-C | `ps002c-pass` |
| FLOW-01…04 | `flow01-pass` … `flow04-pass` |
| RELEASE-SMOKE | `release-smoke-pass` |
| RELEASE-CROSSFLOW | `release-crossflow-pass` |
| RELEASE-E2E | `release-e2e-pass` → `73623ae` |
| RELEASE-DEPLOY | `release-deploy-pass` → `7896a2a` |

> Este documento responde **solo** la pregunta de Ready.  
> **No** Spec. **No** Freeze. **No** Runner. **No** scripts. **No** `package.json`.  
> **No** tests. **No** CI. **No** GitHub Actions. **No** infraestructura.  
> **No** implementación de rollback. **No** FLOW-05. **No** `release-01-beta`.

---

## Goal

Definir qué debe demostrar RELEASE-ROLLBACK para declarar que un fallo de  
publicación (post–`release-deploy-pass`) es **recuperable de forma controlada**  
con evidencia `RELEASE_ROLLBACK_*` verificable desde `main`.

RELEASE-ROLLBACK certifica la **capacidad de recuperar** lo ya desplegado:

- ancla → `release-deploy-pass`
- no reabre Smoke · Cross-flow · E2E · Deploy
- no inventa producto ni reabre Flows

No certifica un Flow nuevo. No sustituye Deploy.  
No es beta acceptance (B-06).

---

## Pregunta de capability

> ¿Qué debe certificar RELEASE-ROLLBACK antes de considerar recuperable  
> un fallo de publicación de la plataforma ya certificada?

Respuesta de marco (DoR) · Spec (futuro) congela el contrato:

> Que exista un contrato de recuperación reproducible anclado a  
> `release-deploy-pass`, con evidencia `RELEASE_ROLLBACK_*` verificable  
> desde `main`, sin inventar capacidades de producto ni reabrir gates `-pass` previos.

---

## Nivel (regla inmutable)

| Nivel | Certifica | No certifica |
|-------|-----------|--------------|
| FLOW | Estados / transiciones de un dominio | Rollback |
| RELEASE-SMOKE / CROSSFLOW / E2E | Capacidades / jornada | Rollback |
| RELEASE-DEPLOY | Despliegue reproducible | Recuperación |
| **RELEASE-ROLLBACK** | **Recuperación controlada post-deploy** | Nuevo dominio · beta · FLOW-05 |

Rollback **complementa** Deploy; **no lo sustituye**.

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Cadena canónica de recuperación (borrador) | Spec / Freeze / Runner / scripts / tests |
| Tokens `RELEASE_ROLLBACK_*` (propuestos) | CI · Actions · infraestructura |
| Ancla a `release-deploy-pass` | Deploy remoto / producción ad-hoc |
| Gate antes de ROLLBACK-001 | FLOW-05 · `release-01-beta` |
| Land Check desde `main` (Regla 9) | Renegociar gates `-pass` previos |

---

## Cadena propuesta (Spec la congela)

```text
R1 Detect / Decide
    ↓
R2 Execute Rollback / Restore
    ↓
R3 Post-rollback Verify
    ↓
tag release-rollback-pass
```

Nombres y tokens exactos → Spec. Este DoR solo fija el marco.

---

## Out of scope (explícito · este PR)

| Fuera | Motivo |
|-------|--------|
| Specification / Freeze / Runner / scripts / npm / tests | Siguientes PRs FOPEBA |
| CI · GitHub Actions · secretos · infra | Evidence before Implementation |
| Implementación de rollback / restore | Tras Spec + Runner + Gate |
| Reabrir `release-deploy-pass` / E2E / Flows | Solo regresión con evidencia |
| FLOW-05 · `release-01-beta` | Track A / B-06 |

---

## Ready checklist

```text
RELEASE-ROLLBACK (B-05)
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena propuesta                         → este DoR · Spec congela
☑ Evidence policy                          → este DoR
☑ Gate antes de Spec / Runner              → este DoR
☑ Precondición release-deploy-pass         → ✅ → 7896a2a
□ DoR CERTIFIED en main                    → tras merge este PR
□ SPEC lista (READY FOR FREEZE)            → ⏳
□ Spec FROZEN                              → ⏳
□ Runner BLOCKED baseline                  → ⏳
□ READY TO OPEN RELEASE-ROLLBACK-001       → ⏳
```

**DoR ▶ este PR** · tras Land Check documental desde `main` → **READY TO OPEN Spec**.  
**No** Spec · Runner · impl · FLOW-05 · `release-01-beta` en este PR.

---

## Plan de trabajo B-05

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ▶ este PR |
| 1 | Spec | ⏳ |
| 2 | Freeze | ⏳ |
| 3 | Runner only · BLOCKED | ⏳ |
| 4 | Gate | ⏳ |
| 5 | Capacidades / PRs Rollback | ⏳ |
| 6 | FULL PASS · tag `release-rollback-pass` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-05 Rollback → B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

---

## End of RELEASE ROLLBACK DoR
