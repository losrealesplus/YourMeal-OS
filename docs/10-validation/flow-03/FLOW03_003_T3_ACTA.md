# FLOW03-003 · T3 Registrar cobro · Acta

**Documento:** `FLOW03_003_T3_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW03-003  
**Spec:** [FLOW_03_BILLING_SPEC](../../00-status/FLOW_03_BILLING_SPEC.md) **FROZEN** (#155)  
**Runner:** [FLOW03_CANONICAL_RUNNER](./FLOW03_CANONICAL_RUNNER.md)  
**Precondición:** FLOW03-001 ✅ · FLOW03-002 ✅

---

## Pregunta certificada

> ¿Queda certificada la transición `pending` → `paid`?

---

## Contrato observado

```text
FLOW03_T1_* … FLOW03_T2_*   ✔ (precondiciones)
FLOW03_T3_STARTED           ✔ (exactly once)
FLOW03_T3_COMPLETED         ✔ (exactly once)
```

Spine:

```text
pending · reviewed_at set
  ↓
recordPayment()  (cobro completo)
  ↓
paid  (terminal)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW03_T3_STARTED` una vez | ✅ |
| Dominio emite `FLOW03_T3_COMPLETED` una vez | ✅ |
| Invoice `status=paid` | ✅ |
| Cobro completo (sin parciales) | ✅ |
| Sin reembolsos / void / NC | ✅ |
| Runner: FLOW-03 FULL PASS | ✅ |
| `duplicates=[]` · `missing=[]` · `out_of_order=[]` | ✅ |

---

## Comando

```bash
npm run test:flow03-003
# alias: npm run test:flow03-canonical -- --live --through=T3
npm run test:flow03-canonical -- --live
```

Resultado esperado:

```text
status=PASS
flow_status=PASS
certified_through=T3
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0**.

---

## Implementación

| Pieza | Path |
|-------|------|
| Emisión T3 | `AccountingService.recordPayment` |
| Live driver | `flow03-live.driver.spec.ts` (through=3) |
| Unit | `accounting-service.flow03-t3.spec.ts` |

---

## Cierre

Con T3 → [FLOW03_PASS_ACTA](./FLOW03_PASS_ACTA.md) · tag `flow03-pass`.
