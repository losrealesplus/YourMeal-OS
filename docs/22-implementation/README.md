# 22 · Implementation — demostrar FOPEBA en software

<<<<<<< HEAD
**Objetivo:** demostrar que FOPEBA produce software operacional de alta calidad.  
**Lovable:** relevo visual cerrado. **Cursor:** conectar capacidades certificadas.
=======
**Objetivo (desde CAP-002):** demostrar que FOPEBA puede producir software operacional de alta calidad.  
**Lovable:** relevo visual cerrado (no pedir más infraestructura).  
**Cursor:** ingeniero — conectar capacidades certificadas, no pantallas.
>>>>>>> origin/cursor/cap-002-dish-catalog-read-f54a

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
<<<<<<< HEAD
| [CAPABILITY_CONNECTION_PATTERN](./CAPABILITY_CONNECTION_PATTERN.md) | Patrón OM→Repo→Query→Hook→UI |
| [HAPPY_PATHS](./HAPPY_PATHS.md) | HP-001…003 |
| [ORR](./ORR.md) | Pausar tras HP-001 |
| [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md) | Checklist desde CAP-003 |
| [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md) | Contexto permanente |
| [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md) | Mock / Real / Happy Path |
| [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) | Primer pedido → FOV |
| [caps/](./caps/README.md) | CAP-001…007 |
| [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) | Constitución |
=======
| [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md) | **L1→L4** · objetivo · hito Happy Path |
| [KNOWLEDGE_COVERAGE](./KNOWLEDGE_COVERAGE.md) | Métrica OM ↔ código |
| [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md) | Contexto permanente |
| [PR_CHANGE_LEVELS](./PR_CHANGE_LEVELS.md) | Un PR = un nivel (no mezclar) |
| [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) | Hito: primer pedido sin mocks |
| [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) | Constitución |
| [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md) | CAP × estado |
| [caps/](./caps/README.md) | CAP-001…007 — **CAP-003** siguiente |
| [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md) | Implementation is Knowledge Materialization |
>>>>>>> origin/cursor/cap-002-dish-catalog-read-f54a

---

## Siguiente

<<<<<<< HEAD
1. Master Prompt en sesión Cursor.  
2. **[CAP-004 Order Programming](./caps/CAP-004-order-programming.md)** — primera mutación.  
3. CAP-005 → CAP-006 → **ORR** → FOV.
=======
1. Pegar [Master Prompt](./CURSOR_MASTER_PROMPT.md) en la sesión Cursor.  
2. Ejecutar **[CAP-003 Weekly Menu](./caps/CAP-003-weekly-menu.md)** (Level 2; CAP-002 lectura Connected).  
3. Avanzar CAP-004…007 hacia el **Happy Path sin mocks** (Level 3→4).
>>>>>>> origin/cursor/cap-002-dish-catalog-read-f54a

---

## Evaluación

| Área | Estado |
|------|--------|
<<<<<<< HEAD
| CAP-001 Auth | Connected · Real |
| CAP-002 Dish Catalog | Connected · Real |
| CAP-003 Weekly Menu | Connected · Real |
| CAP-004…007 | Scaffold |
| HP-001 | Parcial (catálogo + menú) |
=======
| Objetivo FOPEBA→software | ✅ Declarado |
| Product Skeleton UX | ✅ |
| L1 CAP-001 Auth | Connected |
| L2 CAP-002 Dish Catalog (lectura) | Connected |
| L2 CAP-003…005 | ⏳ CAP-003 siguiente |
| L3 Workflow / L4 FOV | ⏳ |
>>>>>>> origin/cursor/cap-002-dish-catalog-read-f54a
| Business logic inventada | 🔒 STOP |
