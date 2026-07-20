/**
 * Typed domain errors — never throw bare Error for expected business failures.
 * @see docs/05-architecture/FOUNDATION_LOCK.md
 */

export type DomainErrorCode =
  | "PERMISSION_DENIED"
  | "TENANT_MISMATCH"
  | "NOT_FOUND"
  | "DISH_NOT_FOUND"
  | "DISH_ALREADY_EXISTS"
  | "INGREDIENT_NOT_FOUND"
  | "INVALID_RECIPE"
  | "ORDER_CLOSED"
  | "MENU_LOCKED"
  | "INVALID_STATE"
  | "UNIMPLEMENTED";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: DomainErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

export function permissionDenied(capability: string): DomainError {
  return new DomainError(
    "PERMISSION_DENIED",
    `Missing capability: ${capability}`,
    { capability },
  );
}

export function notFound(entity: string, id?: string): DomainError {
  return new DomainError("NOT_FOUND", `${entity} not found`, { entity, id });
}

export function dishNotFound(id: string): DomainError {
  return new DomainError("DISH_NOT_FOUND", "Dish not found", { id });
}

export function tenantMismatch(): DomainError {
  return new DomainError("TENANT_MISMATCH", "Tenant mismatch");
}

export function invalidState(message: string): DomainError {
  return new DomainError("INVALID_STATE", message);
}

export function unimplemented(what: string): DomainError {
  return new DomainError("UNIMPLEMENTED", `${what} is not implemented yet`);
}
