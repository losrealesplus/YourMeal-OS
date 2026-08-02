# RELEASE-01 · B-04 · Deploy · Specification

**Documento:** `RELEASE_DEPLOY_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FROZEN** · ciclo B-04 **COMPLETE** · tag `release-deploy-pass` → `7896a2a` · [PASS](../10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md)  
**Gate DoRl:** Deployment · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow nuevo  
**DoR:** [RELEASE_DEPLOY_DOR](./RELEASE_DEPLOY_DOR.md) ✅ en `main` (#197 · `e5bd8c5`)  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass` · `release-smoke-pass` · `release-crossflow-pass` · `release-e2e-pass` → `73623ae`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags:** `release-deploy-pass` → … → `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Este PR responde **solo**:  
> ¿Qué debe certificar exactamente RELEASE-DEPLOY antes de considerar el despliegue  
> reproducible y listo para Rollback?  
> **No** Runner. **No** scripts. **No** `package.json`. **No** comandos npm.  
> **No** tests. **No** CI. **No** GitHub Actions. **No** infraestructura.  
> **No** implementación de deploy. **No** Rollback. **No** FLOW-05. **No** `release-01-beta`.

---

## 1. Goal

> ¿Qué debe certificar RELEASE-DEPLOY antes de considerar el despliegue  
> reproducible y listo para el ciclo Rollback?

RELEASE-DEPLOY certifica que la **plataforma ya validada**  
(`release-e2e-pass` y predecesores) puede **publicarse de forma reproducible**  
con evidencia `RELEASE_DEPLOY_*` verificable desde `main`.

No: *¿Smoke / Cross-flow / E2E siguen PASS?* (ya lo certifican sus tags `-pass`)  
No: *¿podemos recuperar un fallo de publicación?* (eso es RELEASE-ROLLBACK)  
Sí: *¿existe un contrato de despliegue repetible de lo ya certificado, sin inventar producto?*

---

## 2. Scope

### Dentro (v1 · congelado por este Spec)

| Incluye | Notas |
|---------|-------|
| Cadena canónica D1 → D2 → D3 | Preflight → Publish/Apply → Post-deploy verify |
| Tokens `RELEASE_DEPLOY_D*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Ancla a plataforma certificada (`release-e2e-pass`+) | No reabrir Specs FROZEN de producto |
| Land Check desde `main` (Regla 9) | Solo `main` certifica |
| Una capacidad / entrega `RELEASE-DEPLOY-001`…`003` | Tras Gate READY |

### Cadena canónica

```text
D1  Deploy Preflight
    (anchor: release-e2e-pass + artefacto / entorno mínimo documentado)
  ↓
D2  Publish / Apply
    (anchor: procedimiento de publicación reproducible)
  ↓
D3  Post-deploy Verify
    (anchor: verificación mínima post-publicación · no reabre E2E)
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Runner · scripts · `package.json` · comandos npm · tests · CI · Actions | PR Runner / impl posteriores |
| Infraestructura nueva · secretos · credenciales en actas | Fuera de contrato Spec |
| Implementación de dominio · migraciones de producto · UI | Evidence before Implementation |
| Rollback | B-05 |
| `release-01-beta` | B-06 · DoRl PASS completo |
| FLOW-05+ | Track A; solo si Track B lo bloquea |
| Renegociar `release-e2e-pass` / Smoke / Cross-flow / FLOW-01…04 | Solo regresión con evidencia |
| Sustituir Smoke / Cross-flow / E2E | Deploy **publica**, no re-certifica jornada |

---

## 3. Canonical transitions (D1–D3)

Cada segmento emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está certificado).

### D1 · Deploy Preflight

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El entorno / artefacto mínimo para publicar está definido y verificable? |
| **Ancla** | `release-e2e-pass` · tip certificado · checklist de preflight documentado |
| **Incluye** | Verificación de precondiciones de publicación (sin ejecutar deploy) |
| **No incluye** | Publish · post-verify · Rollback · cambios de dominio |
| **Evidencia** | `RELEASE_DEPLOY_D1_STARTED` · `RELEASE_DEPLOY_D1_COMPLETED` |
| **PASS** | Preflight operable como puerta de entrada a D2 |
| **FAIL** | Precondiciones rotas · tip / tag ancla ausente · secreto en evidencia |
| **Entrega** | RELEASE-DEPLOY-001 |

### D2 · Publish / Apply

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La publicación / apply reproducible se completa según el procedimiento congelado? |
| **Ancla** | Outcome de D1 · procedimiento de publish documentado en Runner (futuro) |
| **Incluye** | Ejecución del publish/apply canónico (sin inventar producto) |
| **No incluye** | Post-verify profundo · Rollback · CI ad-hoc no contratado |
| **Evidencia** | `RELEASE_DEPLOY_D2_STARTED` · `RELEASE_DEPLOY_D2_COMPLETED` |
| **PASS** | Publicación aplicada consumible por D3 |
| **FAIL** | Publish incompleto · procedimiento saltado · estado inventado |
| **Entrega** | RELEASE-DEPLOY-002 |

### D3 · Post-deploy Verify

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Tras publicar, la verificación mínima confirma superficie operable? |
| **Ancla** | Outcome de D2 · verificación mínima (no re-ejecuta E2E completo) |
| **Incluye** | Checks post-deploy canónicos definidos por el Runner |
| **No incluye** | Reabrir jornada E2E · Playwright suite · Rollback |
| **Evidencia** | `RELEASE_DEPLOY_D3_STARTED` · `RELEASE_DEPLOY_D3_COMPLETED` |
| **PASS** | Deploy FULL PASS · listo para abrir ciclo Rollback |
| **FAIL** | Verificación rota · superficie no operable · tokens inválidos |
| **Entrega** | RELEASE-DEPLOY-003 |

### Orden de transición (inmutable)

```text
D1
 ↓
