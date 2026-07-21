import { describe, expect, it } from "vitest";
import { InvalidDishState, type DishDomainEvent } from "../domain";
import { ActivateDishUseCase } from "./activate-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("ActivateDishUseCase (UC-003)", () => {
  it("activates draft and publishes DishActivated", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new ActivateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), { dishId: "dish-1" });

    expect(result.status).toBe("active");
    expect(published.map((e) => e.type)).toEqual(["DishActivated"]);
  });

  it("rejects invalid transition active → active", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.activate();
    dish.pullDomainEvents();
    await repo.save(dish);

    const useCase = new ActivateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "dish-1" }),
    ).rejects.toBeInstanceOf(InvalidDishState);
  });

  it("rejects missing dish", async () => {
    const useCase = new ActivateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "missing" }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });

  it("rejects without permission", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish());

    const useCase = new ActivateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), { dishId: "dish-1" }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
});
