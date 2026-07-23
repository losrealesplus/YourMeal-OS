# Capabilities — orden de conexión (Cursor)

**Una Capability por tarea.**  
Cada CAP declara **Preconditions** y **Postconditions**.  
Master: [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md).  
Estados: [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md).

| ID | Capability | Estado | Happy Path | Doc |
|----|------------|--------|------------|-----|
| CAP-001 | Auth & User Context | Connected ✓ | N/A | [CAP-001](./CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | Connected ✓ | Parcial | [CAP-002](./CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | Scaffold | No | [CAP-003](./CAP-003-weekly-menu.md) ← **siguiente** |
| CAP-004 | Order Programming | Scaffold | No | [CAP-004](./CAP-004-order-programming.md) |
| CAP-005 | Order Summary | Scaffold | No | [CAP-005](./CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | Scaffold | No | [CAP-006](./CAP-006-order-confirmation.md) |
| CAP-007 | Order History | Scaffold | No | [CAP-007](./CAP-007-order-history.md) |

Después: Production · Delivery · Admin (CAP-xxx posteriores).
