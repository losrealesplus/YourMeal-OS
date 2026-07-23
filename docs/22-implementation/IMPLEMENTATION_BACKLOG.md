# Implementation Backlog — por Capability

Escala módulo: [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)  
Niveles Etapa 2: [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md)  
Cobertura: [KNOWLEDGE_COVERAGE](./KNOWLEDGE_COVERAGE.md)

```text
Scaffold → Connected → Operational → Field Validated
```

| Símbolo | Nivel módulo |
|---------|--------------|
| ▓░░░ | Scaffold |
| ▓▓░░ | Connected |
| ▓▓▓░ | Operational |
| ▓▓▓▓ | Field Validated |

---

## Hito

> **Primer Happy Path sin mocks** — no «CAP-002 terminada».

---

## LEVEL 1 — Infrastructure

| ID | Capability | Nivel | Doc |
|----|------------|-------|-----|
| CAP-001 | Auth & User Context | ▓▓░░ | [caps](./caps/CAP-001-auth-user-context.md) |

---

## LEVEL 2 — Capability Connection

| ID | Capability | Nivel | Doc |
|----|------------|-------|-----|
| CAP-002 | Dish Catalog (lectura) | ▓░░░ | [caps](./caps/CAP-002-dish-catalog.md) ← siguiente |
| CAP-003 | Weekly Menu | ▓░░░ | [caps](./caps/CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | ▓░░░ | [caps](./caps/CAP-004-order-programming.md) |
| CAP-005 | Order Summary | ▓░░░ | [caps](./caps/CAP-005-order-summary.md) |

---

## LEVEL 3 — Operational Workflow

| ID | Capability | Nivel | Doc |
|----|------------|-------|-----|
| CAP-006 | Order Confirmation | ▓░░░ | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ▓░░░ | [caps](./caps/CAP-007-order-history.md) |

Ensamblaje: [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md).

---

## LEVEL 4 — Operational Verification

| Paso | Estado |
|------|--------|
| Happy Path E2E sin mocks | ⏳ |
| Cliente real EatClean | ⏳ |
| FOV / FER | ⏳ (Carril A) |

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

No medir por pantallas. Medir por CAP × estado × [Knowledge Coverage](./KNOWLEDGE_COVERAGE.md).
