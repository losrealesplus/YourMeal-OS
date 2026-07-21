import { DomainError } from "@/domain/errors";

/**
 * Dish module domain errors.
 * @see docs/12-domain-model/module-01/Dish.md
 */

export class DishNameRequired extends DomainError {
  constructor() {
    super("INVALID_STATE", "Dish name is required", { field: "name" });
    this.name = "DishNameRequired";
  }
}

export class DishNameTooLong extends DomainError {
  constructor(maxLength: number) {
    super("INVALID_STATE", `Dish name must be at most ${maxLength} characters`, {
      field: "name",
      maxLength,
    });
    this.name = "DishNameTooLong";
  }
}

export class DishAlreadyArchived extends DomainError {
  constructor(dishId?: string) {
    super("INVALID_STATE", "Dish is already archived", { dishId });
    this.name = "DishAlreadyArchived";
  }
}

export class InvalidDishState extends DomainError {
  constructor(from: string, to: string) {
    super("INVALID_STATE", `Invalid dish state transition: ${from} → ${to}`, {
      from,
      to,
    });
    this.name = "InvalidDishState";
  }
}
