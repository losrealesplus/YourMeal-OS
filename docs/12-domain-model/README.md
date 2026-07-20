# Domain model

## Heart

**Dish** is the commercial center of YourMeal OS. Ingredients and Recipes feed Dishes; Menus and Orders reference Dishes.

## Vocabulary

**[UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md)** — official terms (Dish ≠ Ingredient ≠ Recipe).

## Catalog

**[ENTITIES.md](./ENTITIES.md)** — all principal entities defined (implemented per roadmap).

## States

**[STATE_MACHINES.md](./STATE_MACHINES.md)** — official lifecycles (no free-text statuses).

## Module 01 family

```text
Dish Library → Ingredient Library → Recipe Builder
```

| Concept | Example |
|---------|---------|
| Dish | Chicken Teriyaki |
| Ingredient | Chicken breast, soy sauce, rice |
| Recipe | 200 g chicken + 15 ml soy + 150 g rice |

## Code home

```text
src/modules/dish-library/{domain,application,infrastructure,presentation}
```

Domain entities first; CRUD/UI after Foundation Lock tag `v0.1.0`.
