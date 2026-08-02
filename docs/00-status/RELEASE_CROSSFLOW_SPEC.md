# RELEASE-01 · B-02 · Cross-flow · Specification

**Documento:** `RELEASE_CROSSFLOW_SPEC.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FROZEN** (Spec · #179 · `dbfe917`) · Runner ▶ ACTIVE  
**Gate DoRl:** Cross-flow Tests · Track B · RELEASE-01  
**Nivel:** Release Contract — **no** es un Flow nuevo  
**DoR:** [RELEASE_CROSSFLOW_DOR](./RELEASE_CROSSFLOW_DOR.md) ✅ en `main` (#178 · `e55e2a1`)  
**Precondiciones:** FOUNDATION ✅ · `ps002c-pass` · `flow01-pass`…`flow04-pass` · `release-smoke-pass`  
**DoRl:** [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md)  
**Estrategia:** [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md)  
**Tags:** `release-crossflow-pass` → … → `release-01-beta` · [GIT_MILESTONE_TAGS](./GIT_MILESTONE_TAGS.md)  
**Principio:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)

> Este PR responde **solo**: ¿queda especificado el contrato Cross-flow de RELEASE-01?  
> **No** Runner. **No** scripts. **No** `package.json`. **No** tests. **No** Playwright.  
> **No** dominio. **No** UI. **No** Supabase. **No** FLOW-05. **No** implementación.

---

## 1. Goal

> ¿Los contratos FLOW-01…04 **encadenan** de extremo a extremo sin romper handoffs?

RELEASE-CROSSFLOW certifica que Outcomes ya certificados de FLOW-01…04  
alimentan la cadena operativa mínima con evidencia `RELEASE_CROSSFLOW_*`  
reproducible — **sin inventar estados** fuera de las Specs FROZEN de esos Flows.

No: *¿cada Flow individual sigue PASS?* (runners `test:flowNN-canonical`)  
No: *¿la plataforma mínima arranca?* (eso es RELEASE-SMOKE)  
Sí: *¿Pedido → … → Inventario → Cierre produce handoffs coherentes entre Flows?*

---

## 2. Scope

### Dentro (v1 · congelado por este Spec)

| Incluye | Notas |
|---------|-------|
| Cadena canónica happy-path sobre Outcomes FLOW-01…04 | Sin nuevos estados de dominio |
| Segmentos **C1 → C2 → C3 → C4** | Una capacidad / entrega |
| Tokens `RELEASE_CROSSFLOW_C*_STARTED\|COMPLETED` | Once-only · orden estricto |
| Reutilizar Outcomes / seeds documentados de Flows certificados | No reabrir Specs Flow |
| Semántica PASS / FAIL / BLOCKED | FOPEBA |
| Land Check desde `main` (Regla 9) | Solo `main` certifica |

### Cadena canónica completa

```text
Pedido
  ↓
Producción          ← FLOW-01 (Kitchen → Delivery)
  ↓
Packaging
  ↓
Entrega
  ↓
Incidencia          ← FLOW-02
  ↓
Facturación         ← FLOW-03
  ↓
Inventario          ← FLOW-04
  ↓
