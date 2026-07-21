# Dish Management — capability Application completa

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Module 01 — Dish Library  
Estado: Application Done (sin infra)

---

## ¿Qué es?

Cierre de la capacidad **Dish Management** en la capa de Aplicación: UC-001…UC-008.

## ¿Cómo es?

Ocho Use Cases, mismo patrón que CreateDishUseCase:

- Update / Activate / Deactivate / Archive / Restore / Duplicate / AssignRecipeToDish
- Solo contratos: DishRepository, EventPublisher, IdGenerator (donde aplica)
- Tests: 40 verdes (dominio + application)
- Sin Supabase, HTTP, React, Foundation tocado

## ¿Por qué existe?

Validar que una **Capability** completa puede construirse siguiendo la metodología sin nuevas decisiones arquitectónicas.

## ¿Para qué sirve?

Demostrar evolución del producto sobre cimientos estables.

## Objetivos

- Completar catálogo operativo de cocina sobre Dish.
- Mantener reglas en el dominio.
- Coordinación únicamente en Application.

## Reglas

- No inventar capabilities: Activate / Deactivate / AssignRecipe usan `dishes.update` (existente; UCs no nombran capability propia).
- Archive ≠ purge.
- Recipe deep validation diferida.

## Dependencias

- DISH_USE_CASES.md
- Dish domain Domain Done
- DishRepository contract

## Futuro

```text
SupabaseDishRepository → UI MVP → Ingredient / Recipe
```

## Decisiones tomadas

1. Capability Application = Done sin infra.
2. Nombre de clase UC-008 = `AssignRecipeToDishUseCase` (catálogo).
3. Foundation / Guidelines sin cambios.
