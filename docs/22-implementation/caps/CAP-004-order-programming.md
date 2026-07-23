# CAP-004 — Order Programming

**Estado:** Scaffold → Connected  
**Depende de:** CAP-003

---

## Objetivo

Conectar programación del pedido (selección semanal) a estado/persistencia preparatoria — **sin** inventar reglas de confirmación (eso es CAP-006).

## No modificar

UX del flujo de programación · navegación.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Order · Order Item · Menu |
| OM | Order lifecycle (pre-confirm) |

## Prompt

```text
Implementar CAP-004 Order Programming.
No modificar UX ni componentes.
Solo conectar estado/datos reales para programar el pedido.
No inventar reglas de confirmación (CAP-006).
Typecheck limpio. Formato de cierre oficial.
Estado objetivo: Connected.
```
