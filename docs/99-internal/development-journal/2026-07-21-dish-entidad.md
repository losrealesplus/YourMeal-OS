# Dish · Primera entidad del Core

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: ✅ Entidad de dominio implementada (sin UI / sin infra)

---

## ¿Qué es?

La primera entidad del Core: `Dish`, materializada como consecuencia de `Dish.md` + `ENTITY_GUIDELINES.md`, no como ejercicio de diseño.

## ¿Cómo es?

```text
src/modules/dish-library/domain/
  entities/dish.ts
  value-objects/ (+ NutritionFacts)
  errors/ (+ category / archive guards)
  types/ids.ts (DishId, TenantId, CategoryId, RecipeId)
  events/ (ya definidos)
```

Operaciones: create, update, activate, deactivate, archive, restore, duplicate, assignRecipe.  
Eventos pendientes vía `pullDomainEvents()`.  
Tests: `dish.test.ts` (vitest) — 11 casos.

## ¿Por qué existe?

Para validar que Foundation funciona en un caso real: Cursor no diseña; materializa decisiones congeladas.

## ¿Para qué sirve?

- Patrón reutilizable para Ingredient, Recipe, Order…
- Demostrar que la documentación gobierna el código.

## Objetivos

- Cumplir Entity Guidelines y Dish.md.
- Cero dependencia de UI / DB / Supabase.
- Dejar huecos documentados, no inventados.

## Reglas

- Validación en VOs.
- Transiciones vía `DishStatus`.
- Sin `delete()` de negocio.
- Unicidad de nombre: fuera de la entidad (Service/Repository).

## Dependencias

- `FOUNDATION.md`, `ENTITY_GUIDELINES.md`, `Dish.md`
- Lenguaje de dominio previo (VOs, errors, state machine)

## Futuro / huecos notificados (no inventados)

1. **Recipe válida al activar** — diferido hasta dominio Recipe.
2. **Unicidad de nombre por tenant** — Domain Service / Repository.
3. **Category / Tag** — solo IDs de referencia; agregados pendientes.
4. **Price** en docs → implementado como `Money` (ya existía).
5. **NutritionFacts** — mínimo (Calories); nutrición avanzada fuera de MVP.
6. **RBAC / ServiceContext / Feature Flags / audit_log** — Application layer, no entidad.

## Decisiones tomadas

1. `Dish.ts` es consecuencia del diseño, no su inicio.
2. Restore por defecto a `draft` (alineado con Service existente); también permite `inactive`.
3. Se añade `vitest` para pruebas de dominio.
4. No se toca `DishService` de aplicación en esta iteración (siguiente: adaptar al dominio).
