# VS-006 — Cancelación (Consumer / Beneficiary)

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

¿Order `Cancelled` después de `Confirmed` mantiene trazabilidad de Plan/Batch sin huérfanos (INV-031) ni Payment incoherente?

## Narrativa operativa

Beneficiary cancela el jueves para entrega del sábado. Plan ya cerrado parcialmente.

## Cadena de comprobación

| Capa | Tensión | Coherente |
|------|---------|-----------|
| Core Objects | Order · Plan · Batch · Payment | ⏳ |
| Lifecycles | Order → Cancelled | ⏳ |
| Checks | ¿Puede cancelarse? (ventana · estado producción) | ⏳ |
| Invariants | INV-004 · INV-023 · INV-040 | ⏳ |

## Hipótesis de rotura

Batch ya iniciado sin regla de ajuste de demanda; Payment liquidado sobre Order cancelado.

## Resultado preliminar

⏳ Pendiente
