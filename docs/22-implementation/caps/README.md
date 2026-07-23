# Capabilities — orden de conexión (Cursor)

**Una Capability por tarea.**  
Cada CAP declara **Preconditions** y **Postconditions**.  
Master: [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md).  
Niveles: [ETAPA_2_LEVELS](../ETAPA_2_LEVELS.md) · Cobertura: [KNOWLEDGE_COVERAGE](../KNOWLEDGE_COVERAGE.md).  
Estados: [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md).

| ID | Capability | Level | Estado | Happy Path | Doc |
|----|------------|-------|--------|------------|-----|
| CAP-001 | Auth & User Context | L1 | Connected ✓ | N/A | [CAP-001](./CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | L2 | Connected ✓ | Parcial | [CAP-002](./CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | L2 | Scaffold | No | [CAP-003](./CAP-003-weekly-menu.md) ← **siguiente** |
| CAP-004 | Order Programming | L2 | Scaffold | No | [CAP-004](./CAP-004-order-programming.md) |
| CAP-005 | Order Summary | L2 | Scaffold | No | [CAP-005](./CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | L3 | Scaffold | No | [CAP-006](./CAP-006-order-confirmation.md) |
| CAP-007 | Order History | L3 | Scaffold | No | [CAP-007](./CAP-007-order-history.md) |

**Hito:** Happy Path sin mocks (L3→L4) — [HAPPY_PATH_E2E](../HAPPY_PATH_E2E.md).

Después: Production · Delivery · Admin (CAP-xxx posteriores).
