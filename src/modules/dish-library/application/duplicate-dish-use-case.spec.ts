import { describe, expect, it } from "vitest";
import {
  DishAlreadyExists,
  DishId,
  TenantId,
  type DishDomainEvent,
} from "../domain";
import { DuplicateDishUseCase } from "./duplicate-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import {
  actor,
  buildDraftDish,
  collectingPublisher,
  sequentialIds,
} from "./testing/test-kit";

describe("DuplicateDishUseCase (UC-007)", () => {
  it("duplicates into draft and publishes DishCreated + DishDuplicated", async () => {
    const repo = new InMemoryDishRepository();
    const source = buildDraftDish({ id: "dish-src", name: "Original" });
    source.pullDomainEvents();
    await repo.save(source);

    const published: DishDomainEvent[] = [];
    const useCase = new DuplicateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
      idGenerator: sequentialIds("dish-copy"),
    });

    const result = await useCase.execute(actor(), {
      sourceDishId: "dish-src",
      name: "Original Copy",
    });

    expect(result).toMatchObject({
      dishId: "dish-copy",
      name: "Original Copy",
      status: "draft",
      sourceDishId: "dish-src",
    });
    expect(published.map((e) => e.type).sort()).toEqual(
      ["DishCreated", "DishDuplicated"].sort(),
    );

    const copy = await repo.findById(
      TenantId.create("org-eatclean"),
      DishId.create("dish-copy"),
    );
    expect(copy).not.toBeNull();
  });

  it("rejects duplicate name", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish({ id: "dish-src", name: "Original" }));
    await repo.save(buildDraftDish({ id: "dish-other", name: "Taken" }));

    const useCase = new DuplicateDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
      idGenerator: sequentialIds("dish-copy"),
    });

    await expect(
      useCase.execute(actor(), {
        sourceDishId: "dish-src",
        name: "Taken",
      }),
    ).rejects.toBeInstanceOf(DishAlreadyExists);
  });

  it("rejects missing source", async () => {
    const useCase = new DuplicateDishUseCase({
      dishRepository: new InMemoryDishRepository(),
      eventPublisher: collectingPublisher([]),
      idGenerator: sequentialIds("dish-copy"),
    });

    await expect(
      useCase.execute(actor(), {
        sourceDishId: "missing",
        name: "Copy",
      }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });
});
