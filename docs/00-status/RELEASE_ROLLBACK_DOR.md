# RELEASE-01 · B-05 · Rollback · Definition of Ready

**Documento:** `RELEASE_ROLLBACK_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #207 · `e7f51a8`) · Spec ✅ [FROZEN](./RELEASE_ROLLBACK_SPEC.md) (#208) · Runner ✅ #210 · Gate ✅ #211 · 001 ✅ CERTIFIED #212 · `9c52d01` · next 002  
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
> Spec: [RELEASE_ROLLBACK_SPEC](./RELEASE_ROLLBACK_SPEC.md).  
> **No** Runner. **No** FLOW-05. **No** `release-01-beta`.

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

Respuesta de marco (DoR) · Spec congela el contrato:

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

## Cadena (congelada en Spec)

```text
R1 Detect/Decide → R2 Execute Rollback/Restore → R3 Post-rollback Verify
→ tag release-rollback-pass
```

Contrato: [RELEASE_ROLLBACK_SPEC](./RELEASE_ROLLBACK_SPEC.md).

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
☑ DoR CERTIFIED en main                    → #207 · `e7f51a8`
☑ SPEC lista (READY FOR FREEZE)            → [RELEASE_ROLLBACK_SPEC](./RELEASE_ROLLBACK_SPEC.md)
☑ Spec FROZEN en main                      → #208 · `4d109f7`
☑ Runner creado (BLOCKED baseline)         → ✅ #210 · `a1fbdc3` · [RUNNER](../10-validation/release-rollback/RELEASE_ROLLBACK_RUNNER.md)
☑ READY TO OPEN RELEASE-ROLLBACK-001       → ✅ Gate READY #211
☑ RELEASE-ROLLBACK-001 CERTIFIED             → ✅ #212 · `9c52d01` · [ACTA](../10-validation/release-rollback/RELEASE_ROLLBACK_001_R1_ACTA.md)
☑ READY TO OPEN RELEASE-ROLLBACK-002         → ✅ Land Check R1 from main
☑ RELEASE-ROLLBACK-002 CERTIFIED             → ✅ #214 · `2838138` · [ACTA](../10-validation/release-rollback/RELEASE_ROLLBACK_002_R2_ACTA.md)
☑ READY TO OPEN RELEASE-ROLLBACK-003         → ✅ Land Check R2 from main
```

**DoR CERTIFIED** · Spec ✅ · Runner ✅ · Gate ✅ · **001 CERTIFIED** · **002 CERTIFIED** → READY TO OPEN 003 (R3 only).  
**No** FLOW-05 · `release-01-beta` en Rollback-003.

---

## Plan de trabajo B-05

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #207 · `e7f51a8` |
| 1 | Spec | ✅ FROZEN #208 · `4d109f7` |
| 2 | Freeze (merge Spec → main) | ✅ |
| 3 | Runner only · BLOCKED at R1 | ✅ #210 · `a1fbdc3` |
| 4 | Gate | ✅ READY (Land Check `main`) |
| 5 | Capacidades / PRs Rollback (001…003) | ✅ 001 · ✅ 002 · ⏳ READY TO OPEN 003 |
| 6 | FULL PASS · tag `release-rollback-pass` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-05 Rollback → B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 solo si Track B encuentra un bloqueador que lo exija
```

---

## End of RELEASE ROLLBACK DoR
