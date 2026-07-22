# EC-001 — Dos Production Batch compitiendo por el mismo Stock

**Invariant(s) bajo prueba:** INV-034 · INV-050  
**Validation Report:** —

## Pregunta de refutación

¿Puede el modelo impedir que dos Batches consuman el mismo Stock Available por encima del físico?

## Condición límite

Mismo Ingredient. Dos Batches del mismo Plan (o planes distintos) con Start casi simultáneo. Stock = suma exacta de uno solo.

## Resultado esperado del modelo

- Check antes de `Start` en cada Batch.  
- Segundo Batch **bloqueado** o reserva explícita (Stock Reserved).  
- Nunca Available negativo silencioso.

## Resultado

⏳ Pendiente
