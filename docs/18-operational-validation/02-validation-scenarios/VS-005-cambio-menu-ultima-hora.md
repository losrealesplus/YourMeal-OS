# VS-005 — Cambio de menú de última hora

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

Si Weekly Menu ya está Published y hay Orders Confirmed, ¿qué transiciones permiten cambiar oferta **sin** violar compromiso de demanda?

## Narrativa operativa

Proveedor falla. Dish sustituido en carta con 48h de antelación insuficiente. Orders ya confirmados con Dish original.

## Cadena de comprobación

| Capa | Tensión | Coherente |
|------|---------|-----------|
| Core Objects | Weekly Menu · Dish · Order · Order Item | ⏳ |
| Lifecycles | Menu · Order Cancel / amend | ⏳ |
| Checks | ¿Puede publicarse cambio? ¿Afecta confirmados? | ⏳ |
| Invariants | INV-012 · INV-032 · Draft no compromete | ⏳ |

## Hipótesis de rotura

No hay transición para «sustitución de Dish en Order confirmado» — solo parches manuales.

## Resultado preliminar

⏳ Pendiente
