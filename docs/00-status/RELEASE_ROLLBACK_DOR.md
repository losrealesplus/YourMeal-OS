# RELEASE-ROLLBACK · DoR (close-out)

**Documento:** `RELEASE_ROLLBACK_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **DoR CERTIFIED** · Spec ✅ FROZEN · Runner ✅ · Gate ✅ CLOSED · FULL PASS ✅ tag `release-rollback-pass` → `0ba856e`  
**Nivel:** Release Track B · B-05 Rollback  
**Pregunta (única):** ¿Qué debe certificar RELEASE-ROLLBACK antes de considerar recuperable un fallo de publicación?  
**Pass acta:** [RELEASE_ROLLBACK_PASS_ACTA](../10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md)  
**Estándar Flow Ready:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)  
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
| RELEASE-E2E | `release-e2e-pass` |
| RELEASE-DEPLOY | `release-deploy-pass` |
| RELEASE-ROLLBACK | `release-rollback-pass` → `0ba856e` |

> Ciclo B-05 **COMPLETO**. Siguiente: [RELEASE_01_BETA_DOR](./RELEASE_01_BETA_DOR.md).

---

## Goal

Definir qué debe demostrar RELEASE-ROLLBACK para declarar que un fallo de  
publicación (post–`release-deploy-pass`) es **recuperable de forma controlada**  
con evidencia `RELEASE_ROLLBACK_*` verificable desde `main`.

**Cumplido:** tag `release-rollback-pass` → `0ba856e` (#216).

---

## Cadena certificada

```text
R1 Detect/Decide → R2 Execute Rollback/Restore → R3 Post-rollback Verify
→ tag release-rollback-pass → 0ba856e
```

Contrato: [RELEASE_ROLLBACK_SPEC](./RELEASE_ROLLBACK_SPEC.md).

---

## Ready checklist (cerrado)

```text
RELEASE-ROLLBACK (B-05)
☑ DoR CERTIFIED                            → #207
☑ Spec FROZEN                              → #208
☑ Runner CERTIFIED                         → #210
☑ Gate READY → CLOSED                      → #211…#216
☑ 001 / 002 / 003 CERTIFIED                → #212 / #214 / #216
☑ tag release-rollback-pass                → 0ba856e
☑ READY TO OPEN RELEASE-01-BETA DoR        → [DOR](./RELEASE_01_BETA_DOR.md)
```

---

## Plan de trabajo B-05

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0–6 | DoR → Spec → Runner → Gate → 001…003 → tag | ✅ COMPLETE |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 CLOSED hasta release-01-beta
```

---

## End of RELEASE ROLLBACK DoR
