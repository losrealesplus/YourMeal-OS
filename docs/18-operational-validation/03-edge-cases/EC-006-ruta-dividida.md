# EC-006 — Ruta dividida

**Invariant(s) bajo prueba:** INV-042 · INV-052  
**Validation Report:** —

## Pregunta de refutación

¿Una misma ventana de entrega puede partirse en dos Routes sin duplicar Deliveries ni perder ventana temporal?

## Condición límite

8 Deliveries. Un vehículo solo cubre 4 en tiempo. Segundo vehículo para el resto. Misma ventana.

## Resultado esperado del modelo

- Dos Routes con ventana explícita cada una.  
- Cada Delivery pertenece a exactamente una Route (INV-014).  
- Orden: Packaging antes de ambas Routes.

## Resultado

⏳ Pendiente
