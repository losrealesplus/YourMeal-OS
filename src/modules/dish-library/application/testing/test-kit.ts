import type { AppRole } from "@/hooks/use-auth";
import {
  CategoryId,
  Dish,
  DishId,
  DishName,
  TenantId,
  type DishDomainEvent,
} from "../../domain";
import type { Clock, EventPublisher, IdGenerator } from "../ports";
import type { CreateDishActor } from "../create-dish-use-case";

export function fixedClock(iso: string): Clock {
  return { now: () => new Date(iso) };
}

export function sequentialIds(...ids: string[]): IdGenerator {
  let i = 0;
  return {
    generate: () => {
      const id = ids[i] ?? `dish-auto-${i}`;
      i += 1;
      return id;
    },
  };
}

export function collectingPublisher(sink: DishDomainEvent[]): EventPublisher {
  return {
    publish: async (events) => {
      sink.push(...events);
    },
  };
}

export function actor(overrides?: Partial<CreateDishActor>): CreateDishActor {
  return {
    organizationId: "org-eatclean",
    actorId: "user-admin-1",
    roles: ["company_admin"] satisfies AppRole[],
    ...overrides,
  };
}

/** Seed a draft Dish into a repository (via save). */
export function buildDraftDish(overrides?: {
  id?: string;
  name?: string;
  tenantId?: string;
  categoryId?: string;
}): Dish {
  return Dish.create({
    id: DishId.create(overrides?.id ?? "dish-1"),
    tenantId: TenantId.create(overrides?.tenantId ?? "org-eatclean"),
    name: DishName.create(overrides?.name ?? "Chicken Teriyaki"),
    categoryId: CategoryId.create(overrides?.categoryId ?? "cat-mains"),
  });
}
