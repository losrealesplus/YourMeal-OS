# FLOW-02 · Canonical Runner

**Documento:** `FLOW02_CANONICAL_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner contract **ACTIVE** · Domain ▶ FLOW02-002 (T2)  
**Spec:** [FLOW_02_DELIVERY_INCIDENTS_SPEC](../../00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md) **FROZEN** (PR #148)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Contrato

```text
FLOW02
FLOW02_T1_STARTED
    ↓
FLOW02_T1_COMPLETED
    ↓
FLOW02_T2_STARTED
    ↓
FLOW02_T2_COMPLETED
    ↓
FLOW02_T3_STARTED
    ↓
FLOW02_T3_COMPLETED
    ↓
PASS
```

Criterios (igual que FCR-008 / FLOW-01):

| Check | PASS |
|-------|------|
| Duplicados | `duplicates=[]` |
| Ausentes | `missing=[]` |
| Fuera de orden | `out_of_order=[]` |
| Terminal (FULL) | `order_status=delivered` |
| Tiempos | `duration_ms` diagnóstico · no gate |

---

## Comando por defecto (runner-only · sin dominio)

```bash
npm run test:flow02-canonical
```

Resultado esperado:

```text
FLOW-02

BLOCKED

blocked_at=FLOW02_T1_STARTED
```

Exit code: **2** (BLOCKED).  
JSON: `docs/10-validation/flow-02/evidence/flow02-canonical.json`

```json
{
  "status": "BLOCKED",
  "blocked_at": "FLOW02_T1_STARTED",
  "duplicates": [],
  "missing": [],
  "out_of_order": [],
  "evidence": {}
}
```

**BLOCKED ≠ FAIL** — todavía no hay implementación de dominio.

---

## Otros modos

```bash
# Self-test del contrato completo (sintético · sin dominio)
npm run test:flow02-canonical -- --self-test

# Live dominio (FLOW02-001…002)
npm run test:flow02-001
# → PASS through T1 · BLOCKED at FLOW02_T2_STARTED · exit 0
npm run test:flow02-002
# → PASS through T2 · BLOCKED at FLOW02_T3_STARTED · exit 0

# Pipeline explícito
npm run test:flow02-canonical -- --pipeline=FLOW02_T1_STARTED,FLOW02_T1_COMPLETED --through=T1

# Unit tests del validador
npm run test:flow02-canonical:unit
```

---

## Dominio (incremental)

| Entrega | Estado |
|---------|--------|
| FLOW02-001 T1 | ✅ `out_for_delivery` → `delivery_issue` |
| FLOW02-002 T2 | ▶ `delivery_issue` → `out_for_delivery` |
| FLOW02-003 T3 | ⏳ delivered |

Sin redefinir el contrato del runner.

---

## Definition of Done (este PR)

| Verificación | Esperado |
|--------------|----------|
| Runner ejecuta | ✅ |
| Reconoce contrato `FLOW02_*` | ✅ |
| `duplicates` | `[]` |
| `missing` | `[]` |
| `out_of_order` | `[]` |
| Estado | `BLOCKED` |
| `blocked_at` | `FLOW02_T1_STARTED` |
