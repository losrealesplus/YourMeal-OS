# FLOW03-002 · T2 Evento review · Acta

**Documento:** `FLOW03_002_T2_ACTA.md`  
**Fecha:** 2026-08-02  
**Entrega:** FLOW03-002  
**Spec:** [FLOW_03_BILLING_SPEC](../../00-status/FLOW_03_BILLING_SPEC.md) **FROZEN** (#155)  
**Runner:** [FLOW03_CANONICAL_RUNNER](./FLOW03_CANONICAL_RUNNER.md)  
**Precondición:** FLOW03-001 ✅ (#158)

---

## Pregunta certificada

> ¿Queda certificada la revisión de la factura (evento `reviewed_at`)?

---

## Contrato observado

```text
FLOW03_T1_*             ✔ (precondición · FLOW03-001)
FLOW03_T2_STARTED       ✔ (exactly once)
FLOW03_T2_COMPLETED     ✔ (exactly once)
FLOW03_T3_STARTED       BLOCKED (no emitido — fuera de alcance)
```

Spine (review = evento, no estado):

```text
pending
  ↓
reviewInvoice()
  ↓
reviewed_at = now()
  ↓
pending
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Dominio emite `FLOW03_T2_STARTED` una vez | ✅ |
| Dominio emite `FLOW03_T2_COMPLETED` una vez | ✅ |
| `reviewed_at` set | ✅ |
| `status` permanece `pending` | ✅ |
| Sin tokens T3 | ✅ |
| Sin `paid` | ✅ |
| Runner: PASS through T2 · BLOCKED at T3 | ✅ |
| `duplicates=[]` · `out_of_order=[]` | ✅ |

---

## Comando

```bash
npm run test:flow03-002
# alias: npm run test:flow03-canonical -- --live --through=T2
```

Resultado esperado:

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=T2
blocked_at=FLOW03_T3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0**.  
Unscoped `--live` → PASS through T2 · BLOCKED at T3.

---

## Implementación

| Pieza | Path |
|-------|------|
| Emisión T2 | `AccountingService.reviewInvoice` |
| Live driver | `flow03-live.driver.spec.ts` (through≥2) |
| Unit | `accounting-service.flow03-t2.spec.ts` |

---

## Siguiente

FLOW03-003 · T3 únicamente (`pending` → `paid`).
