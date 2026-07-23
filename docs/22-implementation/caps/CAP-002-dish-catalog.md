# CAP-002 — Dish Catalog (lectura)

**Estado:** Scaffold → **Connected** (siguiente)  
**Etapa 2 Level:** **2 — Capability Connection**  
**Nivel PR:** Capability  
**Master:** [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md)

---

## 1. Objetivo

Conectar **solo la lectura** del catálogo Dish a Supabase.

Validar infraestructura de datos antes de mutaciones o UI extra.

El usuario solo debe poder **ver platos reales**. Sin estados complejos.

## 2. Alcance (únicamente)

```text
DishRepository
        ↓
TanStack Query
        ↓
useDishes()
        ↓
DishCard (sin modificar el componente)
```

## 3. Fuera de alcance (este PR)

- Búsqueda  
- Filtros  
- Favoritos  
- Paginación  
- Edición / mutaciones  
- Campos nuevos  
- Estados de carga elaborados / empty states rediseñados  
- Cambios UX / navegación / animaciones  
- «Ya que estamos…» cualquier cosa  

## 4. Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-002 Dish Catalog |
| Etapa 2 Level | 2 |
| Core Object | Dish |
| OM | `docs/17` · Module 01 Dish |
| Infra | Supabase · Repository · TanStack Query · i18n · useFmt |
| Mutaciones | Ninguna |
| Knowledge Coverage (objetivo Connected) | ~35% del dominio Dish (solo lectura) |

## 5. Criterios Connected (lectura)

- [ ] Datos desde Supabase (no `mock-*`)  
- [ ] Tenant / auth respetados  
- [ ] i18n + useFmt  
- [ ] DishCard sin cambios visuales  
- [ ] Typecheck limpio  
- [ ] [KNOWLEDGE_COVERAGE](../KNOWLEDGE_COVERAGE.md) actualizado  
- [ ] Checks [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md) Scaffold→Connected aplicables a lectura  

## 6. Prompt

```text
Implementar CAP-002 Dish Catalog — SOLO LECTURA (Etapa 2 Level 2).

Cadena: DishRepository → TanStack Query → useDishes() → DishCard.

No modificar DishCard ni UX ni navegación.
No añadir: búsqueda, filtros, favoritos, paginación, edición, campos, empty states nuevos.

Solo conectar lectura real. El usuario ve platos reales.
Typecheck limpio.
Actualizar Knowledge Coverage.
Cerrar con formato oficial del Master Prompt.
Nivel del cambio: Capability
Estado objetivo: Scaffold → Connected
Knowledge Review requerido: No (salvo hallazgo)
```

## 7. Plantilla de descripción PR

```text
Nivel del cambio: Capability
Etapa 2 Level: 2

CAP-002 Dish Catalog
Estado: Scaffold → Connected
Alcance: DishRepository → Query → useDishes → DishCard
Mutaciones: ninguna
Cambios UI: ninguno
```
