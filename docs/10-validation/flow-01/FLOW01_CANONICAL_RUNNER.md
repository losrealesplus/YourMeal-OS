# FLOW-01 · Canonical Runner

**Documento:** `FLOW01_CANONICAL_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner contract **ACTIVE** · Domain driver T1 ▶ FLOW01-001  
**Spec:** [FLOW_01_KITCHEN_DELIVERY_SPEC](../../00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md) **FROZEN** (PR #141)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

---

## Contrato

```text
FLOW01
FLOW01_T1_STARTED
    ↓
FLOW01_T1_COMPLETED
    ↓
FLOW01_T2_STARTED
    ↓
FLOW01_T2_COMPLETED
    ↓
FLOW01_T3_STARTED
    ↓
FLOW01_T3_COMPLETED
    ↓
FLOW01_T4_STARTED
    ↓
FLOW01_T4_COMPLETED
    ↓
PASS
```

Criterios (igual que FCR-008 / PS-002-C):

| Check | PASS |
|-------|------|
| Duplicados | `duplicates=[]` |
| Ausentes | `missing=[]` |
| Fuera de orden | `out_of_order=[]` |
| Terminal | `order_status=delivered` · `packaging_batch=CLOSED` (cuando dominio corra) |
| Tiempos | `duration_ms` diagnóstico · no gate |

---

## Comandos

```bash
# Default — self-test del contrato completo (sin código de dominio)
npm run test:flow01-canonical

# Entrega incremental (FLOW01-001..004)
npm run test:flow01-canonical -- --through=T1 --pipeline=FLOW01_T1_STARTED,FLOW01_T1_COMPLETED
# → delivery PASS · flow BLOCKED at FLOW01_T2_STARTED

# Live domain driver (FLOW01-001: PASS through T1 · BLOCKED at T2)
npm run test:flow01-canonical -- --live
npm run test:flow01-canonical -- --live --through=T1   # delivery exit 0

# Unit tests del validador
npm run test:flow01-canonical:unit
```

Plan: [FLOW_01_DELIVERY_PLAN](../../00-status/FLOW_01_DELIVERY_PLAN.md) · Acta T1: [FLOW01_001_T1_ACTA](./FLOW01_001_T1_ACTA.md).

Evidencia escrita en: `docs/10-validation/flow-01/evidence/flow01-canonical.json`

Logs de dominio (futuro): `[FLOW-01] FLOW01_T1_STARTED …`

---

## Por qué runner antes que Implementation

Repite el patrón que funcionó con Auth:

```text
Spec freeze
    ↓
Runner / contrato
    ↓
Código de dominio
    ↓
PASS real
```

Hasta que exista el driver de dominio, `--live` = **BLOCKED** (no FAIL).  
El self-test demuestra que el contrato es ejecutable y estable.

---

## Archivos

| Path | Rol |
|------|-----|
| `scripts/lib/flow01-canonical-pipeline.mjs` | Validador + envelope |
| `scripts/flow01-canonical.mjs` | Runner CLI |
| `scripts/lib/flow01-canonical-pipeline.spec.mjs` | Unit tests |
| `evidence/flow01-canonical.example.json` | Envelope de referencia |
