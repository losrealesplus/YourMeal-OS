import {
  Dish,
  DishId,
  DishName,
  type DishRepository,
  type TenantId,
} from "../../domain";

/** Test double — not production infrastructure. */
export class InMemoryDishRepository implements DishRepository {
  private readonly byId = new Map<string, Dish>();

  private key(tenantId: TenantId, id: DishId): string {
    return `${tenantId.toString()}:${id.toString()}`;
  }

  async save(dish: Dish): Promise<void> {
    this.byId.set(this.key(dish.getTenantId(), dish.getId()), dish);
  }

  async findById(tenantId: TenantId, id: DishId): Promise<Dish | null> {
    const dish = this.byId.get(this.key(tenantId, id));
    if (!dish || dish.isArchived()) return null;
    return dish;
  }

  async existsByName(tenantId: TenantId, name: DishName): Promise<boolean> {
    for (const dish of this.byId.values()) {
      if (
        dish.getTenantId().equals(tenantId) &&
        !dish.isArchived() &&
        dish.getName().equals(name)
      ) {
        return true;
      }
    }
    return false;
  }

  async listNotArchived(tenantId: TenantId): Promise<Dish[]> {
    return [...this.byId.values()]
      .filter((d) => d.getTenantId().equals(tenantId) && !d.isArchived())
      .sort((a, b) =>
        a.getName().toString().localeCompare(b.getName().toString()),
      );
  }

  async findByIdIncludingArchived(
    tenantId: TenantId,
    id: DishId,
  ): Promise<Dish | null> {
    return this.byId.get(this.key(tenantId, id)) ?? null;
  }

  async purge(tenantId: TenantId, id: DishId): Promise<void> {
    this.byId.delete(this.key(tenantId, id));
  }
}
