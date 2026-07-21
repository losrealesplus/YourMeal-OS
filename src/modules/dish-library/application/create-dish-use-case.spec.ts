import { describe, expect, it } from "vitest";
import type { AppRole } from "@/hooks/use-auth";
import { DomainError } from "@/domain/errors";
import {
  Dish,
  DishAlreadyExists,
  DishId,
  DishName,
  DishNameRequired,
  DishNameTooLong,
  TenantId,
  type DishDomainEvent,
  type DishRepository,
} from "../domain";
import {
  CreateDishUseCase,
  type CreateDishActor,
  type CreateDishInput,
} from "./create-dish-use-case";
import type { Clock, EventPublisher, IdGenerator } from "./ports";

class InMemoryDishRepository implements DishRepository {
  private readonly byId = new Map<string, Dish>();

  private key(tenantId: TenantId, id: DishId): string {
    return `${tenantId.toString()}:${id.toString()}`;
  }

  async save(dish: Dish): Promise<void> {
    this.byId.set(this.key(dish.getTenantId(), dish.getId()), dish);
  }

  async findById(tenantId: TenantId, id: DishId): Promise<Dish | null> {
    const dish = this.byId.get(this.key(tenantId, id));
    if (!dish || dish.isArchived()) return null;
    return dish;
  }

  async existsByName(tenantId: TenantId, name: DishName): Promise<boolean> {
    for (const dish of this.byId.values()) {
      if (
        dish.getTenantId().equals(tenantId) &&
        !dish.isArchived() &&
        dish.getName().equals(name)
      ) {
        return true;
      }
    }
    return false;
  }

  async listNotArchived(tenantId: TenantId): Promise<Dish[]> {
    return [...this.byId.values()]
      .filter((d) => d.getTenantId().equals(tenantId) && !d.isArchived())
      .sort((a, b) => a.getName().toString().localeCompare(b.getName().toString()));
  }

  async findByIdIncludingArchived(
    tenantId: TenantId,
    id: DishId,
  ): Promise<Dish | null> {
    return this.byId.get(this.key(tenantId, id)) ?? null;
  }

  async purge(tenantId: TenantId, id: DishId): Promise<void> {
    this.byId.delete(this.key(tenantId, id));
  }
}

function fixedClock(iso: string): Clock {
  return { now: () => new Date(iso) };
}

function sequentialIds(...ids: string[]): IdGenerator {
  let i = 0;
  return {
    generate: () => {
      const id = ids[i] ?? `dish-auto-${i}`;
      i += 1;
      return id;
    },
  };
}

function collectingPublisher(sink: DishDomainEvent[]): EventPublisher {
  return {
    publish: async (events) => {
      sink.push(...events);
    },
  };
}

function actor(overrides?: Partial<CreateDishActor>): CreateDishActor {
  return {
    organizationId: "org-eatclean",
    actorId: "user-admin-1",
    roles: ["company_admin"] satisfies AppRole[],
    ...overrides,
  };
}

function input(overrides?: Partial<CreateDishInput>): CreateDishInput {
  return {
    name: "Chicken Teriyaki",
    categoryId: "cat-mains",
    ...overrides,
  };
}

describe("CreateDishUseCase (UC-001)", () => {
  it("creates a Dish in draft and publishes DishCreated", async () => {
    const repo = new InMemoryDishRepository();
    const published: DishDomainEvent[] = [];
    const useCase = new CreateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
      idGenerator: sequentialIds("dish-new-1"),
      clock: fixedClock("2026-07-21T12:00:00.000Z"),
    });

    const result = await useCase.execute(actor(), input());

    expect(result).toEqual({
      dishId: "dish-new-1",
      organizationId: "org-eatclean",
      name: "Chicken Teriyaki",
      status: "draft",
    });

    const stored = await repo.findById(
      TenantId.create("org-eatclean"),
      DishId.create("dish-new-1"),
    );
    expect(stored).not.toBeNull();
    expect(stored!.getStatus().isDraft()).toBe(true);
    expect(published.map((e) => e.type)).toEqual(["DishCreated"]);
  });

  it("rejects duplicate name with DishAlreadyExists", async () => {
    const repo = new InMemoryDishRepository();
    const useCase = new CreateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
      idGenerator: sequentialIds("dish-1", "dish-2"),
    });

    await useCase.execute(actor(), input());

    await expect(useCase.execute(actor(), input())).rejects.toBeInstanceOf(
      DishAlreadyExists,
    );
  });

  it("rejects actor without dishes.create", async () => {
    const useCase = new CreateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
      idGenerator: sequentialIds("dish-1"),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), input()),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    } satisfies Partial<DomainError>);
  });

  it("propagates invalid name from domain", async () => {
    const useCase = new CreateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
      idGenerator: sequentialIds("dish-1"),
    });

    await expect(
      useCase.execute(actor(), input({ name: "   " })),
    ).rejects.toBeInstanceOf(DishNameRequired);

    await expect(
      useCase.execute(actor(), input({ name: "x".repeat(121) })),
    ).rejects.toBeInstanceOf(DishNameTooLong);
  });
});
