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

---

## CAP — Happy Path

| ID | Capability | Nivel | Doc |
|----|------------|-------|-----|
| CAP-001 | Auth & User Context | ▓▓░░ | [caps](./caps/CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | ▓░░░ | [caps](./caps/CAP-002-dish-catalog.md) ← siguiente |
| CAP-003 | Weekly Menu | ▓░░░ | [caps](./caps/CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | ▓░░░ | [caps](./caps/CAP-004-order-programming.md) |
| CAP-005 | Order Summary | ▓░░░ | [caps](./caps/CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | ▓░░░ | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ▓░░░ | [caps](./caps/CAP-007-order-history.md) |

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

No medir por pantallas. Medir por CAP × estado.
