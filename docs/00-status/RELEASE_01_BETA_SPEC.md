# RELEASE-01 · B-06 · Beta Acceptance · Specification

**Documento:** `RELEASE_01_BETA_SPEC.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **FROZEN** (Spec · #218 · `ed98b3b`) · DoR ✅ (#217) · Runner ✅ #219 · Gate ✅ #220 · B1 ✅ #222 · 002 ▶ B2  
**Gate DoRl:** Beta Acceptance · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow nuevo · **no** inventa capacidades  
**DoR:** [RELEASE_01_BETA_DOR](./RELEASE_01_BETA_DOR.md) ✅ en `main` (#217 · `740b843`)  
**Runner:** [RELEASE_01_BETA_RUNNER](../10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md) ✅ #219 · `3994833`  
**001:** [RELEASE_01_BETA_001_B1_ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md) ✅ CERTIFIED #222  
**002:** [RELEASE_01_BETA_002_B2_ACTA](../10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md)  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass` · `release-smoke-pass` · `release-crossflow-pass` · `release-e2e-pass` · `release-deploy-pass` · `release-rollback-pass` → `0ba856e`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags:** `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Contrato FROZEN. 002 ▶ B2 Canonical Flows (este PR).  
> **No** B3–B5 · FLOW-05 · tag.

---

## 1. Goal

> ¿Qué debe demostrar YourMeal OS para que la primera Beta pueda considerarse certificada?

RELEASE-01-BETA certifica que el **producto como conjunto** — ya validado por  
Foundation · PS-002C · FLOW-01…04 · Smoke · Cross-flow · E2E · Deploy · Rollback —  
puede **aceptarse como primera beta funcional** con evidencia `RELEASE_01_BETA_*`  
verificable desde `main`.

No: *¿podemos certificar un Flow más?* (eso es Track A / FLOW-05)  
No: *¿Smoke / Deploy / Rollback siguen PASS?* (ya lo certifican sus tags `-pass`)  
Sí: *¿el sistema completo es aceptable como beta sin inventar capacidades nuevas?*

La Beta **compone** evidencia ya certificada. **No** introduce capacidades paralelas.

---

## 2. Scope

### Dentro (v1 · congelado por este Spec)

| Incluye | Notas |
|---------|-------|
| Cadena canónica B1 → B2 → B3 → B4 → B5 | Foundation → Flows → Platform → Release Stack → Acceptance |
| Tokens `RELEASE_01_BETA_B*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Anclas a tags `-pass` ya publicados | No reabrir Specs FROZEN de producto |
| Land Check desde `main` (Regla 9) | Solo `main` certifica · `git fetch --tags --prune` |
| Una capacidad / entrega `RELEASE-01-BETA-001`…`005` | Tras Gate READY |

### Cadena canónica

