# Capability Connection Pattern — biblioteca de patrones

Patrón repetible consolidado por CAP-002 / CAP-003.

```text
Operational Model
        ↓
Repository          (acceso a datos; sin inventar reglas)
        ↓
TanStack Query      (keys tenant-scoped · cache)
        ↓
Hook                (useX + useAuth.tenantId)
        ↓
UI existente        (sin rediseño)
        ↓
Capability Closure  (pre/postcondiciones · estado · Happy Path)
```

## Reglas

1. Un PR = una Capability = un nivel de cambio.  
2. Solo lectura hasta que la CAP declare mutaciones.  
3. STOP si hace falta una regla operacional nueva.  
4. Reutilizar mappers/view contracts (`CatalogDish`) cuando el OM lo permita.  

## Ejemplos

| CAP | Repository | Hook | UI |
|-----|------------|------|-----|
| CAP-002 | `DishRepository.listCatalog` | `useDishes` | DishCard |
| CAP-003 | `WeeklyMenuRepository` | `useWeeklyMenu` | DayPicker + DishCard |

## Relacionado

- [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)  
- [PR_TECHNICAL_CHECKLIST](./PR_TECHNICAL_CHECKLIST.md)  
- [ETAPA_2_LEVELS](./ETAPA_2_LEVELS.md) (si está en la rama base)
