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

Cada CAP declara **Preconditions** y **Postconditions** en su doc (`caps/CAP-00x`).

---

## Hito

> **Primer Happy Path sin mocks** — no «CAP-002 terminada».

---

## LEVEL 1 — Infrastructure

| ID | Capability | Nivel | Happy Path | Doc |
|----|------------|-------|------------|-----|
| CAP-001 | Auth & User Context | ▓▓░░ | N/A | [caps](./caps/CAP-001-auth-user-context.md) |

**Happy Path** = ¿esta CAP ya aporta datos/flujo real al recorrido operativo E2E?  
(No es cobertura funcional completa.)

---

## LEVEL 2 — Capability Connection

| ID | Capability | Nivel | Happy Path | Doc |
|----|------------|-------|------------|-----|
| CAP-002 | Dish Catalog (lectura) | ▓▓░░ | Parcial | [caps](./caps/CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | ▓░░░ | No | [caps](./caps/CAP-003-weekly-menu.md) ← siguiente |
| CAP-004 | Order Programming | ▓░░░ | No | [caps](./caps/CAP-004-order-programming.md) |
| CAP-005 | Order Summary | ▓░░░ | No | [caps](./caps/CAP-005-order-summary.md) |

---

## LEVEL 3 — Operational Workflow

| ID | Capability | Nivel | Happy Path | Doc |
|----|------------|-------|------------|-----|
| CAP-006 | Order Confirmation | ▓░░░ | No | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ▓░░░ | No | [caps](./caps/CAP-007-order-history.md) |


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

No medir por pantallas. Medir por CAP × estado × contribución al Happy Path × [Knowledge Coverage](./KNOWLEDGE_COVERAGE.md).
