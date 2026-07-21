# Module 01 — Dish Library

**Dominio de Dish:** ✅ Domain Done ([DOMAIN_DONE.md](./DOMAIN_DONE.md))  
**Siguiente capa:** Repository Interface → Application → Infrastructure → UI

## Orden congelado

```text
Dish Library
  ↓
Language ✅
  ↓
Value Objects ✅
  ↓
Domain Errors ✅
  ↓
State Machine ✅
  ↓
Entity ✅
  ↓
Repository Interface ⏳
  ↓
Domain / Application Service
  ↓
Infrastructure
  ↓
UI
```

Luego: **Ingredient** → **Recipe** con la misma disciplina y el mismo [DOMAIN_DONE.md](./DOMAIN_DONE.md).

## Estado actual

| Pieza | Estado |
|-------|--------|
| Dominio documentado (`Dish.md`) | ✅ |
| Lenguaje del dominio en código | ✅ |
| Entidad `Dish` | ✅ Domain Done |
| Tests de dominio | ✅ |
| Validación metodológica | ✅ |
| Repository Interface | ⏳ siguiente |
| Application / Infra / UI | ⏳ pendiente |

Acta: [MILESTONE_VALIDACION_DOMINIO_DISH.md](../00-status/MILESTONE_VALIDACION_DOMINIO_DISH.md)

## Documentos de dominio

| Doc | Concepto |
|-----|----------|
| [Dish.md](./module-01/Dish.md) | Plato comercializable |
| [Ingredient.md](./module-01/Ingredient.md) | Materia prima |
| [Recipe.md](./module-01/Recipe.md) | Composición Dish ← Ingredients |
| [DOMAIN_DONE.md](./DOMAIN_DONE.md) | Cuándo el dominio está terminado |
| [ENTITY_GUIDELINES.md](./ENTITY_GUIDELINES.md) | Cómo se modela una entidad |

## Código

Namespace: `src/modules/dish-library/domain/`

- `entities/dish.ts` — entidad (Domain Done)
- `value-objects/` — `DishName`, `PortionSize`, `Money`, `Calories`, `NutritionFacts`
- `errors/` — errores de dominio del módulo
- `types/` — `DishStatus`, ids
- `events/` — eventos definidos; recolección en entidad

## Diario

Al terminar cada pieza Done → entrada en [Diario de Desarrollo](../99-internal/development-journal/README.md).
