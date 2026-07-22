# EC-004 — Packaging dañado

**Invariant(s) bajo prueba:** INV-030 · INV-035  
**Validation Report:** —

## Pregunta de refutación

¿Packaging dañado después de `Complete` obliga transición explícita (void / re-pack) sin huérfanos?

## Condición límite

Bolsa rota en almacén frío. Label ya Applied. Batch correcto.

## Resultado esperado del modelo

- Packaging no «desaparece» — transición a void o nuevo Packaging desde Batch.  
- Label Void si aplica.  
- No Delivery con Packaging inválido.

## Resultado

⏳ Pendiente
