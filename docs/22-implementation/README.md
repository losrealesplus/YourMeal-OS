# 22 · Implementation — demostrar FOPEBA en software

**Objetivo (desde CAP-002):** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Lovable:** relevo visual cerrado (no pedir más infraestructura).  
**Cursor:** ingeniero — conectar capacidades certificadas, no pantallas.

```text
FOPEBA → certifica
Lovable → UX skeleton
Cursor → ingeniería
GitHub → historia / evidencia
```

---

## Documentos

| Doc | Rol |
|-----|-----|
| [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md) | **L1→L4** · objetivo · hito Happy Path |
| [KNOWLEDGE_COVERAGE](./KNOWLEDGE_COVERAGE.md) | Métrica OM ↔ código |
| [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md) | Contexto permanente |
| [PR_CHANGE_LEVELS](./PR_CHANGE_LEVELS.md) | Un PR = un nivel (no mezclar) |
| [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) | Hito: primer pedido sin mocks |
| [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) | Constitución |
| [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md) | CAP × estado |
| [caps/](./caps/README.md) | CAP-001…007 — **CAP-002 lectura** siguiente |
| [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md) | Implementation is Knowledge Materialization |

---

## Siguiente

1. Pegar [Master Prompt](./CURSOR_MASTER_PROMPT.md) en la sesión Cursor.  
2. Ejecutar **[CAP-002 Dish Catalog — solo lectura](./caps/CAP-002-dish-catalog.md)** (Level 2).  
3. Avanzar CAP-003…007 hacia el **Happy Path sin mocks** (Level 3→4).

---

## Evaluación

| Área | Estado |
|------|--------|
| Objetivo FOPEBA→software | ✅ Declarado |
| Product Skeleton UX | ✅ |
| L1 CAP-001 Auth | Connected |
| L2 CAP-002…005 | ⏳ CAP-002 siguiente |
| L3 Workflow / L4 FOV | ⏳ |
| Business logic inventada | 🔒 STOP |