Cierre
```

### Fuera (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| Runner · scripts · `package.json` · npm · tests | PR Runner / impl posteriores |
| Playwright · CI · UI exploratoria | B-03 E2E / fuera de contrato v1 |
| Deploy · Rollback | B-04 · B-05 |
| `release-01-beta` | B-06 · DoRl PASS completo |
| FLOW-05+ | Track A; solo si Track B lo bloquea |
| Nuevos estados / entidades de dominio | Solo Specs FROZEN FLOW-01…04 |
| Reabrir `flowNN-pass` / `release-smoke-pass` | Solo regresión con evidencia |
| Sustituir runners canónicos de Flow | Cross-flow **complementa**, no sustituye |

---

## 3. Canonical transitions (C1–C4)

Cada segmento emite exactamente un par `STARTED` / `COMPLETED`  
(o deja el gate **BLOCKED** si aún no está implementado).

### C1 · Kitchen → Delivery operable

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Pedido / producción llega a una entrega operable? |
| **Ancla** | FLOW-01 (`flow01-pass`) |
| **Incluye** | Handoff Kitchen → Packaging → Delivery según Spec FLOW-01 |
| **No incluye** | Incidencias (C2) · facturación (C3) · inventario (C4) |
| **Evidencia** | `RELEASE_CROSSFLOW_C1_STARTED` · `RELEASE_CROSSFLOW_C1_COMPLETED` |
| **PASS** | Outcome de entrega operable consumible por C2 |
| **FAIL** | Handoff roto · estado inventado · tokens inválidos |
| **Entrega** | RELEASE-CROSSFLOW-001 |

### C2 · Incidencia → recuperación / delivered

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Una incidencia de entrega queda operable hasta `delivered`? |
| **Ancla** | FLOW-02 (`flow02-pass`) · consume Outcome de C1 |
| **Incluye** | Ciclo incidencia → recuperación según Spec FLOW-02 |
| **No incluye** | Facturación (C3) · inventario (C4) |
| **Evidencia** | `RELEASE_CROSSFLOW_C2_STARTED` · `RELEASE_CROSSFLOW_C2_COMPLETED` |
| **PASS** | Estado `delivered` (o equivalente FROZEN) listo para C3 |
| **FAIL** | Incidencia no recuperable · handoff C1→C2 inválido |
| **Entrega** | RELEASE-CROSSFLOW-002 |

### C3 · Delivered → facturación pagada

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿Un pedido `delivered` queda facturable → revisado → cobrado? |
| **Ancla** | FLOW-03 (`flow03-pass`) · consume Outcome de C2 |
| **Incluye** | Cadena billing según Spec FLOW-03 |
| **No incluye** | Consumo de inventario (C4) |
| **Evidencia** | `RELEASE_CROSSFLOW_C3_STARTED` · `RELEASE_CROSSFLOW_C3_COMPLETED` |
| **PASS** | Factura en estado terminal cobrado / `paid` (Spec FLOW-03) |
| **FAIL** | Billing incompleto · handoff C2→C3 inválido |
| **Entrega** | RELEASE-CROSSFLOW-003 |

### C4 · Producción → inventario sellado

| Campo | Contrato |
|-------|----------|
| **Pregunta** | ¿La producción consume inventario de forma trazable e idempotente? |
| **Ancla** | FLOW-04 (`flow04-pass`) · alineado a producción de la cadena |
| **Incluye** | Consumo `planned → applied → sealed` según Spec FLOW-04 |
| **No incluye** | Purchasing · UI inventario · FLOW-05 |
| **Evidencia** | `RELEASE_CROSSFLOW_C4_STARTED` · `RELEASE_CROSSFLOW_C4_COMPLETED` |
| **PASS** | Consumo sellado · cadena Cross-flow completa |
| **FAIL** | Doble apply · stock inválido · handoff roto |
| **Entrega** | RELEASE-CROSSFLOW-004 |

### Orden de transición (inmutable)

```text
C1
 ↓
C2
 ↓
C3
 ↓
C4
```

Prohibido saltar, reordenar o completar Cₙ₊₁ sin Cₙ `COMPLETED`.

---

## 4. Canonical tokens

```text
RELEASE_CROSSFLOW_C1_STARTED
RELEASE_CROSSFLOW_C1_COMPLETED
RELEASE_CROSSFLOW_C2_STARTED
RELEASE_CROSSFLOW_C2_COMPLETED
RELEASE_CROSSFLOW_C3_STARTED
RELEASE_CROSSFLOW_C3_COMPLETED
RELEASE_CROSSFLOW_C4_STARTED
RELEASE_CROSSFLOW_C4_COMPLETED
```

Reglas:

- Once-only por token  
- Orden estricto C1 → C4  
- `duplicates=[]` · `missing=[]` · `out_of_order=[]` para PASS completo  
- El Runner (PR posterior) podrá reutilizar runners Flow **solo** si el mapeo a `RELEASE_CROSSFLOW_*` queda documentado en `RELEASE_CROSSFLOW_RUNNER.md`

---

## 5. Canonical PASS contract

**FULL PASS** solo si la secuencia completa se observa:

```text
C1 → C2 → C3 → C4
```

con:

```text
duplicates=[]
missing=[]
out_of_order=[]
blocked_at=—
```

PASS parcial (entrega `RELEASE-CROSSFLOW-00n`):

```text
PASS through Cn
blocked_at=RELEASE_CROSSFLOW_C{n+1}_STARTED   (si n < 4)
blocked_at=—                                    (si n = 4 · FULL PASS)
duplicates=[]
missing=[]
out_of_order=[]
```

Tag `release-crossflow-pass` solo tras FULL PASS verificado **desde `main`** + acta.

---

## 6. Canonical BLOCKED contract

El runner debe detenerse exactamente en la **primera** capacidad ausente.

Baseline (tras Runner en `main` · no este PR):

```text
RELEASE-CROSSFLOW
BLOCKED
blocked_at=RELEASE_CROSSFLOW_C1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico esperado: **2** (BLOCKED) — igual que Smoke / Flows.  
**BLOCKED no es defecto.**

Ejemplos post-impl:

| Observado | Resultado |
|-----------|-----------|
| C1 completo · sin C2 | PASS through C1 · BLOCKED at `RELEASE_CROSSFLOW_C2_STARTED` |
| C1–C3 · sin C4 | PASS through C3 · BLOCKED at `RELEASE_CROSSFLOW_C4_STARTED` |
| Pipeline vacío | BLOCKED at `RELEASE_CROSSFLOW_C1_STARTED` |

---

## 7. Invariants

