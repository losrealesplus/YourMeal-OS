import { describe, expect, it } from "vitest";
import {
  DishId,
  TenantId,
  type DishDomainEvent,
} from "../domain";
import { AssignRecipeToDishUseCase } from "./assign-recipe-to-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("AssignRecipeToDishUseCase (UC-008)", () => {
  it("assigns recipe and publishes RecipeAssigned", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new AssignRecipeToDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), {
      dishId: "dish-1",
      recipeId: "recipe-99",
    });

    expect(result.recipeId).toBe("recipe-99");
    expect(published.map((e) => e.type)).toEqual(["RecipeAssigned"]);

    const stored = await repo.findById(
      TenantId.create("org-eatclean"),
      DishId.create("dish-1"),
    );
    expect(stored!.getRecipeId()!.toString()).toBe("recipe-99");
  });

  it("rejects archived dish", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.archive("user-1");
    await repo.save(dish);

    const useCase = new AssignRecipeToDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    // Archived hidden by findById
    await expect(
      useCase.execute(actor(), {
        dishId: "dish-1",
        recipeId: "recipe-99",
      }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });

  it("rejects without permission", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish());

    const useCase = new AssignRecipeToDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), {
        dishId: "dish-1",
        recipeId: "recipe-99",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
});
