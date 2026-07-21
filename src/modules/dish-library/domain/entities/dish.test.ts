import { describe, expect, it } from "vitest";
import {
  CategoryId,
  Dish,
  DishAlreadyArchived,
  DishCannotModifyWhenArchived,
  DishId,
  DishName,
  DishNameRequired,
  DishNotArchived,
  DishStatus,
  InvalidDishState,
  Money,
  TenantId,
} from "../index";

function createDish(overrides?: { name?: DishName; id?: DishId }) {
  return Dish.create({
    id: overrides?.id ?? DishId.create("dish-1"),
    tenantId: TenantId.create("tenant-1"),
    name: overrides?.name ?? DishName.create("Chicken Teriyaki"),
    categoryId: CategoryId.create("cat-mains"),
  });
}

describe("Dish entity", () => {
  it("creates in draft and records DishCreated", () => {
    const dish = createDish();
    expect(dish.getStatus().isDraft()).toBe(true);
    expect(dish.getTenantId().toString()).toBe("tenant-1");
    expect(dish.pullDomainEvents().map((e) => e.type)).toEqual(["DishCreated"]);
  });

  it("rejects empty name via DishName", () => {
    expect(() => DishName.create("   ")).toThrow(DishNameRequired);
  });

  it("activates from draft and deactivates", () => {
    const dish = createDish();
    dish.pullDomainEvents();

    dish.activate();
    expect(dish.getStatus().isActive()).toBe(true);
    expect(dish.isOperational()).toBe(true);

    dish.deactivate();
    expect(dish.getStatus().isInactive()).toBe(true);
    expect(dish.pullDomainEvents().map((e) => e.type)).toEqual([
      "DishActivated",
      "DishDeactivated",
    ]);
  });

  it("rejects invalid transition draft → inactive", () => {
    const dish = createDish();
    expect(() => dish.deactivate()).toThrow(InvalidDishState);
  });

  it("archives and restores to draft by default", () => {
    const dish = createDish();
    dish.activate();
    dish.pullDomainEvents();

    dish.archive("user-1");
    expect(dish.isArchived()).toBe(true);
    expect(dish.getArchivedBy()).toBe("user-1");
    expect(dish.getArchivedAt()).not.toBeNull();

    dish.restore();
    expect(dish.getStatus().isDraft()).toBe(true);
    expect(dish.getArchivedAt()).toBeNull();
    expect(dish.pullDomainEvents().map((e) => e.type)).toEqual([
      "DishArchived",
      "DishRestored",
    ]);
  });

  it("restores to inactive when requested", () => {
    const dish = createDish();
    dish.archive("user-1");
    dish.restore("inactive");
    expect(dish.getStatus().isInactive()).toBe(true);
  });

  it("rejects update and double-archive when archived", () => {
    const dish = createDish();
    dish.archive("user-1");

    expect(() =>
      dish.update({ name: DishName.create("Other") }),
    ).toThrow(DishCannotModifyWhenArchived);

    expect(() => dish.archive("user-2")).toThrow(DishAlreadyArchived);
  });

  it("rejects restore when not archived", () => {
    const dish = createDish();
    expect(() => dish.restore()).toThrow(DishNotArchived);
  });

  it("updates mutable fields and records DishUpdated", () => {
    const dish = createDish();
    dish.pullDomainEvents();

    dish.update({
      name: DishName.create("Salmon Bowl"),
      price: Money.create(12.5),
    });

    expect(dish.getName().toString()).toBe("Salmon Bowl");
    expect(dish.getPrice().toAmount()).toBe(12.5);
    expect(dish.pullDomainEvents().map((e) => e.type)).toEqual(["DishUpdated"]);
  });

  it("duplicates with new identity in draft", () => {
    const dish = createDish();
    dish.activate();
    dish.pullDomainEvents();

    const copy = dish.duplicate(DishId.create("dish-2"));
    expect(copy.getId().toString()).toBe("dish-2");
    expect(copy.getStatus().isDraft()).toBe(true);
    expect(copy.getTenantId().equals(dish.getTenantId())).toBe(true);
    expect(copy.getName().equals(dish.getName())).toBe(true);

    const types = copy.pullDomainEvents().map((e) => e.type);
    expect(types).toContain("DishCreated");
    expect(types).toContain("DishDuplicated");
  });

  it("never equals archived and active at the same time", () => {
    const dish = createDish();
    dish.activate();
    dish.archive("user-1");
    expect(dish.getStatus().isArchived()).toBe(true);
    expect(dish.getStatus().isActive()).toBe(false);
    expect(dish.getStatus()).toEqual(DishStatus.archived());
  });
});
