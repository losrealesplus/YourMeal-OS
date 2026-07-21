# Entities

`Dish` entity: [`dish.ts`](./dish.ts)

Implements `docs/12-domain-model/module-01/Dish.md` under
[`ENTITY_GUIDELINES.md`](../../../../../docs/12-domain-model/ENTITY_GUIDELINES.md).

Composed from domain language only:

- Value Objects (`DishName`, `Money`, `PortionSize`, `Calories`, `NutritionFacts`)
- Domain Errors
- `DishStatus` state machine
- Domain events (collected via `pullDomainEvents()`)

No infrastructure. No UI. No database.
