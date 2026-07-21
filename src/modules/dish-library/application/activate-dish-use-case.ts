import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { DishId, DishRepository, TenantId } from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-003 — Activate Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-003--activar-dish
 *
 * Capability: UC no nombra una capability específica; se usa `dishes.update`
 * (ya existente) — no se inventa `dishes.activate`.
 */

export type ActivateDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type ActivateDishInput = {
  dishId: string;
};

export type ActivateDishResult = {
  dishId: string;
  organizationId: string;
  status: "active";
};

export type ActivateDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class ActivateDishUseCase {
  constructor(private readonly deps: ActivateDishDependencies) {}

  async execute(
    actor: ActivateDishActor,
    input: ActivateDishInput,
  ): Promise<ActivateDishResult> {
    requireCapability(actor.roles, "dishes.update");

    const tenantId = TenantId.create(actor.organizationId);
    const dish = await this.deps.dishRepository.findById(
      tenantId,
      DishId.create(input.dishId),
    );
    if (!dish) throw dishNotFound(input.dishId);

    dish.activate();

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      status: "active",
    };
  }
}
