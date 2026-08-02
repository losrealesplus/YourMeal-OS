# RELEASE-01 · B-05 · Rollback · Specification

**Documento:** `RELEASE_ROLLBACK_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FROZEN** (Spec · #208 · `4d109f7`) · DoR ✅ (#207 · `e7f51a8`) · Runner ⏳ · Gate ⛔ NOT READY  
**Gate DoRl:** Rollback · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow nuevo  
**DoR:** [RELEASE_ROLLBACK_DOR](./RELEASE_ROLLBACK_DOR.md) ✅ en `main` (#207 · `e7f51a8`)  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass` · `release-smoke-pass` · `release-crossflow-pass` · `release-e2e-pass` · `release-deploy-pass` → `7896a2a`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags:** `release-rollback-pass` → `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Este PR responde **solo**:  
> ¿Qué debe certificar exactamente RELEASE-ROLLBACK antes de considerar  
> recuperable un fallo de publicación?  
> **No** Runner. **No** scripts. **No** `package.json`. **No** comandos npm.  
> **No** tests. **No** CI. **No** GitHub Actions. **No** infraestructura.  
> **No** implementación de rollback. **No** FLOW-05. **No** `release-01-beta`.

---

## 1. Goal

> ¿Qué debe certificar RELEASE-ROLLBACK antes de considerar recuperable  
> un fallo de publicación de la plataforma ya certificada?

RELEASE-ROLLBACK certifica que la **plataforma ya desplegada**  
(`release-deploy-pass` y predecesores) puede **recuperarse de forma controlada**  
con evidencia `RELEASE_ROLLBACK_*` verificable desde `main`.

No: *¿Deploy / Smoke / E2E siguen PASS?* (ya lo certifican sus tags `-pass`)  
No: *¿podemos publicar de nuevo?* (eso es RELEASE-DEPLOY)  
Sí: *¿existe un contrato de recuperación repetible post-deploy, sin inventar producto?*

---

## 2. Scope

### Dentro (v1 · congelado por este Spec)

| Incluye | Notas |
|---------|-------|
| Cadena canónica R1 → R2 → R3 | Detect/Decide → Execute Rollback/Restore → Post-rollback Verify |
| Tokens `RELEASE_ROLLBACK_R*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Ancla a despliegue certificado (`release-deploy-pass`) | No reabrir Specs FROZEN de producto |
| Land Check desde `main` (Regla 9) | Solo `main` certifica |
| Una capacidad / entrega `RELEASE-ROLLBACK-001`…`003` | Tras Gate READY |

### Cadena canónica

