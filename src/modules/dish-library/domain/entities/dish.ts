import {
  DishAlreadyArchived,
  DishCannotModifyWhenArchived,
  DishCategoryRequired,
  DishNotArchived,
} from "../errors";
import type { DishDomainEvent } from "../events";
import {
  CategoryId,
  DishId,
  DishStatus,
  RecipeId,
  TenantId,
} from "../types";
import {
  DishName,
  Money,
  NutritionFacts,
  PortionSize,
} from "../value-objects";

/**
 * Dish — commercial food product (business unit).
 * Pure domain: no I/O, no UI, no persistence.
 *
 * @see docs/12-domain-model/module-01/Dish.md
 * @see docs/12-domain-model/ENTITY_GUIDELINES.md
 */

export type DishCreateProps = {
  id: DishId;
  tenantId: TenantId;
  name: DishName;
  categoryId: CategoryId;
  description?: string | null;
  photoUrl?: string | null;
  portionSize?: PortionSize | null;
  nutrition?: NutritionFacts;
  cost?: Money;
  price?: Money;
  allergens?: readonly string[];
  tags?: readonly string[];
  recipeId?: RecipeId | null;
  createdAt?: Date;
};

export type DishReconstituteProps = {
  id: DishId;
  tenantId: TenantId;
  name: DishName;
  categoryId: CategoryId;
  description: string | null;
  photoUrl: string | null;
  portionSize: PortionSize | null;
  nutrition: NutritionFacts;
  cost: Money;
  price: Money;
  allergens: readonly string[];
  tags: readonly string[];
  recipeId: RecipeId | null;
  status: DishStatus;
  archivedAt: Date | null;
  archivedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DishUpdateProps = {
  name?: DishName;
  categoryId?: CategoryId;
  description?: string | null;
  photoUrl?: string | null;
  portionSize?: PortionSize | null;
  nutrition?: NutritionFacts;
  cost?: Money;
  price?: Money;
  allergens?: readonly string[];
  tags?: readonly string[];
};

export type DishRestoreTarget = "draft" | "inactive";

export class Dish {
  private readonly pendingEvents: DishDomainEvent[] = [];

  private constructor(
    private readonly id: DishId,
    private readonly tenantId: TenantId,
    private name: DishName,
    private categoryId: CategoryId,
    private description: string | null,
    private photoUrl: string | null,
    private portionSize: PortionSize | null,
    private nutrition: NutritionFacts,
    private cost: Money,
    private price: Money,
    private allergens: string[],
    private tags: string[],
    private recipeId: RecipeId | null,
    private status: DishStatus,
    private archivedAt: Date | null,
    private archivedBy: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  /** Create a new Dish in `draft`. */
  static create(props: DishCreateProps): Dish {
    const now = props.createdAt ?? new Date();
    const dish = new Dish(
      props.id,
      props.tenantId,
      props.name,
      props.categoryId,
      props.description ?? null,
      props.photoUrl ?? null,
      props.portionSize ?? null,
      props.nutrition ?? NutritionFacts.empty(),
      props.cost ?? Money.create(0),
      props.price ?? Money.create(0),
      [...(props.allergens ?? [])],
      [...(props.tags ?? [])],
      props.recipeId ?? null,
      DishStatus.draft(),
      null,
      null,
      now,
      now,
    );

    dish.record({
      type: "DishCreated",
      dishId: dish.id.toString(),
      tenantId: dish.tenantId.toString(),
    });

    return dish;
  }

  /** Rebuild from persistence / snapshot — no events. */
  static reconstitute(props: DishReconstituteProps): Dish {
    return new Dish(
      props.id,
      props.tenantId,
      props.name,
      props.categoryId,
      props.description,
      props.photoUrl,
      props.portionSize,
      props.nutrition,
      props.cost,
      props.price,
      [...props.allergens],
      [...props.tags],
      props.recipeId,
      props.status,
      props.archivedAt,
      props.archivedBy,
      props.createdAt,
      props.updatedAt,
    );
  }

  getId(): DishId {
    return this.id;
  }

  getTenantId(): TenantId {
    return this.tenantId;
  }

  getName(): DishName {
    return this.name;
  }

  getCategoryId(): CategoryId {
    return this.categoryId;
  }

  getDescription(): string | null {
    return this.description;
  }

  getPhotoUrl(): string | null {
    return this.photoUrl;
  }

  getPortionSize(): PortionSize | null {
    return this.portionSize;
  }

  getNutrition(): NutritionFacts {
    return this.nutrition;
  }

  getCost(): Money {
    return this.cost;
  }

  getPrice(): Money {
    return this.price;
  }

  getAllergens(): readonly string[] {
    return this.allergens;
  }

  getTags(): readonly string[] {
    return this.tags;
  }

  getRecipeId(): RecipeId | null {
    return this.recipeId;
  }

  getStatus(): DishStatus {
    return this.status;
  }

  getArchivedAt(): Date | null {
    return this.archivedAt;
  }

  getArchivedBy(): string | null {
    return this.archivedBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isOperational(): boolean {
    return this.status.isOperational();
  }

  isArchived(): boolean {
    return this.status.isArchived();
  }

  update(props: DishUpdateProps): void {
    this.assertNotArchived();

    if (props.name !== undefined) this.name = props.name;
    if (props.categoryId !== undefined) this.categoryId = props.categoryId;
    if (props.description !== undefined) this.description = props.description;
    if (props.photoUrl !== undefined) this.photoUrl = props.photoUrl;
    if (props.portionSize !== undefined) this.portionSize = props.portionSize;
    if (props.nutrition !== undefined) this.nutrition = props.nutrition;
    if (props.cost !== undefined) this.cost = props.cost;
    if (props.price !== undefined) this.price = props.price;
    if (props.allergens !== undefined) this.allergens = [...props.allergens];
    if (props.tags !== undefined) this.tags = [...props.tags];

    this.touch();
    this.record({
      type: "DishUpdated",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  assignRecipe(recipeId: RecipeId): void {
    this.assertNotArchived();
    this.recipeId = recipeId;
    this.touch();
    this.record({
      type: "RecipeAssigned",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  clearRecipe(): void {
    this.assertNotArchived();
    if (this.recipeId == null) return;
    this.recipeId = null;
    this.touch();
    this.record({
      type: "RecipeUpdated",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  /**
   * Activate for planning / production / orders / menus.
   * Requires category (invariant). Recipe validity deferred to Recipe domain.
   */
  activate(): void {
    this.assertCanActivate();
    this.status = this.status.transitionTo(DishStatus.active());
    this.archivedAt = null;
    this.archivedBy = null;
    this.touch();
    this.record({
      type: "DishActivated",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  deactivate(): void {
    this.status = this.status.transitionTo(DishStatus.inactive());
    this.touch();
    this.record({
      type: "DishDeactivated",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  archive(archivedBy: string): void {
    if (this.status.isArchived()) {
      throw new DishAlreadyArchived(this.id.toString());
    }

    this.status = this.status.transitionTo(DishStatus.archived());
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    this.touch();
    this.record({
      type: "DishArchived",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  /**
   * Restore from archive. Default target: `draft` (Dish.md / existing Service policy).
   * State machine also allows `inactive`.
   */
  restore(target: DishRestoreTarget = "draft"): void {
    if (!this.status.isArchived()) {
      throw new DishNotArchived(this.id.toString());
    }

    const next =
      target === "inactive" ? DishStatus.inactive() : DishStatus.draft();
    this.status = this.status.transitionTo(next);
    this.archivedAt = null;
    this.archivedBy = null;
    this.touch();
    this.record({
      type: "DishRestored",
      dishId: this.id.toString(),
      tenantId: this.tenantId.toString(),
    });
  }

  /**
   * Duplicate within the same tenant. New identity, always starts as `draft`.
   * Name uniqueness across tenant is enforced by Domain Service / Repository — not here.
   */
  duplicate(newId: DishId, name: DishName = this.name): Dish {
    const copy = Dish.create({
      id: newId,
      tenantId: this.tenantId,
      name,
      categoryId: this.categoryId,
      description: this.description,
      photoUrl: this.photoUrl,
      portionSize: this.portionSize,
      nutrition: this.nutrition,
      cost: this.cost,
      price: this.price,
      allergens: this.allergens,
      tags: this.tags,
      recipeId: this.recipeId,
    });

    copy.record({
      type: "DishDuplicated",
      sourceDishId: this.id.toString(),
      newDishId: newId.toString(),
      tenantId: this.tenantId.toString(),
    });

    return copy;
  }

  pullDomainEvents(): DishDomainEvent[] {
    const events = [...this.pendingEvents];
    this.pendingEvents.length = 0;
    return events;
  }

  private assertNotArchived(): void {
    if (this.status.isArchived()) {
      throw new DishCannotModifyWhenArchived(this.id.toString());
    }
  }

  private assertCanActivate(): void {
    // CategoryId.create already rejects empty; guard for reconstitute edge cases.
    if (!this.categoryId.toString()) {
      throw new DishCategoryRequired();
    }
    // Recipe validity: deferred — Recipe aggregate not defined yet (Dish.md).
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  private record(event: DishDomainEvent): void {
    this.pendingEvents.push(event);
  }
}
