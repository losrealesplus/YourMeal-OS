# CAP-003 — Weekly Menu (lectura)

**Estado:** Scaffold → **Connected**  
**Nivel PR:** Capability  
**Objetivo:** Materializar la lectura de la oferta semanal certificada (no pedidos).

---

## Preconditions

- CAP-001 = Connected  
- CAP-002 = Connected  
- Usuario autenticado · tenant activo  
- Tablas `weekly_menus` / `weekly_menu_slots` disponibles  
- Menú **published** para la semana (dato; no inventar reglas de publicación aquí)  

## Postconditions

- `useWeeklyMenu()` devuelve oferta published real (o vacía si no hay)  
- DayPicker muestra platos del día vía slots (no rotación de catálogo)  
- Sin mocks de menú en `/app/menu`  
- Typecheck limpio · sin cambios UX/navegación  
- Happy Path: Parcial  

---

## Alcance

```text
Operational Model (Weekly Menu)
        ↓
WeeklyMenuRepository
        ↓
TanStack Query
        ↓
useWeeklyMenu()
        ↓
Weekly Menu Screen (DayPicker + DishCard)
```

## Fuera de alcance

Selección de platos · disponibilidad · stock · promociones · reglas de compra · mutaciones · admin publish.

## Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-003 Weekly Menu |
| Core | Weekly Menu · Menu Slot · Dish |
| OM | `docs/17` · Weekly Menu lifecycle (Published) |
| Mutaciones | Ninguna |
| Mock → Real | Real |
| Happy Path | Parcial (HP-001) |

## Checklist técnico

Ver [PR_TECHNICAL_CHECKLIST](../PR_TECHNICAL_CHECKLIST.md).
