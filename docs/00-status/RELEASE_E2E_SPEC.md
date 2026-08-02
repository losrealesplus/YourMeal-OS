# RELEASE-01 · B-03 · E2E · Specification

**Documento:** `RELEASE_E2E_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FROZEN** (Spec · #186 · `6d11ae8`) · Runner ⏳ READY TO OPEN  
**Gate DoRl:** E2E Tests · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow nuevo  
**DoR:** [RELEASE_E2E_DOR](./RELEASE_E2E_DOR.md) ✅ en `main` (#185 · `48e0c5c`)  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass` · `release-smoke-pass` · `release-crossflow-pass`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags:** `release-e2e-pass` → … → `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Este PR responde **solo**:  
> ¿Qué debe certificar exactamente RELEASE-E2E antes de considerar la Release  
> operativamente completa?  
> **No** Runner. **No** scripts. **No** `package.json`. **No** comandos npm.  
> **No** Playwright. **No** tests. **No** CI. **No** dominio. **No** UI.  
> **No** Deploy. **No** Rollback. **No** FLOW-05. **No** implementación.

---

## 1. Goal

> ¿Qué debe certificar RELEASE-E2E antes de considerar la Release operativamente completa?

RELEASE-E2E certifica que la **plataforma como un todo** sostiene una jornada piloto  
mínima de extremo a extremo — entrada de plataforma + cadena operativa ya anclada  
por Smoke y Cross-flow — con evidencia `RELEASE_E2E_*` reproducible.

No: *¿Smoke / Cross-flow / cada Flow sigue PASS?* (ya lo certifican sus tags `-pass`)  
No: *¿solo arranca la plataforma?* (eso es RELEASE-SMOKE)  
No: *¿solo encadenan handoffs entre Flows?* (eso es RELEASE-CROSSFLOW)  
Sí: *¿la jornada E1→E4 completa demuestra la plataforma lista para seguir hacia Deploy / Rollback / beta?*

---

## 2. Scope

### Dentro (v1 · congelado por este Spec)

| Incluye | Notas |
|---------|-------|
| Cadena canónica E1 → E2 → E3 → E4 | Anclas ya certificadas; sin estados nuevos |
| Tokens `RELEASE_E2E_E*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Reutilizar Outcomes / capacidades de Smoke + Cross-flow + FLOW-01…04 | No reabrir Specs FROZEN |
| Land Check desde `main` (Regla 9) | Solo `main` certifica |
| Una capacidad / entrega `RELEASE-E2E-001`…`004` | Tras Gate READY |

### Cadena canónica

```text
E1  Platform Entry
    (anchor: RELEASE-SMOKE · release-smoke-pass)
  ↓
E2  Order → Delivery
    (anchor: FLOW-01 / CROSSFLOW C1 · flow01-pass)
  ↓
E3  Incident → Billing
    (anchor: FLOW-02 + FLOW-03 / C2 + C3 · flow02-pass · flow03-pass)
  ↓
E4  Inventory → Operational Close
    (anchor: FLOW-04 / CROSSFLOW C4 · flow04-pass)
```

Cadena de producto subyacente (ya establecida; no se reinventan estados):

