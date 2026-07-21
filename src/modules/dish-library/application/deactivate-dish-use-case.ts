import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { DishId, DishRepository, TenantId } from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-004 — Deactivate Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-004--desactivar-dish
 *
 * Capability: `dishes.update` (existente; UC no define capability propia).
 */

export type DeactivateDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type DeactivateDishInput = {
  dishId: string;
};

export type DeactivateDishResult = {
  dishId: string;
  organizationId: string;
  status: "inactive";
};

export type DeactivateDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class DeactivateDishUseCase {
  constructor(private readonly deps: DeactivateDishDependencies) {}

  async execute(
    actor: DeactivateDishActor,
    input: DeactivateDishInput,
  ): Promise<DeactivateDishResult> {
    requireCapability(actor.roles, "dishes.update");

    const tenantId = TenantId.create(actor.organizationId);
    const dish = await this.deps.dishRepository.findById(
      tenantId,
      DishId.create(input.dishId),
    );
    if (!dish) throw dishNotFound(input.dishId);

    dish.deactivate();

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      status: "inactive",
    };
  }
}