```text
R1  Detect / Decide
    (anchor: release-deploy-pass + criterio de activación documentado)
  ↓
R2  Execute Rollback / Restore
    (anchor: procedimiento de recuperación reproducible)
  ↓
R3  Post-rollback Verify
    (anchor: verificación mínima post-recuperación · no reabre E2E/Deploy)
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Runner · scripts · `package.json` · comandos npm · tests · CI · Actions | PR Runner / impl posteriores |
| Infraestructura nueva · secretos · credenciales en actas | Fuera de contrato Spec |
| Implementación de dominio · migraciones · UI | Evidence before Implementation |
| Re-ejecutar Deploy / E2E / Smoke completos | Rollback **recupera**, no re-certifica jornada |
| `release-01-beta` | B-06 · DoRl PASS completo |
| FLOW-05+ | Track A; solo si Track B lo bloquea |
| Renegociar `release-deploy-pass` / E2E / FLOW-01…04 | Solo regresión con evidencia |

---

## 3. Canonical transitions (R1–R3)

Cada segmento emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está certificado).

### R1 · Detect / Decide

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El criterio de activación de rollback está definido y verificable? |
| **Ancla** | `release-deploy-pass` · tip certificado · checklist de decisión documentado |
| **Incluye** | Verificación de precondiciones de recuperación (sin ejecutar restore) |
| **No incluye** | Execute restore · post-verify · Deploy · cambios de dominio |
| **Evidencia** | `RELEASE_ROLLBACK_R1_STARTED` · `RELEASE_ROLLBACK_R1_COMPLETED` |
| **PASS** | Decisión operable como puerta de entrada a R2 |
| **FAIL** | Criterio ausente · tip / tag ancla ausente · secreto en evidencia |
| **Entrega** | RELEASE-ROLLBACK-001 |

### R2 · Execute Rollback / Restore

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La recuperación / restore reproducible se completa según el procedimiento congelado? |
| **Ancla** | Outcome de R1 · procedimiento de rollback documentado en Runner (futuro) |
| **Incluye** | Ejecución del restore canónico (sin inventar producto) |
| **No incluye** | Post-verify profundo · Deploy nuevo · CI ad-hoc no contratado |
| **Evidencia** | `RELEASE_ROLLBACK_R2_STARTED` · `RELEASE_ROLLBACK_R2_COMPLETED` |
| **PASS** | Recuperación aplicada consumible por R3 |
| **FAIL** | Restore incompleto · procedimiento saltado · estado inventado |
| **Entrega** | RELEASE-ROLLBACK-002 |

### R3 · Post-rollback Verify

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Tras recuperar, la verificación mínima confirma superficie operable? |
| **Ancla** | Outcome de R2 · verificación mínima (no re-ejecuta E2E / Deploy completo) |
| **Incluye** | Checks post-rollback canónicos definidos por el Runner |
| **No incluye** | Reabrir jornada E2E · Playwright suite · Deploy |
| **Evidencia** | `RELEASE_ROLLBACK_R3_STARTED` · `RELEASE_ROLLBACK_R3_COMPLETED` |
| **PASS** | Rollback FULL PASS · listo para abrir ciclo RELEASE-01-BETA |
| **FAIL** | Verificación rota · superficie no operable · tokens inválidos |
| **Entrega** | RELEASE-ROLLBACK-003 |

### Orden de transición (inmutable)

```text
R1
 ↓
R2
 ↓
R3
```

Prohibido saltar, reordenar o completar Rₙ₊₁ sin Rₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_ROLLBACK_R1_STARTED
RELEASE_ROLLBACK_R1_COMPLETED
RELEASE_ROLLBACK_R2_STARTED
RELEASE_ROLLBACK_R2_COMPLETED
RELEASE_ROLLBACK_R3_STARTED
RELEASE_ROLLBACK_R3_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto R1 → R3  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El Runner (PR posterior) documentará el mapeo a checks reales en `RELEASE_ROLLBACK_RUNNER.md`

---

## 5. Canonical PASS contract

**FULL PASS** solo si la secuencia completa se observa:

```text
R1 → R2 → R3
```

con:

```text
duplicates=[]
missing=[]
out_of_order=[]
blocked_at=—
certified_through=R3
```

PASS parcial (entrega `RELEASE-ROLLBACK-00n`):

```text
PASS through Rn
blocked_at=RELEASE_ROLLBACK_R{n+1}_STARTED   (si n < 3)
blocked_at=—                                 (si n = 3 · FULL PASS)
duplicates=[]
missing=[]
out_of_order=[]
```

Tag `release-rollback-pass` solo tras FULL PASS verificado **desde `main`** + acta.

---

## 6. Canonical BLOCKED contract

El runner debe detenerse exactamente en la **primera** capacidad ausente.

Baseline (tras Runner en `main` · **no** este PR):

```text
RELEASE-ROLLBACK
BLOCKED
blocked_at=RELEASE_ROLLBACK_R1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED).  
**BLOCKED no es defecto.**