```text
Pedido → Producción → Packaging → Entrega
  → Incidencia → Facturación → Inventario → Cierre
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Runner · scripts · `package.json` · comandos npm · tests · CI | PR Runner / impl posteriores |
| Playwright · browser automation · UI · servicios · repositorios | Fuera de contrato Spec |
| Implementación de dominio · migraciones · Supabase | Evidence before Implementation |
| Deploy · Rollback | B-04 · B-05 |
| `release-01-beta` | B-06 · DoRl PASS completo |
| FLOW-05+ | Track A; solo si Track B lo bloquea |
| Renegociar `flowNN-pass` / `release-smoke-pass` / `release-crossflow-pass` | Solo regresión con evidencia |
| Sustituir Smoke o Cross-flow | E2E **complementa**, no sustituye |

---

## 3. Canonical transitions (E1–E4)

Cada segmento emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está certificado).

### E1 · Platform Entry

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La entrada de plataforma admite la jornada (sesión → rol → dashboard)? |
| **Ancla** | RELEASE-SMOKE (`release-smoke-pass`) · S1…S4 |
| **Incluye** | Preflight → Auth → Bootstrap → Dashboard según Spec Smoke FROZEN |
| **No incluye** | Cadena de negocio (E2+) · Deploy · UI exploratoria |
| **Evidencia** | `RELEASE_E2E_E1_STARTED` · `RELEASE_E2E_E1_COMPLETED` |
| **PASS** | Plataforma operable como puerta de entrada a E2 |
| **FAIL** | Entrada rota · tokens inválidos · renegociación de Smoke |
| **Entrega** | RELEASE-E2E-001 |

### E2 · Order → Delivery

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Pedido / producción llega a una entrega operable? |
| **Ancla** | FLOW-01 / CROSSFLOW C1 (`flow01-pass`) · consume Outcome de E1 |
| **Incluye** | Handoff Kitchen → Packaging → Delivery según Spec FLOW-01 / C1 |
| **No incluye** | Incidencias (E3) · facturación · inventario (E4) |
| **Evidencia** | `RELEASE_E2E_E2_STARTED` · `RELEASE_E2E_E2_COMPLETED` |
| **PASS** | Entrega operable consumible por E3 |
| **FAIL** | Handoff roto · estado inventado · tokens inválidos |
| **Entrega** | RELEASE-E2E-002 |

### E3 · Incident → Billing

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Una incidencia de entrega queda operable hasta facturación cobrada? |
| **Ancla** | FLOW-02 + FLOW-03 / CROSSFLOW C2 + C3 (`flow02-pass` · `flow03-pass`) · consume Outcome de E2 |
| **Incluye** | Incidencia → recuperación / delivered → billing según Specs FLOW-02…03 / C2…C3 |
| **No incluye** | Consumo de inventario (E4) · FLOW-05 |
| **Evidencia** | `RELEASE_E2E_E3_STARTED` · `RELEASE_E2E_E3_COMPLETED` |
| **PASS** | Factura en estado terminal cobrado / `paid` (Spec FLOW-03) lista para E4 |
| **FAIL** | Incidencia no recuperable · billing incompleto · handoff E2→E3 inválido |
| **Entrega** | RELEASE-E2E-003 |

### E4 · Inventory → Operational Close

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿El inventario queda sellado y la jornada operativa cierra de forma trazable? |
| **Ancla** | FLOW-04 / CROSSFLOW C4 (`flow04-pass`) · alineado a la cadena |
| **Incluye** | Consumo `planned → applied → sealed` según Spec FLOW-04 / C4 · cierre de jornada E2E |
| **No incluye** | Purchasing · Deploy · Rollback · FLOW-05 |
| **Evidencia** | `RELEASE_E2E_E4_STARTED` · `RELEASE_E2E_E4_COMPLETED` |
| **PASS** | Inventario sellado · jornada E2E completa · Release E2E FULL PASS |
| **FAIL** | Doble apply · stock inválido · handoff roto · cierre incompleto |
| **Entrega** | RELEASE-E2E-004 |

### Orden de transición (inmutable)

```text
E1
 ↓
E2
 ↓
E3
 ↓
