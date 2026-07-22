# EC-005 — Ingrediente sustituido

**Invariant(s) bajo prueba:** INV-033  
**Validation Report:** —

## Pregunta de refutación

¿Sustituir Ingredient en producción real sin cambiar Recipe activa rompe «producción desde Recipe»?

## Condición límite

Pollo agotado. Cocina usa pavo con ajuste manual de cantidad. Mismo Dish.

## Resultado esperado del modelo

- Evento explícito (ajuste de Batch / versión de Recipe / incidencia).  
- No consumo Stock sin traza a Recipe o excepción documentada.

## Resultado

⏳ Pendiente
