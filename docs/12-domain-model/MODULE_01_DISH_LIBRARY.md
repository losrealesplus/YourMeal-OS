# Module 01 — Dish Library (arranque)

**Fase actual.** Domain Driven. Sin pantallas hasta que el dominio esté listo.

## Orden congelado

```text
1. Dish          (entidad + estados + invariantes)
2. Ingredient
3. Recipe
4. Repositories
5. Services
6. Business Rules
7. Tests
8. UI
9. CRUD
```

## Tres conceptos distintos

| Concepto | Ejemplo | Módulo |
|----------|---------|--------|
| **Dish** | Chicken Teriyaki | Dish Library |
| **Ingredient** | Pechuga, soja, arroz | Ingredient Library (sigue a Dish) |
| **Recipe** | 200 g + 15 ml + 150 g | Recipe Builder |

En esta fase Module 01 el foco inicial es **Dish**; Ingredient y Recipe se modelan en secuencia dentro de la misma línea de catálogo antes de UI.

## Primer paso (próxima sesión)

1. Revisar constitución, ADRs, lenguaje ubicuo y `DEFINITION_OF_DONE`.
2. Completar definición de dominio de **Dish** en `src/modules/dish-library/domain/` (entidad, estados, reglas).
3. No abrir CRUD ni UI.

## Definition of Done

Ver [DEFINITION_OF_DONE.md](../00-status/DEFINITION_OF_DONE.md).