| Observado | Resultado |
|-----------|-----------|
| R1 completo · sin R2 | PASS through R1 · BLOCKED at `RELEASE_ROLLBACK_R2_STARTED` |
| R1–R2 · sin R3 | PASS through R2 · BLOCKED at `RELEASE_ROLLBACK_R3_STARTED` |
| Pipeline vacío | BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` |

---

## 7. Canonical evidence

| Regla | Contrato |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) |
| Forma | Tokens `RELEASE_ROLLBACK_R*_STARTED\|COMPLETED` en orden |
| Entrega | Una capacidad / PR: `RELEASE-ROLLBACK-001`…`003` |
| Acta path (futuro) | `docs/10-validation/release-rollback/` |
| Close-out | `RELEASE_ROLLBACK_PASS_ACTA.md` + tag `release-rollback-pass` |
| Prohibido | Secretos · pantallas como PASS · fabricar tokens sin ancla documentada |

Este Spec **no** crea evidencias ejecutables ni runners.

---

## 8. Required invariants

| ID | Invariante |
|----|------------|
| R-I1 | **Gate discipline** — no abrir ROLLBACK-001 sin Spec FROZEN + Runner BLOCKED desde `main` |
| R-I2 | **No renegotiate priors** — no modificar contratos de `release-deploy-pass` · E2E · Smoke · FLOW-01…04 |
| R-I3 | **No invented product** — Rollback no inventa dominio ni reabre jornada E2E/Deploy |
| R-I4 | **Ordering + once-only** — tokens en orden · sin duplicates |
| R-I5 | **No skipped capability** — prohibido emitir Rₙ₊₁ sin Rₙ `COMPLETED` |
| R-I6 | **No invented evidence** — prohibido fabricar tokens sin procedimiento / ancla documentada |
| R-I7 | **No secrets in evidence** — actas y JSON sin secretos ni credenciales |
| R-I8 | **Complements not replaces** — Rollback no sustituye Deploy / Smoke / Cross-flow / E2E |
| R-I9 | **Out of band** — FLOW-05 · `release-01-beta` fuera hasta sus propios gates |

R-I1–I5 no se eliminan sin acta de renegociación. R-I6–I9 son parte del Freeze.

---

## 9. Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · recovery coherente |
| **FAIL** | Contrato roto (orden / duplicates / invariante / restore inválido) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

---

## 10. Out of scope (este Spec · este PR)

```text
❌ Runner · scripts · package.json · comandos npm · tests · CI · Actions
❌ Infraestructura · secretos · implementación de restore
❌ FLOW-05 · release-01-beta
❌ Abrir RELEASE-ROLLBACK-001
```

El repositorio permanece **no funcional** para RELEASE-ROLLBACK hasta el Runner PR.

---

## 11. Gate · RELEASE-ROLLBACK-001 CLOSED

`RELEASE-ROLLBACK-001` (R1 Detect/Decide) **permanece CLOSED** hasta:

| # | Condición |
|---|-----------|
| 1 | Este Spec mergeado en `main` → **FROZEN** |
| 2 | Runner mergeado en `main` (`RELEASE_ROLLBACK_RUNNER.md` + executable) |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_ROLLBACK_R1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_ROLLBACK_R*` sin renegociación abierta |

Hasta entonces: **prohibido** automatización de certificación · drivers Rollback · FLOW-05 · `release-01-beta`.

---

## 12. Naming (documental)

```text
docs/00-status/RELEASE_ROLLBACK_DOR.md       ✅
docs/00-status/RELEASE_ROLLBACK_SPEC.md      ← este documento

docs/10-validation/release-rollback/         ← tras Freeze / Runner
  RELEASE_ROLLBACK_RUNNER.md
  RELEASE_ROLLBACK_GATE.md
  RELEASE_ROLLBACK_001_R1_ACTA.md …
  RELEASE_ROLLBACK_PASS_ACTA.md
  evidence/

tag (futuro): release-rollback-pass
```

---

## 13. Ready / Freeze status

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena R1–R3 | ✅ |
| Tokens · Transitions · Evidence | ✅ |
| PASS · BLOCKED · Invariants | ✅ |
| Out of scope · Gate CLOSED until Runner | ✅ |
| Spec READY FOR FREEZE | ✅ #208 |
| Spec FROZEN | ✅ #208 · `4d109f7` · Land Check docs |
| Runner BLOCKED at R1 | ⏳ READY TO OPEN |
| RELEASE-ROLLBACK-001 | ⛔ CLOSED |

**Estado del documento:** ✅ **FROZEN**

---

## 14. Next

```text
READY TO OPEN
RELEASE-ROLLBACK Runner
(BLOCKED at RELEASE_ROLLBACK_R1_STARTED · exit 2)
    ↓
Gate READY → 001…003 → release-rollback-pass
```

**No** Rollback-001 · FLOW-05 · `release-01-beta` en el Runner PR.

---

## End of RELEASE ROLLBACK Spec
