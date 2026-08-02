# RELEASE-01 · B-04 · Deploy · Definition of Ready

**Documento:** `RELEASE_DEPLOY_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #197 · `e5bd8c5`) · Spec ✅ [FROZEN](./RELEASE_DEPLOY_SPEC.md) (#198) · Runner ✅ #200 · Gate ✅ #201 · 001 ✅ #202 · 002 ▶ [ACTA](../10-validation/release-deploy/RELEASE_DEPLOY_002_D2_ACTA.md)  
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

> Este documento responde **solo** la pregunta de Ready.  
> Spec: [RELEASE_DEPLOY_SPEC](./RELEASE_DEPLOY_SPEC.md).  
> **No** Runner. **No** Rollback. **No** FLOW-05. **No** `release-01-beta`.

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

## Pregunta de capability

> ¿Qué debe certificar RELEASE-DEPLOY antes de considerar el despliegue  
> reproducible y listo para el ciclo Rollback?

Respuesta de marco (DoR) · Spec congela el contrato:

> Que exista un contrato de despliegue reproducible de la plataforma ya certificada  
> (`release-e2e-pass` y predecesores), con evidencia `RELEASE_DEPLOY_*` verificable  
> desde `main`, sin inventar capacidades de producto ni reabrir gates `-pass` previos.

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

---

## Cadena (congelada en Spec)

```text
D1 Preflight → D2 Publish/Apply → D3 Post-deploy Verify
→ tag release-deploy-pass
```

Contrato: [RELEASE_DEPLOY_SPEC](./RELEASE_DEPLOY_SPEC.md).

---

## Ready checklist

```text
RELEASE-DEPLOY (B-04)
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena propuesta                         → este DoR · Spec congela
☑ Invariantes propuestos                   → este DoR · Spec congela
☑ Evidence policy                          → este DoR
☑ Gate antes de Spec / Runner              → este DoR
☑ DoR CERTIFIED en main                    → #197 · `e5bd8c5`
☑ SPEC lista (READY FOR FREEZE)            → [RELEASE_DEPLOY_SPEC](./RELEASE_DEPLOY_SPEC.md)
☑ Spec FROZEN en main                      → #198 · `ef447e2`
☑ Runner creado (BLOCKED baseline)         → ✅ #200 · `1008ffd` · [RUNNER](../10-validation/release-deploy/RELEASE_DEPLOY_RUNNER.md)
☑ READY TO OPEN RELEASE-DEPLOY-001         → ✅ Gate READY #201
☑ RELEASE-DEPLOY-001 CERTIFIED             → ✅ #202 · `a0daf82` · [ACTA](../10-validation/release-deploy/RELEASE_DEPLOY_001_D1_ACTA.md)
☑ READY TO OPEN RELEASE-DEPLOY-002         → ✅ Land Check D1 from main
☑ RELEASE-DEPLOY-002 OPEN                  → ▶ este PR · [ACTA](../10-validation/release-deploy/RELEASE_DEPLOY_002_D2_ACTA.md)
```

**DoR CERTIFIED** · Spec ✅ · Runner ✅ · Gate ✅ · 001 ✅ · **002 D2 ▶ este PR**.  
**No** D3 · Rollback · FLOW-05 · `release-01-beta` en Deploy-002.

---

## Plan de trabajo B-04

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #197 · `e5bd8c5` |
| 1 | Spec | ✅ FROZEN #198 · `ef447e2` |
| 2 | Freeze (merge Spec → main) | ✅ |
| 3 | Runner only · BLOCKED at D1 | ✅ #200 · `1008ffd` |
| 4 | Gate | ✅ READY (Land Check `main`) |
| 5 | Capacidades / PRs de Deploy (001…003) | ✅ 001 · ▶ 002 este PR · 003 ⏳ |
| 6 | FULL PASS · tag `release-deploy-pass` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-04 Deploy → B-05 Rollback → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

---

## End of RELEASE DEPLOY DoR
