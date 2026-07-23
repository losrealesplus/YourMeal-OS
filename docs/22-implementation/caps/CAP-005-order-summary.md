# CAP-005 — Order Summary

**Estado:** Scaffold → Connected  
**Depende de:** CAP-004 Connected  

---

## Preconditions

- CAP-004 = Connected (Draft order persistido)  
- Auth · tenant  

## Postconditions

- Resumen muestra datos reales del pedido Draft  
- Sin layout nuevo · sin confirmación (CAP-006)  
- Typecheck limpio · Happy Path Parcial  

---

## Objetivo

Conectar resumen del pedido a datos reales. Sin cambiar layout.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order · Order Item · Dish |
| Mock / Real | ⏳ → ✅ |

## Prompt

```text
Implementar CAP-005 Order Summary.
No modificar pantallas ni componentes.
Solo conectar datos reales al resumen.
Typecheck limpio. Formato de cierre oficial.
Estado objetivo: Connected.
```
