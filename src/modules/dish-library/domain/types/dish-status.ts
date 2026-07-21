import { invalidState } from "@/domain/errors";
import { InvalidDishState } from "../errors";

/** Official Dish lifecycle values — domain source of truth. */
export const DISH_STATUS_VALUES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

export type DishStatusValue = (typeof DISH_STATUS_VALUES)[number];

const ALLOWED_TRANSITIONS: Record<DishStatusValue, readonly DishStatusValue[]> = {
  draft: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: ["inactive", "draft"],
};

function isDishStatusValue(value: string): value is DishStatusValue {
  return (DISH_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Dish lifecycle state machine — not free-form strings.
 * @see docs/12-domain-model/module-01/Dish.md
 */
export class DishStatus {
  private constructor(private readonly value: DishStatusValue) {}

  static draft(): DishStatus {
    return new DishStatus("draft");
  }

  static active(): DishStatus {
    return new DishStatus("active");
  }

  static inactive(): DishStatus {
    return new DishStatus("inactive");
  }

  static archived(): DishStatus {
    return new DishStatus("archived");
  }

  static from(value: string): DishStatus {
    if (!isDishStatusValue(value)) {
      throw invalidState(`Unknown dish status: ${value}`);
    }
    return new DishStatus(value);
  }

  toString(): DishStatusValue {
    return this.value;
  }

  isDraft(): boolean {
    return this.value === "draft";
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isInactive(): boolean {
    return this.value === "inactive";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  isOperational(): boolean {
    return this.value === "active";
  }

  canTransitionTo(target: DishStatus): boolean {
    return ALLOWED_TRANSITIONS[this.value].includes(target.value);
  }

  transitionTo(target: DishStatus): DishStatus {
    if (!this.canTransitionTo(target)) {
      throw new InvalidDishState(this.value, target.value);
    }
    return target;
  }

  equals(other: DishStatus): boolean {
    return this.value === other.value;
  }
}
