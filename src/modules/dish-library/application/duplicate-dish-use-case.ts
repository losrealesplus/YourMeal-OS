import type { AppRole } from "@/hooks/use-auth";
import { dishNotFound } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import {
  DishAlreadyExists,
  DishId,
  DishName,
  DishRepository,
  TenantId,
} from "../domain";
import type { EventPublisher, IdGenerator } from "./ports";

/**
 * UC-007 — Duplicate Dish
 * @see docs/14-application/DISH_USE_CASES.md#uc-007--duplicar-dish
 */

export type DuplicateDishActor = {
  organizationId: string;
  actorId: string;
  roles: readonly AppRole[];
};

export type DuplicateDishInput = {
  sourceDishId: string;
  name: string;
};

export type DuplicateDishResult = {
  dishId: string;
  organizationId: string;
  name: string;
  status: "draft";
  sourceDishId: string;
};

export type DuplicateDishDependencies = {
  dishRepository: DishRepository;
  eventPublisher: EventPublisher;
  idGenerator: IdGenerator;
};

export class DuplicateDishUseCase {
  constructor(private readonly deps: DuplicateDishDependencies) {}

  async execute(
    actor: DuplicateDishActor,
    input: DuplicateDishInput,
  ): Promise<DuplicateDishResult> {
    requireCapability(actor.roles, "dishes.create");

    const tenantId = TenantId.create(actor.organizationId);
    const source = await this.deps.dishRepository.findById(
      tenantId,
      DishId.create(input.sourceDishId),
    );
    if (!source) throw dishNotFound(input.sourceDishId);

    const name = DishName.create(input.name);
    const exists = await this.deps.dishRepository.existsByName(tenantId, name);
    if (exists) {
      throw new DishAlreadyExists(name.toString(), tenantId.toString());
    }

    const copy = source.duplicate(
      DishId.create(this.deps.idGenerator.generate()),
      name,
    );

    await this.deps.dishRepository.save(copy);
    await this.deps.eventPublisher.publish(copy.pullDomainEvents());

    return {
      dishId: copy.getId().toString(),
      organizationId: copy.getTenantId().toString(),
      name: copy.getName().toString(),
      status: "draft",
      sourceDishId: source.getId().toString(),
    };
  }
}