E4
```

Prohibido saltar, reordenar o completar Eₙ₊₁ sin Eₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_E2E_E1_STARTED
RELEASE_E2E_E1_COMPLETED
RELEASE_E2E_E2_STARTED
RELEASE_E2E_E2_COMPLETED
RELEASE_E2E_E3_STARTED
RELEASE_E2E_E3_COMPLETED
RELEASE_E2E_E4_STARTED
RELEASE_E2E_E4_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto E1 → E4  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El Runner (PR posterior) podrá reutilizar evidencia Smoke / Cross-flow / Flow  
  **solo** si el mapeo a `RELEASE_E2E_*` queda documentado en `RELEASE_E2E_RUNNER.md`

---

## 5. Canonical PASS contract

**FULL PASS** solo si la secuencia completa se observa:

```text
E1 → E2 → E3 → E4
```

con:

```text
duplicates=[]
missing=[]
out_of_order=[]
blocked_at=—
certified_through=E4
```

PASS parcial (entrega `RELEASE-E2E-00n`):

```text
PASS through En
blocked_at=RELEASE_E2E_E{n+1}_STARTED   (si n < 4)
blocked_at=—                              (si n = 4 · FULL PASS)
duplicates=[]
missing=[]
out_of_order=[]
```

Tag `release-e2e-pass` solo tras FULL PASS verificado **desde `main`** + acta.

---

## 6. Canonical BLOCKED contract

El runner debe detenerse exactamente en la **primera** capacidad ausente.

Baseline (tras Runner en `main` · **no** este PR):

```text
RELEASE-E2E
BLOCKED
blocked_at=RELEASE_E2E_E1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED) — igual que Smoke / Cross-flow / Flows.  
**BLOCKED no es defecto.**

Ejemplos post-impl:

| Observado | Resultado |
|-----------|-----------|
| E1 completo · sin E2 | PASS through E1 · BLOCKED at `RELEASE_E2E_E2_STARTED` |
| E1–E3 · sin E4 | PASS through E3 · BLOCKED at `RELEASE_E2E_E4_STARTED` |
| Pipeline vacío | BLOCKED at `RELEASE_E2E_E1_STARTED` |

---

## 7. Canonical evidence

| Regla | Contrato |
|-------|----------|
| Principio | Evidence before Implementation |
| Certifica | `main` (Regla 9) |
| Forma | Tokens `RELEASE_E2E_E*_STARTED\|COMPLETED` en orden |
| Entrega | Una capacidad / PR: `RELEASE-E2E-001`…`004` |
| Acta path (futuro) | `docs/10-validation/release-e2e/` |
| Close-out | `RELEASE_E2E_PASS_ACTA.md` + tag `release-e2e-pass` |
| Prohibido | Secretos · pantallas como PASS · fabricar tokens sin ancla documentada |

Este Spec **no** crea evidencias ejecutables ni runners.

---

## 8. Required invariants

| ID | Invariante |
|----|------------|
| E2E-I1 | **Gate discipline** — no abrir E2E-001 sin Spec FROZEN + Runner BLOCKED desde `main` |
| E2E-I2 | **No renegotiate priors** — no modificar contratos de `flowNN-pass` · `release-smoke-pass` · `release-crossflow-pass` |
| E2E-I3 | **No invented state** — solo estados de Specs FROZEN Smoke / Cross-flow / FLOW-01…04 |
| E2E-I4 | **Anchor handoff** — cada Eₙ consume la ancla de la tabla de segmentos (o seed documentado) |
| E2E-I5 | **Ordering + once-only** — tokens en orden · sin duplicates · evidence before implementation |
| E2E-I6 | **No silent partial** — fallo en un segmento → FAIL del gate E2E (no PASS completo) |
| E2E-I7 | **No skipped capability** — prohibido emitir Eₙ₊₁ sin Eₙ `COMPLETED` |
| E2E-I8 | **No invented evidence** — prohibido fabricar tokens sin handoff / ancla documentada |
| E2E-I9 | **Complements not replaces** — E2E no sustituye runners Smoke / Cross-flow / Flow |
| E2E-I10 | **Out of band** — Deploy · Rollback · FLOW-05 · `release-01-beta` fuera hasta sus propios gates |

E2E-I1–I5 no se eliminan sin acta de renegociación. E2E-I6–I10 son parte del Freeze.

---

## 9. Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · jornada coherente |
| **FAIL** | Contrato roto (orden / duplicates / invariante / handoff inválido / estado inventado) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| E2 sin E1 COMPLETED | Capacidad saltada |
| Token duplicado | Evidencia inválida |
| Estado no presente en Spec ancla | Estado inventado |
| Smoke / Cross-flow / Flow ancla deja de PASS | Regresión — E2E no “compensa” |

---

## 10. Out of scope (este Spec · este PR)