D2
 ↓
D3
```

Prohibido saltar, reordenar o completar Dₙ₊₁ sin Dₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_DEPLOY_D1_STARTED
RELEASE_DEPLOY_D1_COMPLETED
RELEASE_DEPLOY_D2_STARTED
RELEASE_DEPLOY_D2_COMPLETED
RELEASE_DEPLOY_D3_STARTED
RELEASE_DEPLOY_D3_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto D1 → D3  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El Runner (PR posterior) documentará el mapeo a checks reales en `RELEASE_DEPLOY_RUNNER.md`

---

## 5. Canonical PASS contract

**FULL PASS** solo si la secuencia completa se observa:

```text
D1 → D2 → D3
```

con:

```text
duplicates=[]
missing=[]
out_of_order=[]
blocked_at=—
certified_through=D3
```

PASS parcial (entrega `RELEASE-DEPLOY-00n`):

```text
PASS through Dn
blocked_at=RELEASE_DEPLOY_D{n+1}_STARTED   (si n < 3)
blocked_at=—                               (si n = 3 · FULL PASS)
duplicates=[]
missing=[]
out_of_order=[]
```

Tag `release-deploy-pass` solo tras FULL PASS verificado **desde `main`** + acta.

---

## 6. Canonical BLOCKED contract

El runner debe detenerse exactamente en la **primera** capacidad ausente.

Baseline (tras Runner en `main` · **no** este PR):

```text
RELEASE-DEPLOY
BLOCKED
blocked_at=RELEASE_DEPLOY_D1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED).  
**BLOCKED no es defecto.**

| Observado | Resultado |
|-----------|-----------|
| D1 completo · sin D2 | PASS through D1 · BLOCKED at `RELEASE_DEPLOY_D2_STARTED` |
| D1–D2 · sin D3 | PASS through D2 · BLOCKED at `RELEASE_DEPLOY_D3_STARTED` |
| Pipeline vacío | BLOCKED at `RELEASE_DEPLOY_D1_STARTED` |

---

## 7. Canonical evidence

| Regla | Contrato |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) |
| Forma | Tokens `RELEASE_DEPLOY_D*_STARTED\|COMPLETED` en orden |
| Entrega | Una capacidad / PR: `RELEASE-DEPLOY-001`…`003` |
| Acta path (futuro) | `docs/10-validation/release-deploy/` |
| Close-out | `RELEASE_DEPLOY_PASS_ACTA.md` + tag `release-deploy-pass` |
| Prohibido | Secretos · pantallas como PASS · fabricar tokens sin ancla documentada |

Este Spec **no** crea evidencias ejecutables ni runners.

---

