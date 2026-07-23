# CAP-002 — Dish Catalog (lectura)

**Estado:** Scaffold → **Connected**  
**Etapa 2 Level:** **2 — Capability Connection**  
**Nivel PR:** Capability  
**Objetivo del PR:** Materializar la primera lectura real del conocimiento operacional.  
**Master:** [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md)

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

Conectar **solo la lectura** del catálogo Dish a Supabase.

Validar infraestructura de datos antes de mutaciones o UI extra.

El usuario solo debe poder **ver platos reales**. Sin estados complejos.

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

- Búsqueda  
- Filtros  
- Favoritos  
- Paginación  
- Ordenación  
- Edición / mutaciones / CRUD  
- Campos nuevos  
- Estados de carga elaborados / empty states rediseñados  
- Cambios UX / navegación / animaciones  
- Optimizaciones no necesarias  
- «Ya que estamos…» cualquier cosa  

## 3. Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-002 Dish Catalog |
| Etapa 2 Level | 2 |
| Core Object | Dish |
| OM | Module 01 Dish · `docs/17` |
| Infra | Supabase · Repository · TanStack Query · i18n · useFmt |
| Mutaciones | Ninguna |
| Happy Path | Parcial (lectura de platos) |
| Knowledge Coverage (objetivo Connected) | ~35% del dominio Dish (solo lectura) |

## 4. Criterios Connected (lectura)

- [x] Datos desde Supabase (no `mock-*`)  
- [x] Tenant / auth respetados  
- [x] i18n + useFmt  
- [x] DishCard sin cambios visuales  
- [x] Typecheck limpio  
- [ ] [KNOWLEDGE_COVERAGE](../KNOWLEDGE_COVERAGE.md) actualizado  
- [ ] Checks [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md) Scaffold→Connected aplicables a lectura  

## 5. Prompt

```text
CAP-002 — materializar la primera lectura real del conocimiento operacional.
Implementar CAP-002 Dish Catalog — SOLO LECTURA (Etapa 2 Level 2).

Cadena: DishRepository → TanStack Query → useDishes() → DishCard.
Sustituir mocks de platos. UI idéntica.
Sin búsqueda/filtros/favoritos/paginación/mutaciones.
No modificar DishCard ni UX ni navegación.

Typecheck limpio.
Actualizar Knowledge Coverage.
Cerrar con formato oficial del Master Prompt.
Nivel del cambio: Capability
Estado objetivo: Scaffold → Connected
Knowledge Review requerido: No (salvo hallazgo)
```

## 6. Plantilla de descripción PR

```text
Nivel del cambio: Capability
Etapa 2 Level: 2

CAP-002 Dish Catalog
Estado: Scaffold → Connected
Alcance: DishRepository → Query → useDishes → DishCard
Mutaciones: ninguna
Cambios UI: ninguno
```
