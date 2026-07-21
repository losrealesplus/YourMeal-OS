import type { AppRole } from "@/hooks/use-auth";
import { requireCapability } from "@/permissions";
import {
  Calories,
  CategoryId,
  Dish,
  DishAlreadyExists,
  DishId,
  DishName,
  DishRepository,
  Money,
  NutritionFacts,
  PortionSize,
  RecipeId,
  TenantId,
} from "../domain";
import { type Clock, type EventPublisher, type IdGenerator, systemClock } from "./ports";

/**
 * UC-001 — Create Dish
 *
 * Translation of docs/14-application/use-cases/CreateDishUseCase.md
 * Application coordinates; domain decides.
 */

export type CreateDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

/** Business concepts — not UI/HTTP DTOs. */
export type CreateDishInput = {
  name: string;
  categoryId: string;
  description?: string | null;
  photoUrl?: string | null;
  /** Portion size in grams */
  portion?: number | null;
  /** Energy in kcal */
  calories?: number | null;
  price?: number | null;
  cost?: number | null;
  allergens?: readonly string[];
  tags?: readonly string[];
  recipeId?: string | null;
};

export type CreateDishResult = {
  dishId: string;
  organizationId: string;
  name: string;
  status: "draft";
};

export type CreateDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
  idGenerator: IdGenerator;
  clock?: Clock;
};

export class CreateDishUseCase {
  private readonly clock: Clock;

  constructor(private readonly deps: CreateDishDependencies) {
    this.clock = deps.clock ?? systemClock;
  }

  async execute(
    actor: CreateDishActor,
    input: CreateDishInput,
  ): Promise<CreateDishResult> {
    requireCapability(actor.roles, "dishes.create");

    const tenantId = TenantId.create(actor.organizationId);
    const name = DishName.create(input.name);
    const categoryId = CategoryId.create(input.categoryId);

    const portionSize =
      input.portion == null ? null : PortionSize.create(input.portion);
    const nutrition =
      input.calories == null
        ? NutritionFacts.empty()
        : NutritionFacts.create({ calories: Calories.create(input.calories) });
    const price = input.price == null ? undefined : Money.create(input.price);
    const cost = input.cost == null ? undefined : Money.create(input.cost);
    const recipeId =
      input.recipeId == null || input.recipeId === ""
        ? null
        : RecipeId.create(input.recipeId);

    const exists = await this.deps.dishRepository.existsByName(tenantId, name);
    if (exists) {
      throw new DishAlreadyExists(name.toString(), tenantId.toString());
    }

    const dish = Dish.create({
      id: DishId.create(this.deps.idGenerator.generate()),
      tenantId,
      name,
      categoryId,
      description: input.description ?? null,
      photoUrl: input.photoUrl ?? null,
      portionSize,
      nutrition,
      price,
      cost,
      allergens: input.allergens,
      tags: input.tags,
      recipeId,
      createdAt: this.clock.now(),
    });

    await this.deps.dishRepository.save(dish);

    const events = dish.pullDomainEvents();
    await this.deps.eventPublisher.publish(events);

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      name: dish.getName().toString(),
      status: "draft",
    };
  }
}
