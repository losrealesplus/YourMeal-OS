import { describe, expect, it } from "vitest";
import type { AppRole } from "@/hooks/use-auth";
import { CreateDishUseCase } from "../application/create-dish-use-case";
import { ActivateDishUseCase } from "../application/activate-dish-use-case";
import { DeactivateDishUseCase } from "../application/deactivate-dish-use-case";
import { ArchiveDishUseCase } from "../application/archive-dish-use-case";
import { RestoreDishUseCase } from "../application/restore-dish-use-case";
import { UpdateDishUseCase } from "../application/update-dish-use-case";
import { DuplicateDishUseCase } from "../application/duplicate-dish-use-case";
import { AssignRecipeToDishUseCase } from "../application/assign-recipe-to-dish-use-case";
import type { DishDomainEvent } from "../domain";
import { PersistenceBackedDishRepository } from "./testing/persistence-backed-dish-repository";

/**
 * Infrastructure Validation — Use Cases against persistence-shaped adapter
 * that uses the same Domain ↔ Row mapper as SupabaseDishRepository.
 * Core (Domain + Application) unchanged.
 */

const actor = {
  organizationId: "org-eatclean",
  actorId: "user-admin-1",
  roles: ["company_admin"] as AppRole[],
};

function publisher(sink: DishDomainEvent[]) {
  return {
    publish: async (events: readonly DishDomainEvent[]) => {
      sink.push(...events);
    },
  };
}

function ids(...values: string[]) {
  let i = 0;
  return {
    generate: () => values[i++] ?? `id-${i}`,
  };
}

describe("Infrastructure Validation · Dish Management via persistence adapter", () => {
  it("runs Create → Update → Activate → Deactivate → Archive → Restore", async () => {
    const repo = new PersistenceBackedDishRepository();
    const events: DishDomainEvent[] = [];
    const bus = publisher(events);

    const created = await new CreateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
      idGenerator: ids("dish-1"),
    }).execute(actor, {
      name: "Bowl Verde",
      categoryId: "cat-bowls",
      price: 11,
    });

    expect(created.status).toBe("draft");
    expect(repo.dump()[0]?.category_id).toBe("cat-bowls");
    expect(repo.dump()[0]?.status).toBe("draft");

    await new UpdateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1", price: 12 });

    await new ActivateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1" });
    expect(repo.dump()[0]?.status).toBe("active");

    await new DeactivateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1" });
    expect(repo.dump()[0]?.status).toBe("inactive");

    await new ActivateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1" });

    await new ArchiveDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1" });
    expect(repo.dump()[0]?.status).toBe("archived");
    expect(repo.dump()[0]?.deleted_at).not.toBeNull();

    const restored = await new RestoreDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, { dishId: "dish-1" });

    expect(restored.status).toBe("draft");
    expect(repo.dump()[0]?.deleted_at).toBeNull();
  });

  it("runs Duplicate and AssignRecipe through persistence mapping", async () => {
    const repo = new PersistenceBackedDishRepository();
    const bus = publisher([]);

    await new CreateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
      idGenerator: ids("dish-src"),
    }).execute(actor, {
      name: "Original",
      categoryId: "cat-mains",
    });

    const dup = await new DuplicateDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
      idGenerator: ids("dish-copy"),
    }).execute(actor, {
      sourceDishId: "dish-src",
      name: "Original Copy",
    });

    expect(dup.status).toBe("draft");
    expect(repo.dump().some((r) => r.id === "dish-copy")).toBe(true);

    await new AssignRecipeToDishUseCase({
      dishRepository: repo,
      eventPublisher: bus,
    }).execute(actor, {
      dishId: "dish-copy",
      recipeId: "recipe-1",
    });

    expect(repo.dump().find((r) => r.id === "dish-copy")?.recipe_id).toBe(
      "recipe-1",
    );
  });
});
