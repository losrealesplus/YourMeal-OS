# Capabilities — orden de conexión (Cursor)

**Una Capability por tarea.** Preconditions / Postconditions obligatorias.  
Master: [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md).  
Niveles: [ETAPA_2_LEVELS](../ETAPA_2_LEVELS.md) · Cobertura: [KNOWLEDGE_COVERAGE](../KNOWLEDGE_COVERAGE.md).  
Estados: [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md).  
Patrón: [CAPABILITY_CONNECTION_PATTERN](../CAPABILITY_CONNECTION_PATTERN.md) · [MUTATION_PATTERN](../MUTATION_PATTERN.md).  
Checklist: [PR_TECHNICAL_CHECKLIST](../PR_TECHNICAL_CHECKLIST.md).

| ID | Capability | Level | Mock | Real | Estado | Happy Path | Doc |
|----|------------|-------|------|------|--------|------------|-----|
| CAP-001 | Auth | L1 | — | ✅ | Connected ✓ | ✔ | [CAP-001](./CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | L2 | ❌ | ✅ | Connected ✓ | Parcial | [CAP-002](./CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | L2 | ❌ | ✅ | Connected ✓ | Parcial | [CAP-003](./CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | L2 | ❌ | ✅ | Connected ✓ | Parcial | [CAP-004](./CAP-004-order-programming.md) |
| CAP-005 | Order Summary | L2 | ❌ | ✅ | Connected ✓ | Parcial | [CAP-005](./CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | L3 | ❌ | ✅ | Operational ✓ | ✔ HP-001 | [CAP-006](./CAP-006-order-confirmation.md) |
| CAP-007 | Order History | L3 | ⏳ | ⏳ | Scaffold | ✖ | [CAP-007](./CAP-007-order-history.md) |

**Hito:** Happy Path sin mocks (L3→L4) — [HAPPY_PATH_E2E](../HAPPY_PATH_E2E.md).  
**Siguiente:** [ORR](../ORR.md) (PR sin features) → Phase 3 FOV · [Evidence Log](../HP-001_EVIDENCE_LOG.md).

