import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import {
  Calories,
  CategoryId,
  DishAlreadyExists,
  DishId,
  DishName,
  DishRepository,
  Money,
  NutritionFacts,
  PortionSize,
  TenantId,
  type DishUpdateProps,
} from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-002 — Update Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-002--actualizar-dish
 */

export type UpdateDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type UpdateDishInput = {
  dishId: string;
  name?: string;
  categoryId?: string;
  description?: string | null;
  photoUrl?: string | null;
  portion?: number | null;
  calories?: number | null;
  price?: number | null;
  cost?: number | null;
  allergens?: readonly string[];
  tags?: readonly string[];
};

export type UpdateDishResult = {
  dishId: string;
  organizationId: string;
  name: string;
  status: string;
};

export type UpdateDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class UpdateDishUseCase {
  constructor(private readonly deps: UpdateDishDependencies) {}

  async execute(
    actor: UpdateDishActor,
    input: UpdateDishInput,
  ): Promise<UpdateDishResult> {
    requireCapability(actor.roles, "dishes.update");

    const tenantId = TenantId.create(actor.organizationId);
    const dishId = DishId.create(input.dishId);

    const dish = await this.deps.dishRepository.findById(tenantId, dishId);
    if (!dish) throw dishNotFound(input.dishId);

    const props: DishUpdateProps = {};

    if (input.name !== undefined) {
      const name = DishName.create(input.name);
      if (!name.equals(dish.getName())) {
        const exists = await this.deps.dishRepository.existsByName(
          tenantId,
          name,
        );
        if (exists) {
          throw new DishAlreadyExists(name.toString(), tenantId.toString());
        }
      }
      props.name = name;
    }

    if (input.categoryId !== undefined) {
      props.categoryId = CategoryId.create(input.categoryId);
    }
    if (input.description !== undefined) props.description = input.description;
    if (input.photoUrl !== undefined) props.photoUrl = input.photoUrl;
    if (input.portion !== undefined) {
      props.portionSize =
        input.portion == null ? null : PortionSize.create(input.portion);
    }
    if (input.calories !== undefined) {
      props.nutrition =
        input.calories == null
          ? NutritionFacts.empty()
          : NutritionFacts.create({
              calories: Calories.create(input.calories),
            });
    }
    if (input.price !== undefined) props.price = Money.create(input.price);
    if (input.cost !== undefined) props.cost = Money.create(input.cost);
    if (input.allergens !== undefined) props.allergens = input.allergens;
    if (input.tags !== undefined) props.tags = input.tags;

    dish.update(props);

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      name: dish.getName().toString(),
      status: dish.getStatus().toString(),
    };
  }
}
