# Implementation Backlog — por Capability

Escala: [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)  
Patrón: [CAPABILITY_CONNECTION_PATTERN](./CAPABILITY_CONNECTION_PATTERN.md)  
Recorridos: [HAPPY_PATHS](./HAPPY_PATHS.md)  
Checklist: [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md)

Cada CAP declara **Preconditions** y **Postconditions**.

| Mock | Real | Significado |
|------|------|------------|
| — | ✅ | Infra / no aplica mock de dominio |
| ❌ | ✅ | Lectura/escritura real; mock eliminado del flujo |
| ⏳ | ⏳ | Aún scaffold / parcial |

---

## CAP — Happy Path (HP-001)

| ID | Capability | Mock | Real | Estado | Happy Path | Doc |
|----|------------|------|------|--------|------------|-----|
| CAP-001 | Auth & User Context | — | ✅ | Connected | ✔ | [caps](./caps/CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog (lectura) | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu (lectura) | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | ⏳ | ⏳ | Scaffold | ✖ | [caps](./caps/CAP-004-order-programming.md) ← siguiente |
| CAP-005 | Order Summary | ⏳ | ⏳ | Scaffold | ✖ | [caps](./caps/CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | ⏳ | ⏳ | Scaffold | ✖ | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ⏳ | ⏳ | Scaffold | ✖ | [caps](./caps/CAP-007-order-history.md) |

**Hito:** HP-001 sin mocks → [ORR](./ORR.md) → FOV.

---

## Infra transversal

| Capacidad | Real | Nivel |
|-----------|------|-------|
| Audit (`audit_log`) | ✅ | Connected |
| Feature Flags | ✅ | Connected |
| Localization (6 idiomas) | ✅ | Connected |

---

## Anti-métrica

No medir por pantallas. Medir por CAP × Mock/Real × Happy Path × [Knowledge Coverage](./KNOWLEDGE_COVERAGE.md) (si existe en rama).
