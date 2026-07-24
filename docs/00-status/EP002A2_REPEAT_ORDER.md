# EP-002A.2 · Historial + Repetir pedido

**Estado:** Done (implementation)  
**Tras:** [EP-002A.1](./EP002A1_UPCOMING_DELIVERY.md)  
**Cara:** Customer App · CJ-001  
**Principio:** ahorra tiempo (reutilizar el pasado) · [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)

---

## Objetivo

Reducir el tiempo para realizar un nuevo pedido **reutilizando** un pedido histórico — sin copiar a ciegas.

```text
Pedido histórico
        │
RepeatOrderService
        │
Validar menú publicado (semana actual)
        │
┌───────┴────────┐
Disponibles     No disponibles
│               │
└──► borrador   mensaje (no se añaden)
        │
Detalle / confirmación del nuevo pedido
```

---

## Historial

Cada fila muestra datos reales:

| Campo | Fuente |
|-------|--------|
| Fecha | Día de entrega (primer `day_date`) |
| Estado | `orders.status` |
| Platos | Nombres vía catálogo |
| Importe | `orders.total` |
| Dirección | `delivery_address_id` o default del cliente |
| Empresa | `company_id` → `companies.name` (si aplica) |

Acciones: **Ver pedido** · **Repetir pedido** (oculto en borrador/cancelado o si ningún plato está en el menú).

---

## RepeatOrderService

| Método | Rol |
|--------|-----|
| `preview` | Intersecta líneas históricas ∩ oferta publicada |
| `execute` | Crea borrador solo con disponibles → navega al detalle |

Reglas:

- Misma lógica de oferta que `OrderService.programDraft` (precios del catálogo, nunca del histórico).
- Preferencia de día: mismo weekday; si no, primer día con oferta.
- Plato ausente → `unavailable` + copy «Este plato ya no está disponible.»
- Pedidos cancelados no se repiten.

---

## Definition of Done

Un cliente puede abrir Historial, ver un pedido pasado con datos reales y, con un toque, obtener un **borrador nuevo** alineado al menú de esta semana — sin platos fantasma.
