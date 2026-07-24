# EP-002A.3 · Customer Preferences (Favoritos)

**Estado:** Done (implementation)  
**Tras:** [EP-002A.1](./EP002A1_UPCOMING_DELIVERY.md) · [EP-002A.1.1](./EP002A11_OPS_CENTER_ENTRY.md)  
**Cara:** Customer App  
**Principio:** personaliza la experiencia · [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)

---

## Concepto

Favoritos no es solo una lista manual. Es **Customer Preferences** con dos fuentes:

| Fuente | Comportamiento |
|--------|----------------|
| Explícita | El cliente pulsa ♥ |
| Implícita (sugeridos) | Frecuencia alta en historial (≥ 3 pedidos) — **nunca** se marca sola |

---

## Arquitectura

```text
CustomerPreferencesService
 ├── list explicit (customer_dish_favorites)
 ├── frequency from order_items
 ├── intersect published weekly menu
 └── actions per dish (nutrition · add · heart)
```

---

## Acciones (DICT-071)

| Acción | Visible cuando |
|--------|----------------|
| Ver ficha / nutrición | Siempre |
| Añadir al pedido | Plato ∈ menú publicado esta semana → `/app/schedule` |
| Quitar favorito | Solo explícitos |
| Añadir favorito | Solo sugeridos |

Sin disponibilidad → no se muestra «Añadir al pedido».

---

## Persistencia

Migration: `customer_dish_favorites` (soft-delete, RLS owner/staff).

Ruta: `/app/favorites` · Home · Settings · corazón en detalle de plato.
