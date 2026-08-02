# FLOW-03 · Billing · PASS ACTA

**Documento:** `FLOW03_PASS_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **FLOW-03 CERTIFIED** (Billing happy path)  
**Tag:** `flow03-pass` (tras merge FLOW03-003)  
**Comando:** `npm run test:flow03-canonical -- --live`  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Spec:** [FLOW_03_BILLING_SPEC](../../00-status/FLOW_03_BILLING_SPEC.md)  
**Taxonomía:** [GIT_MILESTONE_TAGS](../../00-status/GIT_MILESTONE_TAGS.md)

---

## Cadena certificada

```text
delivered
        │  T1  createInvoiceFromOrders
        ▼
invoice pending · reviewed_at=null
        │  T2  reviewInvoice (evento)
        ▼
invoice pending · reviewed_at set
        │  T3  recordPayment
        ▼
invoice paid
```

---

## Pipeline

```text
FLOW03_T1_STARTED
FLOW03_T1_COMPLETED
FLOW03_T2_STARTED
FLOW03_T2_COMPLETED
FLOW03_T3_STARTED
FLOW03_T3_COMPLETED
```

```text
duplicates=[]
missing=[]
out_of_order=[]
STATUS=PASS
terminal.invoice_status=paid
```

---

## Entregas

| ID | Acta |
|----|------|
| FLOW03-001 | [T1](./FLOW03_001_T1_ACTA.md) |
| FLOW03-002 | [T2](./FLOW03_002_T2_ACTA.md) |
| FLOW03-003 | [T3](./FLOW03_003_T3_ACTA.md) |

---

## Invariantes clave (Freeze)

| Invariante | Cumplido |
|------------|----------|
| FLOW03-I7 · Single Active Invoice | ✅ (Spec) |
| Review = evento, no estado | ✅ T2 |
| `paid` terminal | ✅ T3 |
| Sin parciales / reembolsos / void / NC en v1 | ✅ |

---

## Significado

Tercer flujo de negocio certificado con el mismo patrón:  
**SPEC → Freeze → Runner → una transición/PR → FULL PASS → Tag**.

## Hitos Git

```text
ps002c-pass   · Platform
flow01-pass   · FLOW-01 Kitchen → Delivery
flow02-pass   · FLOW-02 Delivery Incidents
flow03-pass   · FLOW-03 Billing  ← este hito
```
