export { DishService } from "./application/dish-service";
export { CreateDishUseCase } from "./application/create-dish-use-case";
export type {
  CreateDishActor,
  CreateDishDependencies,
  CreateDishInput,
  CreateDishResult,
} from "./application/create-dish-use-case";
export { UpdateDishUseCase } from "./application/update-dish-use-case";
export { ActivateDishUseCase } from "./application/activate-dish-use-case";
export { DeactivateDishUseCase } from "./application/deactivate-dish-use-case";
export { ArchiveDishUseCase } from "./application/archive-dish-use-case";
export { RestoreDishUseCase } from "./application/restore-dish-use-case";
export { DuplicateDishUseCase } from "./application/duplicate-dish-use-case";
export { AssignRecipeToDishUseCase } from "./application/assign-recipe-to-dish-use-case";
export type { Clock, EventPublisher, IdGenerator } from "./application/ports";
export * from "./domain";
export { createDishRepository } from "./infrastructure/dish-repository";
export type { DishRow, DishRepository } from "./infrastructure/dish-repository";
export {
  createSupabaseDishRepository,
  SupabaseDishRepository,
} from "./infrastructure/supabase-dish-repository";
export { mapDishRowToCatalogDish } from "./application/dish-catalog-mapper";
export type { CatalogDish } from "./application/dish-catalog-mapper";
export {
  dishCatalogKeys,
  fetchCatalogDish,
  fetchCatalogDishes,
} from "./application/dish-catalog-queries";