```text
B1  Foundation
    (anchors: Foundation locks · PS-002C · ps002c-pass)
  ↓
B2  Canonical Flows
    (anchors: flow01-pass · flow02-pass · flow03-pass · flow04-pass)
  ↓
B3  Platform Capabilities
    (anchors: release-smoke-pass · release-crossflow-pass · release-e2e-pass)
  ↓
B4  Release Stack
    (anchors: release-deploy-pass · release-rollback-pass)
  ↓
B5  Beta Acceptance
    (anchor: acceptance mínima del producto como conjunto → tag release-01-beta)
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Runner · scripts · `package.json` · comandos npm · tests · CI · Actions | PR Runner / impl posteriores |
| Infraestructura nueva · secretos · credenciales en actas | Fuera de contrato Spec |
| Implementación de dominio · migraciones · UI · Playwright | Evidence before Implementation |
| Reabrir / renegociar Smoke · Cross-flow · E2E · Deploy · Rollback | Beta **acepta**, no re-certifica jornada |
| FLOW-05+ | Track A · CLOSED hasta `release-01-beta` |
| Despliegue de producción · release semver `v*` | Fuera de B-06 Acceptance |
| Capacidades de producto nuevas | Beta no inventa features |

---

## 3. Canonical transitions (B1–B5)

Cada segmento emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está certificado).

### B1 · Foundation

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La base de plataforma (Foundation · Identity · Operational Core · PS-002C) permanece certificada como ancla de la beta? |
| **Ancla** | Platform / foundation locks · `ps002c-pass` |
| **Incluye** | Verificación documental de precondiciones de foundation (sin reabrir PS) |
| **No incluye** | Nuevos locks · migraciones · UI · FLOW-05 |
| **Evidencia** | `RELEASE_01_BETA_B1_STARTED` · `RELEASE_01_BETA_B1_COMPLETED` |
| **PASS** | Foundation operable como puerta de entrada a B2 |
| **FAIL** | Ancla ausente · tip / tag `ps002c-pass` ausente · secreto en evidencia |
| **Entrega** | RELEASE-01-BETA-001 |

### B2 · Canonical Flows

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿FLOW-01…04 permanecen certificados como jornada de dominio canónica de la beta? |
| **Ancla** | `flow01-pass` · `flow02-pass` · `flow03-pass` · `flow04-pass` |
| **Incluye** | Verificación de presencia de tags / actas de los cuatro Flows |
| **No incluye** | FLOW-05 · nuevos Flows · re-ejecución de runners de Flow |
| **Evidencia** | `RELEASE_01_BETA_B2_STARTED` · `RELEASE_01_BETA_B2_COMPLETED` |
| **PASS** | Cadena Flow-01…04 consumible por B3 |
| **FAIL** | Tag Flow ausente · acta renegociada · orden inventado |
| **Entrega** | RELEASE-01-BETA-002 |

### B3 · Platform Capabilities

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Smoke · Cross-flow · E2E permanecen certificados como capacidades de plataforma de la beta? |
| **Ancla** | `release-smoke-pass` · `release-crossflow-pass` · `release-e2e-pass` |
| **Incluye** | Verificación de tags / PASS actas de B-01…B-03 Track B |
| **No incluye** | Reabrir E2E / Playwright · inventar smoke checks |
| **Evidencia** | `RELEASE_01_BETA_B3_STARTED` · `RELEASE_01_BETA_B3_COMPLETED` |
| **PASS** | Capacidades de plataforma consumibles por B4 |
| **FAIL** | Tag plataforma ausente · evidencia inventada |
| **Entrega** | RELEASE-01-BETA-003 |

### B4 · Release Stack

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Deploy · Rollback permanecen certificados como pila de publicación / recuperación de la beta? |
| **Ancla** | `release-deploy-pass` · `release-rollback-pass` |
| **Incluye** | Verificación de tags / PASS actas de Deploy y Rollback |
| **No incluye** | Nuevo deploy · restore remoto · infra · secretos |
| **Evidencia** | `RELEASE_01_BETA_B4_STARTED` · `RELEASE_01_BETA_B4_COMPLETED` |
| **PASS** | Release stack consumible por B5 |
| **FAIL** | Tag Deploy/Rollback ausente · procedimiento inventado |
| **Entrega** | RELEASE-01-BETA-004 |

### B5 · Beta Acceptance

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La evidencia mínima de acceptance confirma la beta como conjunto? |
| **Ancla** | Outcome B1–B4 · checklist de acceptance documentado por el Runner (futuro) |
| **Incluye** | Checks de acceptance canónicos (sin inventar producto) |
| **No incluye** | FLOW-05 · producción · semver `v*` · marketing readiness |
| **Evidencia** | `RELEASE_01_BETA_B5_STARTED` · `RELEASE_01_BETA_B5_COMPLETED` |
| **PASS** | Beta FULL PASS · listo para tag `release-01-beta` |
| **FAIL** | Acceptance incompleta · tokens inválidos · anclas rotas |
| **Entrega** | RELEASE-01-BETA-005 |

### Orden de transición (inmutable)

```text
B1
 ↓
B2
 ↓
B3
 ↓
B4
 ↓
B5
```

Prohibido saltar, reordenar o completar Bₙ₊₁ sin Bₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_01_BETA_B1_STARTED
RELEASE_01_BETA_B1_COMPLETED
RELEASE_01_BETA_B2_STARTED
RELEASE_01_BETA_B2_COMPLETED
RELEASE_01_BETA_B3_STARTED
RELEASE_01_BETA_B3_COMPLETED
RELEASE_01_BETA_B4_STARTED
RELEASE_01_BETA_B4_COMPLETED
RELEASE_01_BETA_B5_STARTED
RELEASE_01_BETA_B5_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto B1 → B5  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El Runner (PR posterior) documentará el mapeo a checks reales en `RELEASE_01_BETA_RUNNER.md`

---

## 5. Canonical PASS contract

**FULL PASS** solo si la secuencia completa se observa:

```text
B1 → B2 → B3 → B4 → B5
```

con:

```text
duplicates=[]
missing=[]
out_of_order=[]
blocked_at=—
certified_through=B5
```

PASS parcial (entrega `RELEASE-01-BETA-00n`):

```text
PASS through Bn
blocked_at=RELEASE_01_BETA_B{n+1}_STARTED   (si n < 5)
blocked_at=—                                 (si n = 5 · FULL PASS)
duplicates=[]
missing=[]
out_of_order=[]
```

Tag `release-01-beta` solo tras FULL PASS verificado **desde `main`** + acta.

---

## 6. Canonical BLOCKED contract

El runner debe detenerse exactamente en la **primera** capacidad ausente.

Baseline (tras Runner en `main` · **no** este PR):

```text
RELEASE-01-BETA
BLOCKED
blocked_at=RELEASE_01_BETA_B1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED).  
**BLOCKED no es defecto.**

