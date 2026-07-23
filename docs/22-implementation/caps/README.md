# Capabilities — orden de conexión (Cursor)

**Una Capability por tarea.** Preconditions / Postconditions obligatorias.  
Patrón: [CAPABILITY_CONNECTION_PATTERN](../CAPABILITY_CONNECTION_PATTERN.md).  
Checklist: [PR_TECHNICAL_CHECKLIST](../PR_TECHNICAL_CHECKLIST.md).

| ID | Capability | Mock | Real | Estado | Happy Path | Doc |
|----|------------|------|------|--------|------------|-----|
| CAP-001 | Auth | — | ✅ | Connected ✓ | ✔ | [CAP-001](./CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | ❌ | ✅ | Connected ✓ | Parcial | [CAP-002](./CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | ❌ | ✅ | Connected ✓ | Parcial | [CAP-003](./CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | ⏳ | ⏳ | Scaffold | ✖ | [CAP-004](./CAP-004-order-programming.md) ← **siguiente** |
| CAP-005 | Order Summary | ⏳ | ⏳ | Scaffold | ✖ | [CAP-005](./CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | ⏳ | ⏳ | Scaffold | ✖ | [CAP-006](./CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ⏳ | ⏳ | Scaffold | ✖ | [CAP-007](./CAP-007-order-history.md) |

HP-001: [HAPPY_PATHS](../HAPPY_PATHS.md) · Tras CAP-006: [ORR](../ORR.md).
