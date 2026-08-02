# FLOW-04 · Canonical Runner

**Documento:** `FLOW04_CANONICAL_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **ACTIVE** · Domain ✅ FULL PASS · tag `flow04-pass`  
**Spec:** [FLOW_04_INVENTORY_CONSUMPTION_SPEC](../../00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) **FROZEN** (#163 → `3d922ae`)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

> Pregunta que responde este PR:  
> **¿Existe un contrato ejecutable para FLOW-04?**  
> No: ¿consume stock? · ¿servicio? · ¿Supabase? · ¿UI?

---

## Contrato

```text
FLOW04
FLOW04_T1_STARTED
    ↓
FLOW04_T1_COMPLETED
    ↓
FLOW04_T2_STARTED
    ↓
FLOW04_T2_COMPLETED
    ↓
FLOW04_T3_STARTED
    ↓
FLOW04_T3_COMPLETED
    ↓
PASS
```

Spine de dominio (referencia Spec · **no implementado aquí**):

```text
T1  → planned
T2  planned → applied  (+ stock · FLOW04-I2 Single Apply)
T3  applied → sealed
```

`FLOW04-I2` ya implica: **T2 es idempotente** — un mismo consumption nunca aplica dos veces.  
`FLOW04-I3` en Spec = **no stock negativo** (no es una segunda regla de idempotencia).

---

## Comando por defecto (runner-only · sin dominio)

```bash
npm run test:flow04-canonical
```

Resultado esperado:

```text
FLOW-04

BLOCKED

blocked_at=FLOW04_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code: **2** (BLOCKED).  
JSON: `docs/10-validation/flow-04/evidence/flow04-canonical.json`

**BLOCKED ≠ FAIL** — todavía no hay implementación de dominio.

---

## Otros modos (sin dominio)

```bash
# Self-test del contrato completo (sintético · sin dominio)
npm run test:flow04-canonical -- --self-test

# Pipeline explícito
npm run test:flow04-canonical -- --pipeline=FLOW04_T1_STARTED,FLOW04_T1_COMPLETED --through=T1

# Unit tests del validador
npm run test:flow04-canonical:unit
```

`--live` / `test:flow04-001` → **FAIL** hasta Gate FLOW04-001 (sin driver).

---

## Gate · Abrir FLOW04-001

| # | Condición | Estado |
|---|-----------|--------|
| 1 | Spec (#163) en `main` → FROZEN | ✅ `3d922ae` |
| 2 | Runner en `main` | ✅ #164 → `a99f6fd` |
| 3 | Canonical BLOCKED verificado desde `main` | ✅ |
| 4 | Contrato `FLOW04_T*` congelado | ✅ Spec |

Gate **verde** · FLOW04-001 abierto · [acta T1](./FLOW04_001_T1_ACTA.md).

---

## Dominio (incremental)

| Entrega | Estado |
|---------|--------|
| FLOW04-001 T1 | ✅ `→ planned` · [acta](./FLOW04_001_T1_ACTA.md) |
| FLOW04-002 T2 | ✅ `planned → applied` · [acta](./FLOW04_002_T2_ACTA.md) |
| FLOW04-003 T3 | ✅ `applied → sealed` · [acta](./FLOW04_003_T3_ACTA.md) |
| FULL PASS | ✅ [FLOW04_PASS_ACTA](./FLOW04_PASS_ACTA.md) |

```bash
npm run test:flow04-001   # PASS through T1 · exit 0
npm run test:flow04-002   # PASS through T2 · exit 0
npm run test:flow04-003   # FULL PASS · exit 0
npm run test:flow04-canonical -- --live   # FULL PASS · exit 0
```

---

## End of FLOW-04 Canonical Runner
