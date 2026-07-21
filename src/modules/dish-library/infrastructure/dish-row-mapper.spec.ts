import { describe, expect, it } from "vitest";
import {
  CategoryId,
  Dish,
  DishId,
  DishName,
  Money,
  TenantId,
} from "../domain";
import { mapDishToRow, mapRowToDish, type DishRow } from "./dish-row-mapper";

function draftDish() {
  return Dish.create({
    id: DishId.create("11111111-1111-1111-1111-111111111111"),
    tenantId: TenantId.create("22222222-2222-2222-2222-222222222222"),
    name: DishName.create("Paella"),
    categoryId: CategoryId.create("cat-mains"),
    price: Money.create(9.5),
    cost: Money.create(3.2),
  });
}

describe("dish-row-mapper (Infrastructure)", () => {
  it("round-trips draft without re-emitting domain create semantics", () => {
    const dish = draftDish();
    dish.pullDomainEvents();

    const row = mapDishToRow(dish) as DishRow;
    expect(row.status).toBe("draft");
    expect(row.category_id).toBe("cat-mains");
    expect(row.deleted_at).toBeNull();

    const restored = mapRowToDish({
      ...row,
      macros: {},
      allergens: row.allergens ?? [],
      tags: row.tags ?? [],
      prep_minutes: null,
      prep_instructions: null,
    } as DishRow);

    expect(restored.getName().toString()).toBe("Paella");
    expect(restored.getStatus().isDraft()).toBe(true);
    expect(restored.pullDomainEvents()).toEqual([]);
  });

  it("persists inactive status (domain → row)", () => {
    const dish = draftDish();
    dish.activate();
    dish.deactivate();
    dish.pullDomainEvents();

    const row = mapDishToRow(dish);
    expect(row.status).toBe("inactive");
    expect(row.deleted_at).toBeNull();
  });

  it("maps archive to deleted_at / deleted_by and status archived", () => {
    const dish = draftDish();
    dish.archive("user-9");
    dish.pullDomainEvents();

    const row = mapDishToRow(dish);
    expect(row.status).toBe("archived");
    expect(row.deleted_by).toBe("user-9");
    expect(row.deleted_at).not.toBeNull();
  });
});