## 8. Required invariants

| ID | Invariante |
|----|------------|
| D-I1 | **Gate discipline** — no abrir DEPLOY-001 sin Spec FROZEN + Runner BLOCKED desde `main` |
| D-I2 | **No renegotiate priors** — no modificar contratos de `release-e2e-pass` · Smoke · Cross-flow · FLOW-01…04 |
| D-I3 | **No invented product** — Deploy no inventa dominio ni reabre jornada E2E |
| D-I4 | **Ordering + once-only** — tokens en orden · sin duplicates |
| D-I5 | **No skipped capability** — prohibido emitir Dₙ₊₁ sin Dₙ `COMPLETED` |
| D-I6 | **No invented evidence** — prohibido fabricar tokens sin procedimiento / ancla documentada |
| D-I7 | **No secrets in evidence** — actas y JSON sin secretos ni credenciales |
| D-I8 | **Complements not replaces** — Deploy no sustituye Smoke / Cross-flow / E2E |
| D-I9 | **Out of band** — Rollback · FLOW-05 · `release-01-beta` fuera hasta sus propios gates |

D-I1–I5 no se eliminan sin acta de renegociación. D-I6–I9 son parte del Freeze.

---

## 9. Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · deploy coherente |
| **FAIL** | Contrato roto (orden / duplicates / invariante / publish inválido) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

---

## 10. Out of scope (este Spec · este PR)

```text
❌ Runner · scripts · package.json · comandos npm · tests · CI · Actions
❌ Infraestructura · secretos · implementación de publish
❌ Rollback · FLOW-05 · release-01-beta
❌ Abrir RELEASE-DEPLOY-001
```

El repositorio permanece **no funcional** para RELEASE-DEPLOY hasta el Runner PR.

---

## 11. Gate · RELEASE-DEPLOY-001 CLOSED

`RELEASE-DEPLOY-001` (D1 Preflight) **permanece CLOSED** hasta:

| # | Condición |
|---|-----------|
| 1 | Este Spec mergeado en `main` → **FROZEN** |
| 2 | Runner mergeado en `main` (`RELEASE_DEPLOY_RUNNER.md` + executable) |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_DEPLOY_D1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_DEPLOY_D*` sin renegociación abierta |

Hasta entonces: **prohibido** automatización de certificación · drivers Deploy · Rollback · FLOW-05.

---

## 12. Naming (documental)

```text
docs/00-status/RELEASE_DEPLOY_DOR.md       ✅
docs/00-status/RELEASE_DEPLOY_SPEC.md      ← este documento

docs/10-validation/release-deploy/         ← tras Freeze / Runner
  RELEASE_DEPLOY_RUNNER.md
  RELEASE_DEPLOY_GATE.md
  RELEASE_DEPLOY_001_D1_ACTA.md …
  RELEASE_DEPLOY_PASS_ACTA.md
  evidence/

tag (futuro): release-deploy-pass
```

---

## 13. Ready / Freeze status

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena D1–D3 | ✅ |
| Tokens · Transitions · Evidence | ✅ |
| PASS · BLOCKED · Invariants | ✅ |
| Out of scope · Gate CLOSED until Runner | ✅ |
| Spec READY FOR FREEZE | ✅ #198 |
| Spec FROZEN | ✅ #198 · `ef447e2` · Land Check docs |
| Runner BLOCKED at D1 | ✅ CERTIFIED #200 · `1008ffd` |
| Gate READY | ✅ #201 · Land Check from main |
| RELEASE-DEPLOY-001 | ✅ CERTIFIED #202 · `a0daf82` |
| RELEASE-DEPLOY-002 | ✅ CERTIFIED #204 · `28ddb83` |
| RELEASE-DEPLOY-003 | ✅ CERTIFIED #206 · `7896a2a` |
| Tag `release-deploy-pass` | ✅ → `7896a2a` |

**Estado del documento:** ✅ **FROZEN** · ciclo **COMPLETE**

---

## 14. Next

```text
READY TO OPEN
RELEASE-ROLLBACK DoR
Documentation only.
→ ./RELEASE_ROLLBACK_DOR.md
```

**No** Spec · Runner · impl · FLOW-05 · `release-01-beta` en el DoR Rollback.

---

## End of RELEASE DEPLOY Spec
