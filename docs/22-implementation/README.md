# 22 · Implementation — demostrar FOPEBA en software

**Objetivo:** demostrar que FOPEBA produce software operacional de alta calidad.  
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
| [CAPABILITY_CONNECTION_PATTERN](./CAPABILITY_CONNECTION_PATTERN.md) | Patrón OM→Repo→Query→Hook→UI |
| [HAPPY_PATHS](./HAPPY_PATHS.md) | HP-001…003 |
| [ORR](./ORR.md) | Pausar tras HP-001 |
| [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md) | Checklist desde CAP-003 |
| [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md) | Contexto permanente |
| [PR_CHANGE_LEVELS](./PR_CHANGE_LEVELS.md) | Un PR = un nivel (no mezclar) |
| [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md) | Mock / Real / Happy Path |
| [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) | Primer pedido → FOV |
| [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) | Constitución |
| [caps/](./caps/README.md) | CAP-001…007 — **CAP-004** siguiente |
| [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md) | Implementation is Knowledge Materialization |

---

## Siguiente

1. Pegar [Master Prompt](./CURSOR_MASTER_PROMPT.md) en la sesión Cursor.  
2. **[CAP-004 Order Programming](./caps/CAP-004-order-programming.md)** — primera mutación (Level 2).  
3. CAP-005 → CAP-006 → **ORR** → FOV (Level 3→4).

---

## Evaluación

| Área | Estado |
|------|--------|
| Objetivo FOPEBA→software | ✅ Declarado |
| Product Skeleton UX | ✅ |
| L1 CAP-001 Auth | Connected · Real |
| L2 CAP-002 Dish Catalog | Connected · Real |
| L2 CAP-003 Weekly Menu | Connected · Real |
| L2 CAP-004…005 | ⏳ CAP-004 siguiente |
| L3 Workflow / L4 FOV | ⏳ |
| HP-001 | Parcial (catálogo + menú) |
| Business logic inventada | 🔒 STOP |
