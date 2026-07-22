# EC-003 — Delivery fallida

**Invariant(s) bajo prueba:** INV-041 · INV-022  
**Validation Report:** —

## Pregunta de refutación

¿Una Delivery puede terminar en **fallo** sin que Route se marque como «todo entregado»?

## Condición límite

Destinatario ausente. Producto devuelto a cocina. Route aún en curso.

## Resultado esperado del modelo

- Transición Delivery → `Failed` (o equivalente) con evento explícito.  
- Route no cierra como éxito global ciego.  
- Order no pasa a Delivered sin confirmación de destinatario.

## Resultado

⏳ Pendiente