```text
❌ Runner · scripts · package.json · comandos npm · tests · CI
❌ Playwright · browser automation · UI · Supabase · repositories · services
❌ Implementación de dominio · migraciones
❌ FLOW-05 · Deploy · Rollback · release-01-beta
❌ Abrir RELEASE-E2E-001
```

El repositorio permanece **no funcional** para RELEASE-E2E hasta el Runner PR.

---

## 11. Gate · RELEASE-E2E-001 CLOSED

`RELEASE-E2E-001` (dominio de cadena E1) **permanece CLOSED** hasta:

| # | Condición |
|---|-----------|
| 1 | Este Spec mergeado en `main` → **FROZEN** |
| 2 | Runner mergeado en `main` (`RELEASE_E2E_RUNNER.md` + executable) |
| 3 | Desde `main`: BLOCKED at `RELEASE_E2E_E1_STARTED` · arrays vacíos · `evidence={}` · exit 2 |
| 4 | Gate report READY · contrato `RELEASE_E2E_E*` sin renegociación abierta |

Procedimiento: [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md).  
Ausencia de runner ejecutable desde `main` ⇒ Gate NOT READY ⇒ no abrir `001`.

---

## 12. Nivel (Release ≠ Flow)

| Nivel | Certifica |
|-------|-----------|
| FLOW | Estados de **dominio** de un Flow |
| RELEASE-SMOKE | **Capacidades de plataforma** |
| RELEASE-CROSSFLOW | **Handoffs encadenados** entre Flows |
| **RELEASE-E2E** | **Jornada piloto de la plataforma como un todo** |

---

## 13. Evidence artifacts (previstos · no creados aquí)

| Artefacto | Path |
|-----------|------|
| DoR | `docs/00-status/RELEASE_E2E_DOR.md` |
| Spec (este) | `docs/00-status/RELEASE_E2E_SPEC.md` |
| Runner doc | `docs/10-validation/release-e2e/RELEASE_E2E_RUNNER.md` |
| Gate report | `docs/10-validation/release-e2e/RELEASE_E2E_GATE.md` |
| Actas | `RELEASE_E2E_001_E1_ACTA.md` … `004_E4` |
| PASS acta | `RELEASE_E2E_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/release-e2e/evidence/` |
| Tag | `release-e2e-pass` |

El Runner PR fijará el nombre del comando ejecutable. Este documento **no** añade scripts.

---

## 14. Definition of Done (gate E2E)

```text
RELEASE-01 · B-03 E2E
☑ DoR en main                              → #185 · `48e0c5c`
☑ Spec FROZEN en main                      → #186 · `6d11ae8`
□ Runner + BLOCKED at E1 verificado en main
□ Gate READY → E2E-001…004
□ duplicates=[] missing=[] out_of_order=[]
□ Acta RELEASE_E2E_PASS
□ Tag release-e2e-pass
```

Sin `release-e2e-pass` → fila E2E de DoRl permanece ⏳.

---

## 15. Ready checklist (Spec)

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena E1–E4 | ✅ |
| Tokens · Transitions · Evidence | ✅ |
| PASS · BLOCKED · Invariants | ✅ |
| Out of scope · Gate CLOSED until Runner | ✅ |
| Spec READY FOR FREEZE | ✅ #186 |
| Spec FROZEN | ✅ #186 · `6d11ae8` · Land Check docs PASSED |
| Runner / Playwright / segment drivers | ▶ READY TO OPEN (siguiente PR) |
| RELEASE-E2E-001 | ⛔ CLOSED (Gate NOT READY) |

**Estado del documento:** ✅ **FROZEN**

---

## 16. Next

```text
READY TO OPEN
RELEASE-E2E Runner
(BLOCKED at E1 · exit 2)
    ↓
Gate Land Check from main
    ↓
READY → RELEASE-E2E-001…004
    ↓
release-e2e-pass
```

Gate permanece **NOT READY** hasta Runner BLOCKED at E1 verificado desde `main`.  
**No** Deploy · **no** Rollback · **no** FLOW-05 · **no** E2E-001.

---

## End of RELEASE-E2E Specification
