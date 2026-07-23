# CAP-005 — Order Summary

**Estado:** Scaffold → **Connected**  
**Nivel PR:** Capability  

---

## Preconditions

- CAP-004 Connected (Draft persistido)  
- Auth · tenant  

## Postconditions

- `/app/orders/$orderId` muestra datos reales vía `useOrder()`  
- Tras programar (CAP-004) se abre el resumen del Draft  
- Sin Confirm (CAP-006) · sin rediseño  
- Typecheck + tests  

## Alcance

```text
OrderRepository.findByIdWithItems
        ↓
fetchOrderSummary + CatalogDish
        ↓
useOrder()
        ↓
Order Summary UI (existente)
```

## Fuera de alcance

Confirmación · lista de historial (CAP-007) · dirección de entrega real · mocks del dashboard.
