# RELEASE-01 · B-04 · Deploy · Definition of Ready

**Documento:** `RELEASE_DEPLOY_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **DoR CERTIFIED** · Spec ✅ FROZEN · Runner ✅ · Gate ✅ CLOSED · FULL PASS ✅ tag `release-deploy-pass` → `7896a2a`  
**Nivel:** Release Track B · B-04 Deployment  
**Pregunta (única):** ¿Qué debe certificar RELEASE-DEPLOY antes de considerar el despliegue reproducible y listo para Rollback?  
**Pass acta:** [RELEASE_DEPLOY_PASS_ACTA](../10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md)  
**Estándar Flow Ready:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
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
| RELEASE-DEPLOY | `release-deploy-pass` → `7896a2a` |

> Ciclo B-04 **COMPLETO**. Siguiente: [RELEASE_ROLLBACK_DOR](./RELEASE_ROLLBACK_DOR.md).

---

## Goal

Definir qué debe demostrar RELEASE-DEPLOY para declarar que el **despliegue de la plataforma certificada**  
es reproducible, trazable y apto para abrir el ciclo de Rollback.

**Cumplido:** tag `release-deploy-pass` → `7896a2a` (#206).

---

## Cadena certificada

```text
D1 Preflight → D2 Publish/Apply → D3 Post-deploy Verify
→ tag release-deploy-pass → 7896a2a
```

Contrato: [RELEASE_DEPLOY_SPEC](./RELEASE_DEPLOY_SPEC.md).

---

## Ready checklist (cerrado)

```text
RELEASE-DEPLOY (B-04)
☑ DoR CERTIFIED                            → #197
☑ Spec FROZEN                              → #198
☑ Runner CERTIFIED                         → #200
☑ Gate READY → CLOSED                      → #201…#206
☑ 001 / 002 / 003 CERTIFIED                → #202 / #204 / #206
☑ tag release-deploy-pass                  → 7896a2a
☑ READY TO OPEN RELEASE-ROLLBACK DoR       → [DOR](./RELEASE_ROLLBACK_DOR.md)
```

---

## Plan de trabajo B-04

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0–6 | DoR → Spec → Runner → Gate → 001…003 → tag | ✅ COMPLETE |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-05 Rollback → B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

---

## End of RELEASE DEPLOY DoR
