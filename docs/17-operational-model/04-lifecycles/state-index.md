# Índice de estados (referencia rápida)

Solo **nombres de estados**.  
El comportamiento vive en [transiciones](./spine-transitions.md) — no aquí.

**Dynamics (v0.2):** `Paused` y `Held` son estados de **protección**; el patrón de recuperación los libera hacia Happy Path. Ver [Lifecycles 2.0](../07-operational-dynamics/01-operational-lifecycles-2.0.md).

| Objeto | Estados |
|--------|---------|
| Weekly Menu | Draft · Published · Locked · Archived |
| Order | Draft · Confirmed · In production · Packed · Out for delivery · Delivered · Closed · Cancelled |
| Production Plan | Draft · Ready · In execution · Completed · Archived |
| Production Batch | Planned · Ready to cook · In progress · **Paused** · Completed · Closed |
| Packaging | Pending · In progress · Complete · **Held** · Handed to route |
| Delivery Route | Draft · Ready · Departed · In progress · Completed · Closed |
| Delivery | Pending · Attempted · Delivered · Failed · Incident · Closed |
| Payment | Not due · Due · Pending at delivery · Captured · Failed · Settled |
| Label | Pending · Printed · Applied · Void |
| Stock | Available · Reserved · Consumed/Adjusted |
| Lot *(Supporting · Traceability)* | Received · Consumed · Exhausted · Quarantined *(opcional)* |
| Location *(Supporting · Spatial)* | Draft · Active · Inactive |
| Dish / Recipe / Ingredient | Draft · Active · Inactive · Archived |

Implementación técnica: [STATE_MACHINES.md](../../12-domain-model/STATE_MACHINES.md).
