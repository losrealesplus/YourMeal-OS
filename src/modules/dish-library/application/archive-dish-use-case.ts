import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { DishId, DishRepository, TenantId } from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-005 — Archive Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-005--archivar-dish
 */

export type ArchiveDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type ArchiveDishInput = {
  dishId: string;
};

export type ArchiveDishResult = {
  dishId: string;
  organizationId: string;
  status: "archived";
};

export type ArchiveDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class ArchiveDishUseCase {
  constructor(private readonly deps: ArchiveDishDependencies) {}

  async execute(
    actor: ArchiveDishActor,
    input: ArchiveDishInput,
  ): Promise<ArchiveDishResult> {
    requireCapability(actor.roles, "dishes.archive");

    const tenantId = TenantId.create(actor.organizationId);
    const dish = await this.deps.dishRepository.findById(
      tenantId,
      DishId.create(input.dishId),
    );
    if (!dish) throw dishNotFound(input.dishId);

    dish.archive(actor.actorId);

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      status: "archived",
    };
  }
}
