# Accounting Journey · AJ-01 → AJ-05 (Re-Certification · Correction P0)

**Epic:** EP-OPS-003 · Accounting Correction P0  
**Metodología:** FROZEN · 1ª validación CLOSED  
**Workspace:** `/admin/accounting`  
**Actor:** `accounting`  
**Input:** Orders Delivered · Issues Resolved  
**Outcome:** **Financial Records Complete**  
**Gate:** **OBSERVATIONS** · **Status:** **CERTIFIED**  
**Bloque G:** **NOT STARTED** (elegible tras 4/4 CERTIFIED)

```text
FAIL (PlaceholderPanel)
        ↓
Correction P0 · Financial Lifecycle
Pending → Review → Processed → Closed
        ↓
Re-Certification
        ↓
Financial Records Complete ✅
```

Upstream Kitchen · Delivery · Support **permanecen CERTIFIED**.

---

## Lifecycle (as-built ≡ brief)

| Brief | As-built |
|-------|----------|
| Pending Financial Items | Pedidos `delivered` + factura `pending` |
| Review | `reviewed_at` · acción Revisar |
| Processed | `recordPayment` → status `paid` |
| Close Financial Period | `closeFinancialPeriod` · `financial_period_closures` |

---

## AJ stages

| Stage | Resultado | Evidencia |
|-------|:---------:|-----------|
| AJ-01 Workspace operativo | ✅ | Sustituye PlaceholderPanel |
| AJ-02 Pending items | ✅ | Billable delivered orders |
| AJ-03 Review | ✅ | `AccountingService.reviewInvoice` |
| AJ-04 Process / Payment | ✅ | Cobro tras Review |
| AJ-05 Close period | ✅ | Cierre explícito → Outcome |

**Outcome:**

```text
Financial Records Complete = financial_period_closures row
                             para el periodo (tras readyToClose)
```

---

## Pregunta maestra (Re-Certification)

> ¿Puede Accounting completar todo su trabajo operativo y alcanzar "Financial Records Complete" sin abandonar su Workspace?

**Sí.**

**Workspace:** Accounting  
**Status:** CERTIFIED  
**Gate:** OBSERVATIONS  
**Outcome:** Financial Records Complete
