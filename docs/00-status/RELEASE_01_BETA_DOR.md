# RELEASE-01 · B-06 · Beta Acceptance · Definition of Ready

**Documento:** `RELEASE_01_BETA_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #217 · `740b843`) · Spec ✅ [FROZEN](./RELEASE_01_BETA_SPEC.md) (#218) · Runner ✅ · Gate ✅ **CLOSED** · FULL PASS ✅ tag `release-01-beta` → `facb917`  
**Nivel:** Release Track B · B-06 Beta Acceptance  
**Pregunta (única):** ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?  
**Spec:** [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md)  
**Runner:** [RELEASE_01_BETA_RUNNER](../10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Pass acta:** [RELEASE_01_BETA_PASS_ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_PASS_ACTA.md)  
**Land Check:** [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Precondiciones certificadas (Track B completo):**

| Hito | Tag |
|------|-----|
| Foundation | locks / Platform v1 CLOSED |
| PS-002-C | `ps002c-pass` |
| FLOW-01…04 | `flow01-pass` … `flow04-pass` |
| RELEASE-SMOKE | `release-smoke-pass` |
| RELEASE-CROSSFLOW | `release-crossflow-pass` |
| RELEASE-E2E | `release-e2e-pass` |
| RELEASE-DEPLOY | `release-deploy-pass` |
| RELEASE-ROLLBACK | `release-rollback-pass` → `0ba856e` |

> Ciclo DoR → Spec → Runner → Gate · B1–B5 **COMPLETO**. RELEASE-01-BETA **CERTIFIED**.  
> Tag `release-01-beta` → `facb917`.

---

## Goal

Definir qué debe demostrar **RELEASE-01-BETA** para declarar que YourMeal OS  
está listo como **primera beta funcional certificada**: el producto como conjunto,  
no un Flow nuevo ni una capacidad aislada.

La Beta **consolida evidencia ya certificada**. No inventa capacidades.

---

## Pregunta de capability

> ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?

Respuesta de marco (DoR) · Spec congela el contrato:

> Que el conjunto ya certificado  
> (Foundation · PS-002C · FLOW-01…04 · Smoke · Cross-flow · E2E · Deploy · Rollback)  
> se pueda aceptar como beta con evidencia `RELEASE_01_BETA_*` verificable desde `main`,  
> sin abrir FLOW-05 ni inventar producto.

---

## Cadena (congelada en Spec)

```text
B1 Foundation → B2 Canonical Flows → B3 Platform Capabilities
→ B4 Release Stack → B5 Beta Acceptance
→ tag release-01-beta
```

Contrato: [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md).

---

## Ready checklist

```text
RELEASE-01-BETA (B-06)
☑ Precondiciones Track B (Smoke…Rollback)  → tags release-*-pass
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena B1–B5                             → Spec congela
☑ Evidence policy                          → este DoR / Spec
☑ Gate CLOSED antes de Runner / BETA-001   → Spec §11
☑ DoR CERTIFIED en main                    → #217 · `740b843`
☑ SPEC lista (READY FOR FREEZE)            → [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md)
☑ Spec FROZEN en main                      → #218 · `ed98b3b`
☑ Runner creado (BLOCKED baseline)         → #219 · `3994833` · [RUNNER](../10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md)
☑ Gate READY                               → #220 · [GATE](../10-validation/release-01-beta/RELEASE_01_BETA_GATE.md)
☑ BETA-001 OPEN                            → ✅ CERTIFIED #222 · [ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md)
☑ BETA-002 OPEN                            → ✅ CERTIFIED #223 · [ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md)
☑ BETA-003 OPEN                            → ✅ CERTIFIED #224 · [ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_003_B3_ACTA.md)
☑ BETA-004 OPEN                            → ✅ CERTIFIED #225 · [ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_004_B4_ACTA.md)
☑ BETA-005 OPEN                            → ✅ CERTIFIED #226 · [ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_005_B5_ACTA.md)
☑ tag release-01-beta                      → facb917 · [PASS](../10-validation/release-01-beta/RELEASE_01_BETA_PASS_ACTA.md)
```

**DoR CERTIFIED** · Spec ✅ FROZEN · Runner ✅ · Gate ✅ CLOSED · B1–B5 ✅ · tag `release-01-beta` → `facb917`.

---

## Plan de trabajo B-06

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #217 · `740b843` |
| 1 | Spec | ✅ FROZEN #218 · `ed98b3b` |
| 2 | Freeze | ✅ |
| 3 | Runner only · BLOCKED at B1 | ✅ #219 · `3994833` |
| 4 | Gate READY (Land Check `main`) | ✅ #220 |
| 5 | Capacidades / PRs Beta (001…005) | ✅ 001–005 · #222…#226 |
| 6 | FULL PASS · tag `release-01-beta` | ✅ → `facb917` |

---

## Relación con Track A / Track B

```text
Track B (prioridad): RELEASE-01 DoR (post release-01-beta)
Track A:             FLOW-05 no por inercia · candidato como criterio de RELEASE-01
```

---

## Next

```text
RELEASE-01-BETA CERTIFIED
tag release-01-beta → facb917
    ↓
OPEN
RELEASE-01 DoR · este PR (#228)
Documentation only.
```

---

## End of RELEASE-01-BETA DoR
