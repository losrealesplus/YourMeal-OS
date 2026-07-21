import { describe, expect, it } from "vitest";
import { InvalidDishState, type DishDomainEvent } from "../domain";
import { DeactivateDishUseCase } from "./deactivate-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("DeactivateDishUseCase (UC-004)", () => {
  it("deactivates active dish and publishes DishDeactivated", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.activate();
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new DeactivateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), { dishId: "dish-1" });

    expect(result.status).toBe("inactive");
    expect(published.map((e) => e.type)).toEqual(["DishDeactivated"]);
  });

  it("rejects deactivate from draft", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const useCase = new DeactivateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "dish-1" }),
    ).rejects.toBeInstanceOf(InvalidDishState);
  });

  it("rejects missing dish", async () => {
    const useCase = new DeactivateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "missing" }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });
});
