# CAP-002 — Dish Catalog (lectura)

**Estado:** Scaffold → **Connected**  
**Nivel PR:** Capability  
**Objetivo del PR:** Materializar la primera lectura real del conocimiento operacional.

---

## Preconditions

- CAP-001 = Connected  
- Usuario autenticado  
- Tenant activo resuelto (`useAuth().tenantId`)  
- Tabla `dishes` disponible + RLS de lectura por miembro de tenant  

## Postconditions

- `useDishes()` / `useDish()` devuelven datos reales (Supabase)  
- `DishCard` recibe entidades proyectadas (sin cambio visual)  
- Flujo home / menu / detalle / schedule step 2 **sin** `MOCK_DISHES`  
- Typecheck limpio  
- Sin búsqueda, filtros, favoritos, paginación, mutaciones ni UX nueva  

---

## 1. Alcance

```text
Operational Model (Dish)
        ↓
DishRepository.listCatalog / findCatalogById
        ↓
TanStack Query
        ↓
useDishes() / useDish()
        ↓
DishCard (existente)
```

## 2. Fuera de alcance

Búsqueda · filtros · favoritos · paginación · ordenación · CRUD · optimizaciones no necesarias.

## 3. Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-002 Dish Catalog |
| Core Object | Dish |
| OM | Module 01 Dish · `docs/17` |
| Infra | Supabase · Repository · TanStack Query |
| Mutaciones | Ninguna |
| Happy Path | Parcial (lectura de platos) |

## 4. Prompt

```text
CAP-002 — materializar la primera lectura real del conocimiento operacional.

DishRepository → TanStack Query → useDishes() → DishCard.
Sustituir mocks de platos. UI idéntica.
Sin búsqueda/filtros/favoritos/paginación/mutaciones.
```