| Observado | Resultado |
|-----------|-----------|
| B1 completo · sin B2 | PASS through B1 · BLOCKED at `RELEASE_01_BETA_B2_STARTED` |
| B1–B2 · sin B3 | PASS through B2 · BLOCKED at `RELEASE_01_BETA_B3_STARTED` |
| B1–B3 · sin B4 | PASS through B3 · BLOCKED at `RELEASE_01_BETA_B4_STARTED` |
| B1–B4 · sin B5 | PASS through B4 · BLOCKED at `RELEASE_01_BETA_B5_STARTED` |
| Pipeline vacío | BLOCKED at `RELEASE_01_BETA_B1_STARTED` |

---

## 7. Canonical evidence

| Regla | Contrato |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) |
| Pre-Land Check | `git pull origin main` · `git fetch --tags --prune` |
| Forma | Tokens `RELEASE_01_BETA_B*_STARTED\|COMPLETED` en orden |
| Entrega | Una capacidad / PR: `RELEASE-01-BETA-001`…`005` |
| Acta path (futuro) | `docs/10-validation/release-01-beta/` |
| Close-out | PASS acta + tag `release-01-beta` |
| Prohibido | Secretos · pantallas como PASS · fabricar tokens sin ancla `-pass` |

Este Spec **no** crea evidencias ejecutables ni runners.

---

## 8. Required invariants

| ID | Invariante |
|----|------------|
| β-I1 | **Gate discipline** — no abrir BETA-001 sin Spec FROZEN + Runner BLOCKED desde `main` |
| β-I2 | **No renegotiate priors** — no modificar contratos de tags `-pass` previos (Flows · Smoke…Rollback) |
| β-I3 | **No invented product** — Beta no inventa dominio ni abre FLOW-05 |
| β-I4 | **Ordering + once-only** — tokens en orden · sin duplicates |
| β-I5 | **No skipped capability** — prohibido emitir Bₙ₊₁ sin Bₙ `COMPLETED` |
| β-I6 | **No invented evidence** — prohibido fabricar tokens sin ancla `-pass` / acta |
| β-I7 | **No secrets in evidence** — actas y JSON sin secretos ni credenciales |
| β-I8 | **Composes not replaces** — Beta no sustituye Smoke · Cross-flow · E2E · Deploy · Rollback |
| β-I9 | **Out of band** — FLOW-05 · producción · `v*` semver fuera hasta sus propios gates |

β-I1–I5 no se eliminan sin acta de renegociación. β-I6–I9 son parte del Freeze.

---

## 9. Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · anclas `-pass` coherentes |
| **FAIL** | Contrato roto (orden / duplicates / invariante / ancla ausente) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

---

## 10. Out of scope (este Spec · este PR)

```text
❌ Runner · scripts · package.json · comandos npm · tests · CI · Actions
❌ Infraestructura · secretos · implementación de dominio
❌ FLOW-05 · Playwright · Deploy/Rollback ejecutables
❌ Abrir RELEASE-01-BETA-001
```

El repositorio permanece **no funcional** para RELEASE-01-BETA hasta el Runner PR.

---

## 11. Gate · RELEASE-01-BETA-001 CLOSED

`RELEASE-01-BETA-001` (B1 Foundation) **permanece CLOSED** hasta:

| # | Condición |
|---|-----------|
| 1 | Este Spec mergeado en `main` → **FROZEN** |
| 2 | Runner mergeado en `main` (`RELEASE_01_BETA_RUNNER.md` + executable) |
| 3 | Desde `main`: runner → BLOCKED at `RELEASE_01_BETA_B1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `RELEASE_01_BETA_B*` sin renegociación abierta |

Hasta entonces: **prohibido** automatización de certificación · drivers Beta · FLOW-05 · tag `release-01-beta`.

---

## 12. Naming (documental)

```text
docs/00-status/RELEASE_01_BETA_DOR.md        ✅
docs/00-status/RELEASE_01_BETA_SPEC.md       ← este documento

docs/10-validation/release-01-beta/          ← tras Freeze / Runner
  RELEASE_01_BETA_RUNNER.md
  RELEASE_01_BETA_GATE.md
  RELEASE_01_BETA_001_B1_ACTA.md …
  RELEASE_01_BETA_PASS_ACTA.md
  evidence/

tag (futuro): release-01-beta
```

---

## 13. Ready / Freeze status

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena B1–B5 | ✅ |
| Tokens · Transitions · Evidence | ✅ |
| PASS · BLOCKED · Invariants | ✅ |
| Out of scope · Gate CLOSED until Runner | ✅ |
| Spec READY FOR FREEZE | ✅ #218 |
| Spec FROZEN | ✅ #218 · `ed98b3b` |
| Runner BLOCKED at B1 | ✅ #219 · `3994833` |
| Gate READY | ✅ #220 |
| RELEASE-01-BETA-001 | ✅ CERTIFIED #222 |
| RELEASE-01-BETA-002 | ▶ este PR (B2 only) |

**Estado del documento:** ✅ **FROZEN**

---

## 14. Next

```text
Land Check 002 from main
    ↓
READY TO OPEN RELEASE-01-BETA-003 (B3 only)
```

**No** B3–B5 in 002 · FLOW-05 · tag hasta FULL PASS.

---

## End of RELEASE-01-BETA Spec
