# CAP-002 — Dish Catalog (lectura)

**Estado:** Scaffold → **Connected** (siguiente)  
**Nivel PR:** Capability  
**Master:** [CURSOR_MASTER_PROMPT](../CURSOR_MASTER_PROMPT.md)

---

## 1. Objetivo

Conectar **solo la lectura** del catálogo Dish a Supabase.

Validar infraestructura antes de mutaciones.

## 2. Alcance (únicamente)

```text
Supabase
    ↓
Repository
    ↓
TanStack Query
    ↓
Hook
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
- Cambios UX / navegación / animaciones  

## 4. Traceability

| Campo | Valor |
|-------|-------|
| Capability | CAP-002 Dish Catalog |
| Core Object | Dish |
| OM | `docs/17` · Module 01 Dish |
| Infra | Supabase · Repository · TanStack Query · i18n · useFmt |
| Mutaciones | Ninguna |

## 5. Criterios Connected (lectura)

- [ ] Datos desde Supabase (no `mock-*`)  
- [ ] Tenant / auth respetados  
- [ ] i18n + useFmt  
- [ ] DishCard sin cambios visuales  
- [ ] Typecheck limpio  
- [ ] Checks [MODULE_STATE_CRITERIA](../../00-status/MODULE_STATE_CRITERIA.md) Scaffold→Connected aplicables a lectura  

## 6. Prompt

```text
Implementar CAP-002 Dish Catalog — SOLO LECTURA.

Cadena: Supabase → Repository → TanStack Query → Hook → DishCard.

No modificar DishCard ni UX ni navegación.
No añadir: búsqueda, filtros, favoritos, paginación, edición, campos.

Solo conectar lectura real.
Typecheck limpio.
Cerrar con formato oficial del Master Prompt.
Nivel del cambio: Capability
Estado objetivo: Scaffold → Connected
Knowledge Review requerido: No (salvo hallazgo)
```

## 7. Plantilla de descripción PR

```text
Nivel del cambio: Capability

CAP-002 Dish Catalog
Estado: Scaffold → Connected
Alcance: lectura únicamente
Mutaciones: ninguna
Cambios UI: ninguno
```
