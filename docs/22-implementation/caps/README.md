# Capabilities — orden de conexión (Cursor)

**Una Capability por tarea.**  
Master: [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md).  
Estados: [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md).

| ID | Capability | Estado objetivo próximo | Doc |
|----|------------|-------------------------|-----|
| CAP-001 | Auth & User Context | Connected ✓ | [CAP-001](./CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | Connected | [CAP-002](./CAP-002-dish-catalog.md) ← **siguiente (solo lectura)** |
| CAP-003 | Weekly Menu | Connected | [CAP-003](./CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | Connected | [CAP-004](./CAP-004-order-programming.md) |
| CAP-005 | Order Summary | Connected | [CAP-005](./CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | Operational (Happy Path) | [CAP-006](./CAP-006-order-confirmation.md) |
| CAP-007 | Order History | Connected | [CAP-007](./CAP-007-order-history.md) |

Después: Production · Delivery · Admin (CAP-xxx posteriores).
