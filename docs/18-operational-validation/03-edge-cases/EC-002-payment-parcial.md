# EC-002 — Payment parcial

**Invariant(s) bajo prueba:** INV-040 · INV-013  
**Validation Report:** —

## Pregunta de refutación

Si la Organización acepta cobro parcial en ruta, ¿INV-040 («Payment liquida Order») sigue siendo válido o requiere refinamiento?

## Condición límite

Order con importe total. Consumer paga 50 % en entrega. Resto pendiente.

## Resultado esperado del modelo

- O bien: un Payment = liquidación completa (parcial no permitido sin extensión).  
- O bien: MC documenta relación Payment parcial ↔ Order con regla explícita.

## Resultado

⏳ Pendiente — **tensión conocida** en Constitución (ver nota en INV-040).