| ID | Invariante |
|----|------------|
| CF-I1 | **Tenant isolation** — nunca cruzar `tenant_id` entre handoffs |
| CF-I2 | **No invented state** — solo estados de Specs FROZEN FLOW-01…04 |
| CF-I3 | **Handoff ancla** — cada Cₙ consume Outcome certificado del Flow ancla (o seed documentado) |
| CF-I4 | **No renegotiate Flows** — Cross-flow no modifica el contrato de un Flow runner aislado |
| CF-I5 | **Ordering + once-only** — tokens en orden · sin duplicates · evidence before implementation |
| CF-I6 | **No silent partial** — fallo en un segmento → FAIL del Cross-flow (no PASS completo) |
| CF-I7 | **No skipped capability** — prohibido emitir Cₙ₊₁ sin Cₙ `COMPLETED` |
| CF-I8 | **No invented evidence** — prohibido fabricar tokens sin handoff real / seed documentado |

CF-I1–I4 no se eliminan sin acta de renegociación. CF-I5–I8 son parte del Freeze.

---

## 8. Semántica PASS / FAIL / BLOCKED

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · handoffs coherentes |
| **FAIL** | Contrato roto (orden / duplicates / invariante / handoff inválido / estado inventado) |
| **BLOCKED** | Siguiente segmento aún no implementado — **no es defecto** |

### FAIL (ejemplos)

| FAIL | Significa |
|------|-----------|
| C2 sin C1 COMPLETED | Capacidad saltada |
| Token duplicado | Evidencia inválida |
| Estado no presente en Spec Flow ancla | Estado inventado |
| Flow runner aislado deja de PASS | Regresión — Cross-flow no “compensa” |

---

## 9. Out of scope (este Spec · este PR)

```text
❌ Runner · scripts · package.json · npm commands · tests
❌ Playwright · CI · UI · Supabase · repositories · services
❌ Implementación de dominio · migraciones
❌ FLOW-05 · E2E · Deploy · Rollback · release-01-beta
❌ Abrir CROSSFLOW-001
```

---

## 10. Gate · CROSSFLOW-001 CLOSED

`RELEASE-CROSSFLOW-001` (dominio de cadena C1) **permanece CLOSED** hasta:

| # | Condición |
|---|-----------|
| 1 | Este Spec mergeado en `main` → **FROZEN** |
| 2 | Runner mergeado en `main` (`RELEASE_CROSSFLOW_RUNNER.md` + executable) |
| 3 | Desde `main`: BLOCKED at `RELEASE_CROSSFLOW_C1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Gate report READY · contrato `RELEASE_CROSSFLOW_C*` sin renegociación abierta |

Procedimiento: [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md).  
`Missing script` desde `main` ⇒ Gate NOT READY ⇒ no abrir `001`.

---

## 11. Nivel (Release ≠ Flow)

| Nivel | Certifica |
|-------|-----------|
| FLOW | Estados de **dominio** de un Flow (`planned`, `paid`, `delivered`, …) |
| RELEASE-SMOKE | **Capacidades de plataforma** (`preflight`…`dashboard`) |
| **RELEASE-CROSSFLOW** | **Handoffs encadenados** entre Flows certificados |

---

## 12. Evidence artifacts (previstos · no creados aquí)

| Artefacto | Path |
|-----------|------|
| DoR | `docs/00-status/RELEASE_CROSSFLOW_DOR.md` |
| Spec (este) | `docs/00-status/RELEASE_CROSSFLOW_SPEC.md` |
| Runner doc | `docs/10-validation/release-crossflow/RELEASE_CROSSFLOW_RUNNER.md` |
| Gate report | `docs/10-validation/release-crossflow/RELEASE_CROSSFLOW_GATE.md` |
| Actas | `RELEASE_CROSSFLOW_001_C1_ACTA.md` … `004_C4` |
| PASS acta | `RELEASE_CROSSFLOW_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/release-crossflow/evidence/` |
| Tag | `release-crossflow-pass` |

Comando futuro (Runner PR · **no** este PR): nombre previsto `test:release-crossflow`  
(baseline BLOCKED · exit 2). Este documento **no** añade scripts npm.

---

## 13. Definition of Done (gate Cross-flow)

```text
RELEASE-01 · B-02 Cross-flow
☑ DoR en main                              → #178
☑ Spec FROZEN                              → #179 · `dbfe917`
□ Runner + BLOCKED at C1 verificado en main
□ Gate READY → CROSSFLOW-001…004
□ duplicates=[] missing=[] out_of_order=[]
□ Acta RELEASE_CROSSFLOW_PASS
□ Tag release-crossflow-pass
```

Sin `release-crossflow-pass` → fila Cross-flow de DoRl permanece ⏳.

---

## 14. Checklist Spec

| Ítem | Estado |
|------|--------|
| Goal · Scope · Cadena · C1–C4 | ✅ |
| Tokens · Invariants · PASS / BLOCKED | ✅ |
| Out of scope · Gate CLOSED until Land Check | ✅ |
| Spec FROZEN | ✅ #179 |
| Runner / segment drivers / Playwright | ▶ Runner PR · ⛔ 001 |
| CROSSFLOW-001 | ⛔ CLOSED |

**Estado del documento:** ✅ **FROZEN**

---

## 15. Next

```text
Runner (BLOCKED at C1) · este ciclo
    ↓
Gate Land Check from main
    ↓
CROSSFLOW-001…004
    ↓
release-crossflow-pass
```

---

## End of RELEASE Cross-flow Specification
