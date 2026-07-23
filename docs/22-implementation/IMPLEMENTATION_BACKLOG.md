# Implementation Backlog — por Capability

Escala: [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)

```text
Scaffold → Connected → Operational → Field Validated
```

| Símbolo | Nivel |
|---------|-------|
| ▓░░░ | Scaffold |
| ▓▓░░ | Connected |
| ▓▓▓░ | Operational |
| ▓▓▓▓ | Field Validated |

Cada CAP declara **Preconditions** y **Postconditions** en su doc (`caps/CAP-00x`).

---

## CAP — Happy Path

| ID | Capability | Estado | Happy Path | Doc |
|----|------------|--------|------------|-----|
| CAP-001 | Auth & User Context | Connected | N/A | [caps](./caps/CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog (lectura) | Connected | Parcial | [caps](./caps/CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | Scaffold | No | [caps](./caps/CAP-003-weekly-menu.md) ← siguiente |
| CAP-004 | Order Programming | Scaffold | No | [caps](./caps/CAP-004-order-programming.md) |
| CAP-005 | Order Summary | Scaffold | No | [caps](./caps/CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | Scaffold | No | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | Scaffold | No | [caps](./caps/CAP-007-order-history.md) |

**Happy Path** = ¿esta CAP ya aporta datos/flujo real al recorrido operativo E2E?  
(No es cobertura funcional completa.)

---

## Infra transversal

| Capacidad | Nivel |
|-----------|-------|
| Audit (`audit_log`) | ▓▓░░ |
| Feature Flags | ▓▓░░ |
| Localization (6 idiomas) | ▓▓░░ |

---

## Posterior (no mezclar con Happy Path)

| Área | Nivel |
|------|-------|
| Planning / Batch / Packaging | ▓░░░ |
| Delivery | ▓░░░ |
| Admin Suite (conexión) | ▓░░░ |
| Invoices / Notifications / Analytics | ░░░░ |

---

## Anti-métrica

No medir por pantallas. Medir por CAP × estado × contribución al Happy Path.
