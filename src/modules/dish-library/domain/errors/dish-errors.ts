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

export class DishCategoryRequired extends DomainError {
  constructor() {
    super("INVALID_STATE", "Dish category is required", { field: "categoryId" });
    this.name = "DishCategoryRequired";
  }
}

/** Application coordination: name uniqueness within the Organization. */
export class DishAlreadyExists extends DomainError {
  constructor(name: string, tenantId?: string) {
    super("DISH_ALREADY_EXISTS", `Dish already exists: ${name}`, {
      name,
      tenantId,
    });
    this.name = "DishAlreadyExists";
  }
}

export class DishAlreadyArchived extends DomainError {
  constructor(dishId?: string) {
    super("INVALID_STATE", "Dish is already archived", { dishId });
    this.name = "DishAlreadyArchived";
  }
}

export class DishNotArchived extends DomainError {
  constructor(dishId?: string) {
    super("INVALID_STATE", "Dish is not archived", { dishId });
    this.name = "DishNotArchived";
  }
}

export class DishCannotModifyWhenArchived extends DomainError {
  constructor(dishId?: string) {
    super("INVALID_STATE", "Archived dish cannot be modified; restore first", {
      dishId,
    });
    this.name = "DishCannotModifyWhenArchived";
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
