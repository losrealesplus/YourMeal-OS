import { describe, expect, it } from "vitest";
import {
  DishId,
  TenantId,
  type DishDomainEvent,
} from "../domain";
import { ArchiveDishUseCase } from "./archive-dish-use-case";
import { InMemoryDishRepository } from "./testing/in-memory-dish-repository";
import { actor, buildDraftDish, collectingPublisher } from "./testing/test-kit";

describe("ArchiveDishUseCase (UC-005)", () => {
  it("archives via save (not purge) and publishes DishArchived", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.pullDomainEvents();
    await repo.save(dish);

    const published: DishDomainEvent[] = [];
    const useCase = new ArchiveDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher(published),
    });

    const result = await useCase.execute(actor(), { dishId: "dish-1" });

    expect(result.status).toBe("archived");
    expect(published.map((e) => e.type)).toEqual(["DishArchived"]);

    expect(
      await repo.findById(
        TenantId.create("org-eatclean"),
        DishId.create("dish-1"),
      ),
    ).toBeNull();

    const archived = await repo.findByIdIncludingArchived(
      TenantId.create("org-eatclean"),
      DishId.create("dish-1"),
    );
    expect(archived!.isArchived()).toBe(true);
    expect(archived!.getArchivedBy()).toBe("user-admin-1");
  });

  it("rejects already archived", async () => {
    const repo = new InMemoryDishRepository();
    const dish = buildDraftDish();
    dish.archive("user-1");
    dish.pullDomainEvents();
    await repo.save(dish);

    const useCase = new ArchiveDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    // findById hides archived → NOT_FOUND; including archived path:
    // UC retrieves via findById per flow — archived appears as not found.
    await expect(
      useCase.execute(actor(), { dishId: "dish-1" }),
    ).rejects.toMatchObject({ code: "DISH_NOT_FOUND" });
  });

  it("rejects without dishes.archive", async () => {
    const repo = new InMemoryDishRepository();
    await repo.save(buildDraftDish());

    const useCase = new ArchiveDishUseCase({
      dishRepository: repo,
      eventPublisher: collectingPublisher([]),
    });

    await expect(
      useCase.execute(actor({ roles: ["customer"] }), { dishId: "dish-1" }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
});
