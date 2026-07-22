# VS-001 — Semana normal

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

¿Puede la espina `Menu → Order → Plan → Batch → Packaging → Route → Delivery → Payment` narrarse **sin saltos ni conceptos huérfanos** en una semana estándar?

## Narrativa operativa

- Lunes: Weekly Menu publicado para la semana.  
- Martes–jueves: Consumers y Beneficiaries confirman Orders.  
- Viernes madrugada: Production Plan cerrado; Batches por Dish.  
- Viernes: Packaging y etiquetas; Route asignada.  
- Sábado: Deliveries en ventana; Payments liquidados.

## Cadena de comprobación

| Capa | Participación esperada | Coherente |
|------|------------------------|-----------|
| Core Objects | Weekly Menu · Order · Plan · Batch · Packaging · Route · Delivery · Payment | ⏳ |
| Dependencies | `offers` · `commits` · `plans` · `produces` · `packages` · `routes` · `delivers` · `settles` | ⏳ |
| Lifecycles | Menu Published · Order Confirmed · Batch Complete · Delivery Delivered | ⏳ |
| Checks | ¿Puede confirmarse? · ¿Puede iniciarse Batch? · ¿Puede cerrarse Route? | ⏳ |
| Invariants | INV-021 (orden causal) · INV-050…055 (operación) | ⏳ |

## Hipótesis de rotura

- Objeto de la espina sin verbo dominante.  
- Transición sin Check donde la operación real exige uno.  
- Invariant que impide el flujo «obvio» sin excepción documentada.

## Resultado preliminar

⏳ Pendiente de ejecución (mesa redonda o walkthrough con cocina).
