# FLOW-01 · Canonical Runner

**Documento:** `FLOW01_CANONICAL_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner contract **ACTIVE** · Domain driver ⏳ PENDING  
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
# Default — self-test del contrato (sin código de dominio)
npm run test:flow01-canonical

# Validar lista observada
npm run test:flow01-canonical -- --pipeline=FLOW01_T1_STARTED,FLOW01_T1_COMPLETED,...

# Live domain driver (BLOCKED hasta Implementation)
npm run test:flow01-canonical -- --live

# Unit tests del validador
npm run test:flow01-canonical:unit
```

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
