# FLOW-03 · Canonical Runner

**Documento:** `FLOW03_CANONICAL_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **ACTIVE** · Domain ▶ FLOW03-001 (T1) · full FLOW-03 BLOCKED at T2  
**Spec:** [FLOW_03_BILLING_SPEC](../../00-status/FLOW_03_BILLING_SPEC.md) **FROZEN** (#155)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Contrato

```text
FLOW03
FLOW03_T1_STARTED
    ↓
FLOW03_T1_COMPLETED
    ↓
FLOW03_T2_STARTED
    ↓
FLOW03_T2_COMPLETED
    ↓
FLOW03_T3_STARTED
    ↓
FLOW03_T3_COMPLETED
    ↓
PASS
```

Spine de dominio (referencia Spec · no implementado aquí):

```text
T1  delivered → pending
T2  pending + reviewed_at → pending   (evento)
T3  pending → paid
```

Criterios (igual que FCR-008 / FLOW-01 / FLOW-02):

| Check | PASS |
|-------|------|
| Duplicados | `duplicates=[]` |
| Ausentes | `missing=[]` |
| Fuera de orden | `out_of_order=[]` |
| Terminal (FULL) | `invoice_status=paid` |
| Tiempos | `duration_ms` diagnóstico · no gate |

---

## Comando por defecto (runner-only · sin dominio)

```bash
npm run test:flow03-canonical
```

Resultado esperado:

```text
FLOW-03

BLOCKED

blocked_at=FLOW03_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code: **2** (BLOCKED).  
JSON: `docs/10-validation/flow-03/evidence/flow03-canonical.json`

**BLOCKED ≠ FAIL** — todavía no hay implementación de dominio.

---

## Otros modos (sin dominio)

```bash
# Self-test del contrato completo (sintético · sin dominio)
npm run test:flow03-canonical -- --self-test

# Pipeline explícito
npm run test:flow03-canonical -- --pipeline=FLOW03_T1_STARTED,FLOW03_T1_COMPLETED --through=T1

# Unit tests del validador
npm run test:flow03-canonical:unit
```

```bash
# Live dominio (FLOW03-001…)
npm run test:flow03-001
# → PASS through T1 · BLOCKED at FLOW03_T2_STARTED · exit 0
```

---

## Gate · Abrir FLOW03-001

| # | Condición | Estado |
|---|-----------|--------|
| 1 | Spec (#155) en `main` → FROZEN | ✅ |
| 2 | Runner (#157) en `main` | ✅ |
| 3 | Canonical BLOCKED verificado desde `main` | ✅ |
| 4 | Contrato `FLOW03_T*` congelado | ✅ |

Gate **verde** · FLOW03-001 abierto.

## Dominio (incremental)

| Entrega | Estado |
|---------|--------|
| FLOW03-001 T1 | ▶ `delivered` → invoice `pending` · [acta](./FLOW03_001_T1_ACTA.md) |
| FLOW03-002 T2 | ⏳ evento `reviewed_at` · status sigue `pending` |
| FLOW03-003 T3 | ⏳ `pending` → `paid` · FULL PASS |

---

## Definition of Done (runner base)

| Verificación | Esperado |
|--------------|----------|
| Runner ejecuta | ✅ |
| Reconoce contrato `FLOW03_*` | ✅ |
| Default sin dominio | `BLOCKED` at `FLOW03_T1_STARTED` |
| FLOW03-001 live | PASS through T1 · BLOCKED at `FLOW03_T2_STARTED` |
