# Capability Connection Pattern

**Papel central:** toda Capability de Etapa 2 debe seguir este ciclo salvo justificación explícita.

```text
Operational Model
        ↓
Repository
        ↓
TanStack Query / Command
        ↓
Hook
        ↓
Existing UI (Presentation)
        ↓
Capability Closure (pre/post · Mock/Real · Happy Path)
```

Si una Capability **salta** este patrón, debe justificar por qué en el CAP doc (y, si implica regla nueva → STOP · Carril A).

---

## Lectura (CAP-002 · CAP-003)

```text
OM → Repository → Query → Hook → UI
```

| CAP | Repository | Hook | UI |
|-----|------------|------|-----|
| CAP-002 | `DishRepository.listCatalog` | `useDishes` | DishCard |
| CAP-003 | `WeeklyMenuRepository` | `useWeeklyMenu` | DayPicker + DishCard |

---

## Mutación (oficial desde CAP-004)

Ver [MUTATION_PATTERN](./MUTATION_PATTERN.md).

```text
UI → Command → Application Service → Repository → Supabase
  → auditService → audit_log → Query Invalidation → UI
```

La auditoría es **parte del flujo**, no un añadido al final.

---

## Reglas

1. Un PR = una Capability = un [nivel de cambio](./PR_CHANGE_LEVELS.md).  
2. STOP si hace falta una regla operacional nueva.  
3. Sin «ya que estamos…».  
4. Checklist: [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md).  

## Relacionado

- [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)  
- [HAPPY_PATHS](./HAPPY_PATHS.md) · [ORR](./ORR.md)
