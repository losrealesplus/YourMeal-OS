# Repositories

Domain contracts live here. Infrastructure adapters stay in `../infrastructure/`.

## Dish

- Contract (docs): [`docs/13-repositories/DishRepository.md`](../../../../../docs/13-repositories/DishRepository.md)
- Interface: [`dish-repository.ts`](./dish-repository.ts)

Standards: [REPOSITORY_GUIDELINES.md](../../../../../docs/13-repositories/REPOSITORY_GUIDELINES.md)

If this interface feels like it is “missing many things”, those things likely belong to Application, Infrastructure, or another aggregate — not here.
