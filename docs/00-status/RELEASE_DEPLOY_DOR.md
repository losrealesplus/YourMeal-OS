# RELEASE-01 · B-04 · Deploy · Definition of Ready

**Documento:** `RELEASE_DEPLOY_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DoR** (este PR) · Spec ⏳ · Runner ⏳ · Gate ⏳  
**Nivel:** Release Track B · B-04 Deployment  
**Pregunta (única):** ¿Qué debe certificar RELEASE-DEPLOY antes de considerar el despliegue reproducible y listo para Rollback?  
**Estándar Flow Ready:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) (mismo ciclo FOPEBA)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) · [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Land Check:** [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Precondiciones certificadas:**

| Hito | Tag |
|------|-----|
| PS-002-C | `ps002c-pass` |
| FLOW-01…04 | `flow01-pass` … `flow04-pass` |
| RELEASE-SMOKE | `release-smoke-pass` → `370628a` |
| RELEASE-CROSSFLOW | `release-crossflow-pass` → `0a0c51b` |
| RELEASE-E2E | `release-e2e-pass` → `73623ae` |

> Este PR responde **solo** la pregunta de arriba (marco Ready).  
> **No** es Specification. **No** Freeze. **No** Runner.  
> **No** abre Rollback · FLOW-05 · `release-01-beta`.  
> **No** artefactos ejecutables en este PR.

---

## Goal

Definir qué debe demostrar RELEASE-DEPLOY para declarar que el **despliegue de la plataforma certificada**  
es reproducible, trazable y apto para abrir el ciclo de Rollback.

RELEASE-DEPLOY certifica la **capacidad de publicar** lo ya validado por:

- jornada de plataforma → `release-smoke-pass`
- handoffs → `release-crossflow-pass`
- jornada piloto E2E → `release-e2e-pass`

No certifica un Flow nuevo. No sustituye Smoke · Cross-flow · E2E.  
No es Rollback (B-05). No es beta acceptance (B-06).

---

## Pregunta de capability (borrador · Spec la congela)

> ¿Qué debe certificar RELEASE-DEPLOY antes de considerar el despliegue  
> reproducible y listo para el ciclo Rollback?

Respuesta de marco (este DoR):

> Que exista un contrato de despliegue reproducible de la plataforma ya certificada  
> (`release-e2e-pass` y predecesores), con evidencia `RELEASE_DEPLOY_*` verificable  
> desde `main`, sin inventar capacidades de producto ni reabrir gates `-pass` previos.

No: *¿Smoke / Cross-flow / E2E siguen PASS?* (ya lo certifican sus tags)  
Sí: *¿podemos desplegar de forma repetible lo que esos tags ya certificaron?*

---

## Nivel (regla inmutable)

| Nivel | Certifica | No certifica |
|-------|-----------|--------------|
| FLOW | Estados / transiciones de un dominio | Publicación |
| RELEASE-SMOKE | Capacidades mínimas de plataforma | Deploy |
| RELEASE-CROSSFLOW | Handoffs encadenados | Deploy |
| RELEASE-E2E | Jornada piloto como un todo | Deploy |
| **RELEASE-DEPLOY** | **Despliegue reproducible de lo certificado** | Rollback · nuevo dominio · beta |

Deploy **complementa** Smoke · Cross-flow · E2E; **no los sustituye**.  
Un Deploy PASS no reabre ni renegocia tags `-pass` previos.

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Goal · Scope · invariantes · evidencia · Gate | Spec / Freeze / Runner |
| Ready checklist · out of scope · naming documental | Scripts · package.json · comandos npm · tests · CI |
| Anclas a tags ya certificados | Playwright · browser · UI · servicios · dominio nuevo |
| Land Check documental desde `main` (Regla 9) | Rollback · FLOW-05 · `release-01-beta` |

**Ancla:** `release-e2e-pass` (+ Smoke · Cross-flow · FLOW-01…04).  
**No reabre** E2E / Smoke / Cross-flow salvo regresión del tag correspondiente.

---

## Cadena propuesta (no Freeze)

```text
Plataforma certificada (release-e2e-pass)
        ↓
Preflight deploy
        ↓
Publish / apply
        ↓
Post-deploy verify
        ↓
