# Module 01 — Dish Library

**Fase actual.** Domain Driven. Sin pantallas hasta cerrar dominio.

## Orden congelado

```text
Dish Library
  ↓
Language (estructura domain/)
  ↓
Value Objects
  ↓
Domain Errors
  ↓
State Machine
  ↓
Entity
  ↓
Repository Interface
  ↓
Domain Service
  ↓
Application Service
  ↓
Tests
  ↓
Infrastructure
  ↓
UI
```

Luego: **Ingredient** → **Recipe** con la misma disciplina.

## Estado actual

| Pieza | Estado |
|-------|--------|
| Dominio documentado (`Dish.md`) | ✅ |
| Lenguaje del dominio en código | 🚧 |
| Entidad `Dish` | ⏳ pendiente |
| UI / CRUD | ⏳ pendiente |

## Documentos de dominio

| Doc | Concepto |
|-----|----------|
| [Dish.md](./module-01/Dish.md) | Plato comercializable |
| [Ingredient.md](./module-01/Ingredient.md) | Materia prima |
| [Recipe.md](./module-01/Recipe.md) | Composición Dish ← Ingredients |

## Código

Namespace: `src/modules/dish-library/domain/`

- `value-objects/` — `DishName`, `PortionSize`, `Money`, `Calories`
- `errors/` — errores de dominio del módulo
- `types/` — `DishStatus` y mapeos de persistencia
- `events/` — eventos definidos, no emitidos aún
- `entities/` — entidad `Dish` (siguiente paso)

## Diario

Al terminar cada pieza Done → entrada en [Diario de Desarrollo](../99-internal/development-journal/README.md).
