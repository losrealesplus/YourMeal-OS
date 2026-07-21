import { describe, expect, it } from "vitest";
import {
  DishId,
  DishNotArchived,
  TenantId,
  type DishDomainEvent,
} from "../domain";
import { RestoreDishUseCase } from "./restore-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("RestoreDishUseCase (UC-006)", () => {
  it("restores archived dish to draft by default", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.archive("user-1");
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new RestoreDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), { dishId: "dish-1" });

    expect(result.status).toBe("draft");
    expect(published.map((e) => e.type)).toEqual(["DishRestored"]);

    const stored = await repo.findById(
      TenantId.create("org-eatclean"),
      DishId.create("dish-1"),
    );
    expect(stored!.getArchivedAt()).toBeNull();
  });

  it("restores to inactive when requested", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.archive("user-1");
    dish.pullDomainEvents();
    await repo.save(dish);

    const useCase = new RestoreDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    const result = await useCase.execute(actor(), {
      dishId: "dish-1",
      target: "inactive",
    });

    expect(result.status).toBe("inactive");
  });

  it("rejects non-archived dish", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const useCase = new RestoreDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "dish-1" }),
    ).rejects.toBeInstanceOf(DishNotArchived);
  });

  it("rejects without dishes.restore", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.archive("user-1");
    await repo.save(dish);

    const useCase = new RestoreDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), { dishId: "dish-1" }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
});