PASS → tag release-deploy-pass
```

La Spec congelará tokens `RELEASE_DEPLOY_*` y el orden exacto.  
Este DoR **no** congela el contrato.

---

## Invariantes propuestos (no Freeze)

| ID | Invariante |
|----|------------|
| D-I1 | No se abre RELEASE-DEPLOY-001 sin Spec FROZEN + Runner BLOCKED verificado desde `main` |
| D-I2 | Deploy no inventa dominio ni reabre FLOW-01…04 / Smoke / Cross-flow / E2E |
| D-I3 | Evidencia `RELEASE_DEPLOY_*` en orden; sin secretos en actas |
| D-I4 | Una capacidad / PR · Land Check desde `main` (Regla 9) |
| D-I5 | Rollback permanece CLOSED hasta `release-deploy-pass` |

---

## Evidence policy

| Regla | Política |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) — las ramas solo proponen |
| Forma | Tokens `RELEASE_DEPLOY_*` (Spec los congela) |
| Acta path (futuro) | `docs/10-validation/release-deploy/` |
| Close-out | `RELEASE_DEPLOY_PASS_ACTA.md` + tag `release-deploy-pass` |
| Prohibido | Secretos · pantallas como PASS · renegociar tags previos |

Este DoR **no** crea runners, scripts ni evidencias ejecutables.

---

## Gate · Abrir Spec / Runner

RELEASE-DEPLOY Spec / Runner **solo** cuando:

| # | Condición |
|---|-----------|
| 1 | Este DoR mergeado en `main` (CERTIFIED) |
| 2 | `release-e2e-pass` presente en origin |
| 3 | Sin apertura simultánea de Rollback / FLOW-05 / `release-01-beta` |

Hasta entonces: **prohibido** automatización de deploy · scripts de publicación · Rollback · FLOW-05.

---

## Ready checklist

```text
RELEASE-DEPLOY (B-04)
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena propuesta                         → este DoR
☑ Invariantes propuestos                   → este DoR
☑ Evidence policy                          → este DoR
☑ Gate antes de Spec / Runner              → este DoR
□ SPEC lista (READY FOR FREEZE)            → siguiente PR
□ Spec FROZEN en main                      → ⏳
□ Runner creado (BLOCKED baseline)         → ⏳
□ READY TO OPEN RELEASE-DEPLOY-001         → ⏳
```

**Tras merge de este DoR:** READY TO OPEN **RELEASE-DEPLOY Spec** (docs).  
Nada ejecutable. Nada de Rollback.

---

## Out of scope (explícito · este capability y este PR)

| Fuera | Motivo |
|-------|--------|
| Specification / Freeze / Runner | Siguientes PRs FOPEBA |
| package.json · scripts · npm · tests · CI · pipelines de publish | Evidence before Implementation |
| Playwright · browser · UI · `src/` · migraciones · secretos | No es DoR |
| Rollback | B-05 |
| `release-01-beta` | DoRl PASS de todos los gates |
| FLOW-05 / FLOW-06 | Track A; solo si Track B lo bloquea |
| Renegociar Smoke · Cross-flow · E2E · FLOW-01…04 | Ya certificados con tag `-pass` |

---

## Naming convention (Track B · documental)

Solo nombres — **ningún artefacto ejecutable en este PR**:

```text
docs/00-status/RELEASE_DEPLOY_DOR.md       ← este documento
docs/00-status/RELEASE_DEPLOY_SPEC.md      ← siguiente

docs/10-validation/release-deploy/         ← tras Spec / Runner
  RELEASE_DEPLOY_RUNNER.md
  RELEASE_DEPLOY_GATE.md
  RELEASE_DEPLOY_*_ACTA.md
  RELEASE_DEPLOY_PASS_ACTA.md
  evidence/

tag (futuro): release-deploy-pass
```

---

## Plan de trabajo B-04

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ▶ este PR |
| 1 | Spec | ⏳ |
| 2 | Freeze (merge Spec → main) | ⏳ |
| 3 | Runner only · BLOCKED baseline | ⏳ |
| 4 | Gate | ⏳ |
| 5 | Capacidades / PRs de Deploy | ⏳ |
| 6 | FULL PASS · tag `release-deploy-pass` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-04 Deploy → B-05 Rollback → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

No abrir FLOW-05 / Rollback / Spec+Runner juntos por inercia tras este DoR.

---

## Fuera de este PR

- `RELEASE_DEPLOY_SPEC.md`  
- Runner · automatización · cualquier ejecutable  
- Rollback · `release-01-beta`  
- FLOW-05 / FLOW-06  

---

## End of RELEASE DEPLOY DoR
