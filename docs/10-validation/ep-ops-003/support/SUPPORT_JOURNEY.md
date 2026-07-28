# Support Journey · SJ-01 → SJ-05

**Epic:** EP-OPS-003 · Support Journey Certification  
**Metodología:** FROZEN  
**Workspace:** `/admin/support`  
**Actor:** `support` (caps `support.read` / `support.write`)  
**Input (continuidad):** **Orders Delivered** (Delivery CERTIFIED · OBSERVATIONS)  
**Outcome esperado:** **Issues Resolved**  
**Fecha pasada:** 2026-07-28  
**Gate:** **FAIL**  

```text
Delivery Outcome: Orders Delivered
        ↓
SJ-01 … SJ-05
        ↓
Outcome Issues Resolved  ✗  no alcanzable en código actual
```

**Estabilidad upstream:** Kitchen y Delivery **permanecen CERTIFIED**. Este FAIL es del Journey Support — no reabre Delivery salvo evidencia de Outcome falso (no hallada).

---

## Continuidad Input

| Check | Resultado |
|-------|:---------:|
| Ve historial de pedidos incl. `delivered` | ✅ `getCustomerOrders` |
| Puede abrir nota/incidencia sobre cliente con entregas | ✅ `addSupportNote` |
| No re-certifica Delivery/Kitchen | ✅ |

---

## SJ-01 · Recepción

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Localizar cliente / caso | ✅ | `/admin/support` · búsqueda · filtros · `?customerId=` |
| Ver pedidos relacionados | ✅ | Ficha + lista de pedidos |

---

## SJ-02 · Clasificación

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Tipificar nota | ⚠ | `kind`: note · incident · complaint · request · allergy_update |
| Prioridad / severidad | ✗ | No existe |

---

## SJ-03 · Seguimiento

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Notas append-only | ✅ | `support_notes` |
| Estados de caso | ✗ | Sin state machine |
| Vínculo nota ↔ pedido | ✗ | Sin `order_id` |

---

## SJ-04 · Resolución

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Acción resolutiva estructurada | ✗ | Solo texto libre · sin resolve API |

---

## SJ-05 · Cierre → Issues Resolved

| Check | Resultado | Evidencia |
|-------|:---------:|-----------|
| Cerrar / archivar incidencia | ✗ | No close/archive |
| KPI “incidencias abiertas” decrece | ✗ | Cuenta todos incident/complaint forever |
| Outcome demostrable | ✗ | **Bloquea CERTIFIED** |

---

## Pregunta maestra

> ¿Puede un agente, partiendo de Orders Delivered, gestionar una incidencia completa sin abandonar su Workspace?

**Hasta seguimiento: parcial. Hasta Issues Resolved: NO.**

**Gate: FAIL** · **Status: NOT CERTIFIED** · Outcome no alcanzado.
