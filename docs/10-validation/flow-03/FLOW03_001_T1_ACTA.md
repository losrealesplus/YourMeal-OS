# FLOW03-001 · T1 Crear factura · Acta

**Documento:** `FLOW03_001_T1_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW03-001  
**Spec:** [FLOW_03_BILLING_SPEC](../../00-status/FLOW_03_BILLING_SPEC.md) **FROZEN** (#155)  
**Runner:** [FLOW03_CANONICAL_RUNNER](./FLOW03_CANONICAL_RUNNER.md)

---

## Pregunta certificada

> ¿Queda certificada la transición `delivered` → invoice `pending`?

---

## Contrato observado

```text
FLOW03_T1_STARTED     ✔ (exactly once)
FLOW03_T1_COMPLETED   ✔ (exactly once)
FLOW03_T2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
delivered
  ↓
createInvoiceFromOrders()
  ↓
invoice.status = pending · reviewed_at = null
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW03_T1_STARTED` una vez | ✅ |
| Dominio emite `FLOW03_T1_COMPLETED` una vez | ✅ |
| Invoice `status=pending` · `reviewedAt=null` | ✅ |
| Sin eventos T2 / T3 | ✅ |
| Sin `reviewInvoice` / `recordPayment` | ✅ |
| `duplicates=[]` | ✅ |
| `out_of_order=[]` | ✅ |
| Runner: PASS through T1 · BLOCKED at T2 | ✅ |
| Review / paid / UI / reembolsos | ❌ fuera de alcance |

---

## Comando

```bash
npm run test:flow03-001
# alias: npm run test:flow03-canonical -- --live --through=T1
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T1
blocked_at=FLOW03_T2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).  
Full FLOW-03 remains BLOCKED at T2 — intencional.

---

## Implementación

| Pieza | Path |
|-------|------|
| Evidence | `src/modules/accounting/application/flow03-evidence.ts` |
| Emisión T1 | `AccountingService.createInvoiceFromOrders` |
| Live driver | `src/modules/accounting/application/flow03-live.driver.spec.ts` |
| Domain driver | `scripts/lib/flow03-domain-driver.mjs` |

---

## Siguiente

FLOW03-002 · T2 únicamente (evento `reviewed_at` · status sigue `pending`).
