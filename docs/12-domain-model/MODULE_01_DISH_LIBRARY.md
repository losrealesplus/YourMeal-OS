# Module 01 — Dish Library

**Fase actual.** Domain Driven. Sin pantallas hasta cerrar dominio.

## Orden congelado

```text
Dish → Ingredient → Recipe
  → Repositories → Services → Business Rules
  → Tests → UI → CRUD
```

## Documentos de dominio (antes de implementar UI)

| Doc | Concepto |
|-----|----------|
| [Dish.md](./module-01/Dish.md) | Plato comercializable |
| [Ingredient.md](./module-01/Ingredient.md) | Materia prima |
| [Recipe.md](./module-01/Recipe.md) | Composición Dish ← Ingredients |

## Primer paso de código

Cerrar invariantes de **Dish** en `src/modules/dish-library/domain/` alineados con `Dish.md`.  
No abrir CRUD ni UI.

## Diario

Al terminar cada pieza Done → entrada en [Diario de Desarrollo](../99-internal/development-journal/README.md).
