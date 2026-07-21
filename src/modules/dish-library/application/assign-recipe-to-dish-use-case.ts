import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { DishId, DishRepository, RecipeId, TenantId } from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-008 — Assign Recipe
 * @see docs/14-application/DISH_USE_CASES.md#uc-008--asignar-recipe
 *
 * Class name per catalog: AssignRecipeToDishUseCase.
 * Capability: `dishes.update` (existente; UC no define capability propia).
 * Recipe deep validation: deferred (DISH_USE_CASES).
 */

export type AssignRecipeToDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type AssignRecipeToDishInput = {
  dishId: string;
  recipeId: string;
};

export type AssignRecipeToDishResult = {
  dishId: string;
  organizationId: string;
  recipeId: string;
};

export type AssignRecipeToDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class AssignRecipeToDishUseCase {
  constructor(private readonly deps: AssignRecipeToDishDependencies) {}

  async execute(
    actor: AssignRecipeToDishActor,
    input: AssignRecipeToDishInput,
  ): Promise<AssignRecipeToDishResult> {
    requireCapability(actor.roles, "dishes.update");

    const tenantId = TenantId.create(actor.organizationId);
    const dish = await this.deps.dishRepository.findById(
      tenantId,
      DishId.create(input.dishId),
    );
    if (!dish) throw dishNotFound(input.dishId);

    const recipeId = RecipeId.create(input.recipeId);
    dish.assignRecipe(recipeId);

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      recipeId: recipeId.toString(),
    };
  }
}
