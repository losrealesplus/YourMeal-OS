# Accounting Journey · AJ-01 → AJ-05 (Re-Certification)

**Epic:** EP-OPS-003 · Accounting Correction + Re-Certification  
**Metodología:** FROZEN · 1ª validación CLOSED  
**Workspace:** `/admin/accounting`  
**Actor:** `accounting`  
**Input:** Orders Delivered · Issues Resolved (continuidad)  
**Outcome:** **Financial Records Complete**  
**Pasada FAIL:** 2026-07-28 · **Re-Certification:** 2026-07-28  
**Gate:** **OBSERVATIONS** · **Status:** **CERTIFIED**  

```text
FAIL (PlaceholderPanel)
        ↓
Correction: invoice ← delivered orders · payment · period complete
        ↓
Re-Certification
        ↓
Financial Records Complete ✅
```

Upstream Kitchen · Delivery · Support **permanecen CERTIFIED**.

---

## Continuidad Input

| Check | Resultado |
|-------|:---------:|
| Lista pedidos `delivered` | ✅ |
| Emite factura con importe = suma pedidos | ✅ |
| No reabre Delivery/Support | ✅ |

---

## AJ stages post-corrección

| Stage | Resultado | Evidencia |
|-------|:---------:|-----------|
| AJ-01 Entrada | ✅ | `/admin/accounting` · cap · homePath accounting-only |
| AJ-02 Facturación | ✅ | `createInvoiceFromOrders` · `invoice_orders` |
| AJ-03 Cobros | ✅ | `recordPayment` · pending → paid |
| AJ-04 Conciliación | ⚠ | Thin: paidTotal vs amount en UI (OBS) |
| AJ-05 Cierre periodo | ✅ | `derivePeriodComplete` · KPI Periodo Completo |

**Outcome:**

```text
Financial Records Complete =
  periodo con ≥1 factura anclada a delivered
  AND pending=0 AND overdue=0
```

---

## Recorrido E2E

```text
Input: Orders Delivered
  → /admin/accounting
  → seleccionar delivered facturables
  → Emitir factura
  → Registrar cobro
Outcome: periodo Completo (Financial Records Complete)
```

Migración: `20260728210000_accounting_invoice_orders.sql`  
Dominio/tests: `src/modules/accounting` PASS  

---

## Pregunta maestra

> ¿Puede un agente Accounting cerrar el ciclo financiero operativo del alcance piloto sin salir de su Workspace?

**Sí** (actor `accounting`) — con observaciones (conciliación thin · flag nav · sin pasarela).

**Gate:** OBSERVATIONS · **CERTIFIED** · Outcome **Financial Records Complete**
