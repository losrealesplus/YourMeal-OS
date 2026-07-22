# VS-007 — Repartidor ausente

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

¿Route y Delivery permiten **reasignación** o incidencia sin confirmar entregas que no ocurrieron (INV-041 · INV-022)?

## Narrativa operativa

Driver enfermo. Route en `Ready`. Deliveries pendientes. Segundo vehículo disponible con ventana más estrecha.

## Cadena de comprobación

| Capa | Tensión | Coherente |
|------|---------|-----------|
| Core Objects | Delivery Route · Vehicle · Delivery | ⏳ |
| Lifecycles | Route depart · Delivery failed / rescheduled | ⏳ |
| Checks | ¿Puede confirmarse Route? · viabilidad | ⏳ |
| Invariants | INV-022 · INV-042 · INV-050…053 | ⏳ |

## Hipótesis de rotura

Cerrar Route implica Delivered; no hay estado intermedio operativo real.

## Resultado preliminar

⏳ Pendiente
