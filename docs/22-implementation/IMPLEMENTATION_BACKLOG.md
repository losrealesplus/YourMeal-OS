# Implementation Backlog — por Capability

Escala módulo: [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)  
Niveles Etapa 2: [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md)  
Cobertura: [KNOWLEDGE_COVERAGE](./KNOWLEDGE_COVERAGE.md)  
Patrón lectura: [CAPABILITY_CONNECTION_PATTERN](./CAPABILITY_CONNECTION_PATTERN.md)  
Patrón mutación: [MUTATION_PATTERN](./MUTATION_PATTERN.md)  
Recorridos: [HAPPY_PATHS](./HAPPY_PATHS.md) · [ORR](./ORR.md) · [HP-001 Evidence](./HP-001_EVIDENCE_LOG.md)  
Checklist: [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md)

| Mock | Real | Significado |
|------|------|------------|
| — | ✅ | Infra |
| ❌ | ✅ | Sin mock en el flujo |
| ⏳ | ⏳ | Scaffold / parcial |

---

## CAP — HP-001

| ID | Capability | Mock | Real | Estado | Happy Path | Doc |
|----|------------|------|------|--------|------------|-----|
| CAP-001 | Auth | — | ✅ | Connected | ✔ | [caps](./caps/CAP-001-auth-user-context.md) |
| CAP-002 | Dish Catalog | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-002-dish-catalog.md) |
| CAP-003 | Weekly Menu | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-003-weekly-menu.md) |
| CAP-004 | Order Programming | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-004-order-programming.md) |
| CAP-005 | Order Summary | ❌ | ✅ | Connected | Parcial | [caps](./caps/CAP-005-order-summary.md) |
| CAP-006 | Order Confirmation | ❌ | ✅ | Operational | ✔ HP-001 | [caps](./caps/CAP-006-order-confirmation.md) |
| CAP-007 | Order History | ⏳ | ⏳ | Scaffold | ✖ | [caps](./caps/CAP-007-order-history.md) ← siguiente |

**Hito:** `HP-001 · Operational` → [ORR](./ORR.md) **PASSED \| BLOCKED** → Ready for FOV.  
Pre-piloto: [PRE_PILOT_AUDIT](../00-status/PRE_PILOT_AUDIT.md).  
Fase metodológica: [Acta](../00-status/ACTA_METHODOLOGY_CONSTRUCTION_CLOSED.md).  
A partir de CAP-004: **ejecutar el patrón**, no añadir metodología nueva.

---

## Anti-métrica

No medir por pantallas. Medir por CAP × Mock/Real × Happy Path × [Knowledge Coverage](./KNOWLEDGE_COVERAGE.md).

