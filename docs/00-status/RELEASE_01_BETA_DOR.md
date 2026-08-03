# RELEASE-01 · B-06 · Beta Acceptance · Definition of Ready

**Documento:** `RELEASE_01_BETA_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DoR OPEN** (este PR · docs only) · Gate **CLOSED** antes de Spec / Runner / BETA-001  
**Nivel:** Release Track B · B-06 Beta Acceptance  
**Pregunta (única):** ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?  
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
> **No** Spec. **No** Runner. **No** scripts. **No** tests. **No** implementación.  
> **No** FLOW-05. **No** despliegue de producción.

---

## Goal

Definir qué debe demostrar **RELEASE-01-BETA** para declarar que YourMeal OS  
está listo como **primera beta funcional certificada**: el producto como conjunto,  
no un Flow nuevo ni una capacidad aislada.

La Beta **consolida evidencia ya certificada**. No inventa capacidades.

---

## Pregunta de capability

> ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?

Respuesta de marco (DoR) · Spec (posterior) congela el contrato:

> Que el conjunto ya certificado  
> (Foundation · PS-002C · FLOW-01…04 · Smoke · Cross-flow · E2E · Deploy · Rollback)  
> se pueda aceptar como beta con evidencia `RELEASE_01_BETA_*` verificable desde `main`,  
> sin abrir FLOW-05 ni inventar producto.

---

## Nivel (regla inmutable)

| Nivel | Certifica | No certifica |
|-------|-----------|--------------|
| FLOW | Estados / transiciones de un dominio | Beta del producto |
| RELEASE-SMOKE…ROLLBACK | Capacidades de plataforma / recovery | Acceptance de beta |
| **RELEASE-01-BETA** | **Acceptance del producto como conjunto** | Nuevo dominio · FLOW-05 · prod deploy |

Beta **consume** Smoke · Cross-flow · E2E · Deploy · Rollback; **no los reabre**.

---

## Alcance propuesto (B1–B5)

Sin nuevas capacidades. Solo composición de lo ya certificado:

```text
B1  Foundation
    Foundation · Identity · Operational Core · Platform locks · PS-002C

B2  Canonical Flows
    FLOW-01 · FLOW-02 · FLOW-03 · FLOW-04
    tags: flow01-pass … flow04-pass

B3  Platform Capabilities
    Smoke · Cross-flow · E2E
    tags: release-smoke-pass · release-crossflow-pass · release-e2e-pass

B4  Deployment + Rollback
    Deploy · Rollback
    tags: release-deploy-pass · release-rollback-pass

B5  Acceptance
    Evidencia de acceptance mínima de la beta como conjunto
    → tag release-01-beta
```

El Spec (PR posterior) congelará tokens, transiciones y evidencia por segmento.  
Este DoR **no** congela el contrato ejecutable.

---

## Out of scope (este DoR y hasta Gate READY)

| Incluye (marco) | Excluye |
|-----------------|---------|
| Pregunta · goal · scope · cadena B1–B5 | Spec · Freeze · Runner · scripts · tests |
| Precondiciones `-pass` ya publicadas | FLOW-05 · nuevos Flows |
| Gate CLOSED hasta Spec + Runner | CI / GitHub Actions nuevos |
| Pointers de Track B / CURRENT_PHASE | Implementación · producción · secretos |
| Mejora documental FOPEBA Land Check (tags) | Infraestructura cloud |

---

## Cadena FOPEBA (B-06)

```text
DoR (este documento)
    ↓
Spec (READY FOR FREEZE)
    ↓
Freeze
    ↓
Runner (BLOCKED at first beta token)
    ↓
Gate READY (Land Check from main)
    ↓
BETA-001 … (una capacidad / PR)
    ↓
FULL PASS → tag release-01-beta
```

**Gate CLOSED** hasta que existan Spec FROZEN + Runner BLOCKED verificado desde `main`.  
Prohibido abrir BETA-001 antes del Gate READY (Regla 9).

---

## Evidence policy

- Evidence before Implementation  
- `main` certifica; las ramas solo proponen  
- Pre-Land Check obligatorio:

```bash
git pull origin main
git fetch --tags --prune
```

- Arrays vacíos en PASS / BLOCKED canónico: `duplicates=[]` · `missing=[]` · `out_of_order=[]`  
- Tag `release-01-beta` solo tras FULL PASS verificado desde `main`

---

## Ready checklist

```text
RELEASE-01-BETA (B-06)
☑ Precondiciones Track B (Smoke…Rollback)  → tags release-*-pass
☑ Goal definido                            → este DoR
☑ Scope / Out of scope                     → este DoR
☑ Cadena B1–B5 propuesta                   → este DoR · Spec congela
☑ Evidence policy                          → este DoR
☑ Gate CLOSED antes de Spec / Runner       → este DoR
☐ DoR CERTIFIED en main                    → tras merge de este PR
☐ SPEC lista (READY FOR FREEZE)            → PR posterior
☐ Spec FROZEN en main                      → ⏳
☐ Runner creado (BLOCKED baseline)         → ⏳
☐ Gate READY                               → ⏳
☐ BETA-001… OPEN                           → ⏳
☐ tag release-01-beta                      → ⏳
```

**Este PR:** DoR OPEN · docs only.  
**No** Spec · Runner · impl · FLOW-05 · `release-01-beta` tag.

---

## Plan de trabajo B-06

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ▶ este PR |
| 1 | Spec | ⏳ |
| 2 | Freeze | ⏳ |
| 3 | Runner only · BLOCKED | ⏳ |
| 4 | Gate READY (Land Check `main`) | ⏳ |
| 5 | Capacidades / PRs Beta (001…) | ⏳ |
| 6 | FULL PASS · tag `release-01-beta` | ⏳ |

---

## Relación con Track A / Track B

```text
Track B (prioridad): B-06 Beta Acceptance → release-01-beta
Track A:             FLOW-05 CLOSED hasta existir release-01-beta
                     (o bloqueador beta explícito documentado)
```

---

## Next

```text
After this DoR merges to main
    ↓
READY TO OPEN
RELEASE-01-BETA Spec
Documentation / contract only
Nothing executable until Spec FROZEN + Runner + Gate READY
```

---

## End of RELEASE-01-BETA DoR
