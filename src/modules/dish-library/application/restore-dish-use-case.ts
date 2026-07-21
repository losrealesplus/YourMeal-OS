import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import {
  DishId,
  DishRepository,
  TenantId,
  type DishRestoreTarget,
} from "../domain";
import type { EventPublisher } from "./ports";

/**
 * UC-006 — Restore Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-006--restaurar-dish
 */

export type RestoreDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type RestoreDishInput = {
  dishId: string;
  /** Default: draft */
  target?: DishRestoreTarget;
};

export type RestoreDishResult = {
  dishId: string;
  organizationId: string;
  status: "draft" | "inactive";
};

export type RestoreDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
};

export class RestoreDishUseCase {
  constructor(private readonly deps: RestoreDishDependencies) {}

  async execute(
    actor: RestoreDishActor,
    input: RestoreDishInput,
  ): Promise<RestoreDishResult> {
    requireCapability(actor.roles, "dishes.restore");

    const tenantId = TenantId.create(actor.organizationId);
    const dish = await this.deps.dishRepository.findByIdIncludingArchived(
      tenantId,
      DishId.create(input.dishId),
    );
    if (!dish) throw dishNotFound(input.dishId);

    const target = input.target ?? "draft";
    dish.restore(target);

    await this.deps.dishRepository.save(dish);
    await this.deps.eventPublisher.publish(dish.pullDomainEvents());

    const status = dish.getStatus().toString();
    return {
      dishId: dish.getId().toString(),
      organizationId: dish.getTenantId().toString(),
      status: status as "draft" | "inactive",
    };
  }
}
