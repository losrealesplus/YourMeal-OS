# RELEASE-01 · B-06 · Beta Acceptance · Definition of Ready

**Documento:** `RELEASE_01_BETA_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **DoR CERTIFIED** (`main` · #217 · `740b843`) · Spec ▶ [READY FOR FREEZE](./RELEASE_01_BETA_SPEC.md) · Gate **CLOSED** antes de Runner / BETA-001  
**Nivel:** Release Track B · B-06 Beta Acceptance  
**Pregunta (única):** ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?  
**Spec:** [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
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

> Este documento responde **solo** la pregunta de Ready.  
> Spec: [RELEASE_01_BETA_SPEC](./RELEASE_01_BETA_SPEC.md).  
> **No** Runner. **No** FLOW-05. **No** tag `release-01-beta` en este ciclo DoR/Spec.

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
☐ Spec FROZEN en main                      → ⏳ tras merge Spec
☐ Runner creado (BLOCKED baseline)         → ⏳
☐ Gate READY                               → ⏳
☐ BETA-001… OPEN                           → ⏳
☐ tag release-01-beta                      → ⏳
```

**DoR CERTIFIED** · Spec ▶ READY FOR FREEZE.  
**No** Runner · impl · FLOW-05 en Spec.

---

## Plan de trabajo B-06

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ✅ #217 · `740b843` |
| 1 | Spec | ▶ READY FOR FREEZE (este PR) |
| 2 | Freeze | ⏳ |
| 3 | Runner only · BLOCKED at B1 | ⏳ |
| 4 | Gate READY (Land Check `main`) | ⏳ |
| 5 | Capacidades / PRs Beta (001…005) | ⏳ |
| 6 | FULL PASS · tag `release-01-beta` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 CLOSED hasta existir release-01-beta
```

---

## Next

```text
READY FOR FREEZE
RELEASE-01-BETA Spec
    ↓
Freeze → Runner → Gate → BETA-001…
```

---

## End of RELEASE-01-BETA DoR
