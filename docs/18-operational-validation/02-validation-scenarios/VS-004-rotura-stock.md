# VS-004 — Rotura de stock

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

Cuando Stock **Available** < necesidad del Plan, ¿el modelo **bloquea** sin mentir (INV-034) y ofrece camino operativo (Check → acción)?

## Narrativa operativa

Descongelación incompleta. Ingredient crítico insuficiente a las 05:00. Batch pendiente de Start.

## Cadena de comprobación

| Capa | Tensión | Coherente |
|------|---------|-----------|
| Core Objects | Stock · Recipe · Batch · Plan | ⏳ |
| Dependencies | Recipe `requires` Ingredient · Batch `consumes` Stock | ⏳ |
| Lifecycles | Batch: bloqueo en transición Start | ⏳ |
| Checks | ¿Puede iniciarse producción? | ⏳ |
| Invariants | INV-033 · INV-034 | ⏳ |

## Hipótesis de rotura

Producción «a ojo» sin transición; sustitución de ingrediente sin evento explícito.

## Resultado preliminar

⏳ Pendiente
