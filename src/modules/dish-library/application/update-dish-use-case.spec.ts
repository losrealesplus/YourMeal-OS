import { describe, expect, it } from "vitest";
import {
  DishAlreadyExists,
  DishId,
  DishNameRequired,
  TenantId,
  type DishDomainEvent,
} from "../domain";
import { UpdateDishUseCase } from "./update-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("UpdateDishUseCase (UC-002)", () => {
  it("updates editable fields and publishes DishUpdated", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new UpdateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), {
      dishId: "dish-1",
      name: "Chicken Teriyaki Deluxe",
      price: 12.5,
    });

    expect(result.name).toBe("Chicken Teriyaki Deluxe");
    expect(published.map((e) => e.type)).toEqual(["DishUpdated"]);

    const stored = await repo.findById(
      TenantId.create("org-eatclean"),
      DishId.create("dish-1"),
    );
    expect(stored!.getPrice().toAmount()).toBe(12.5);
  });

  it("rejects rename to an existing name", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish({ id: "dish-1", name: "Alpha" }));
    await repo.save(buildDraftDish({ id: "dish-2", name: "Beta" }));

    const useCase = new UpdateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "dish-1", name: "Beta" }),
    ).rejects.toBeInstanceOf(DishAlreadyExists);
  });

  it("rejects missing dish", async () => {
    const useCase = new UpdateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "missing", name: "X" }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });

  it("rejects without dishes.update", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish());

    const useCase = new UpdateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), {
        dishId: "dish-1",
        name: "X",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("propagates invalid name", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish());

    const useCase = new UpdateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor(), { dishId: "dish-1", name: "  " }),
    ).rejects.toBeInstanceOf(DishNameRequired);
  });
});
