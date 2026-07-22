# VS-003 — Pedido masivo

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

¿Un pico de demanda (ej. Company Account con 200 Beneficiaries) rompe la relación **un Plan · muchos Batches** o INV-011 (Batch → un Plan)?

## Narrativa operativa

Pedido corporativo único que multiplica Order Items del mismo Dish. Misma ventana de entrega. Stock justo.

## Cadena de comprobación

| Capa | Tensión | Coherente |
|------|---------|-----------|
| Core Objects | Order · Plan · Batch · Stock | ⏳ |
| Dependencies | `aggregates` demanda en Plan | ⏳ |
| Lifecycles | Plan Confirmed → múltiples Batch Start | ⏳ |
| Checks | Stock suficiente antes de Batch Start | ⏳ |
| Invariants | INV-011 · INV-031 · INV-034 | ⏳ |

## Hipótesis de rotura

Necesidad de Batch «compartido» entre Plans o Stock negativo silencioso.

## Resultado preliminar

⏳ Pendiente
