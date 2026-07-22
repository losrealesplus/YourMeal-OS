# Índice de estados (referencia rápida)

Solo **nombres de estados**.  
El comportamiento vive en [transiciones](./spine-transitions.md) — no aquí.

| Objeto | Estados |
|--------|---------|
| Weekly Menu | Draft · Published · Locked · Archived |
| Order | Draft · Confirmed · In production · Packed · Out for delivery · Delivered · Closed · Cancelled |
| Production Plan | Draft · Ready · In execution · Completed · Archived |
| Production Batch | Planned · Ready to cook · In progress · Completed · Closed |
| Packaging | Pending · In progress · Complete · Handed to route |
| Delivery Route | Draft · Ready · Departed · In progress · Completed · Closed |
| Delivery | Pending · Attempted · Delivered · Failed · Incident · Closed |
| Payment | Not due · Due · Pending at delivery · Captured · Failed · Settled |
| Label | Pending · Printed · Applied · Void |
| Stock | Available · Reserved · Consumed/Adjusted |
| Dish / Recipe / Ingredient | Draft · Active · Inactive · Archived |

Implementación técnica: [STATE_MACHINES.md](../../12-domain-model/STATE_MACHINES.md).
