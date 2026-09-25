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
  | "PRICE_MISMATCH"
  | "PRICE_UNAVAILABLE"
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

/**
 * Universal error message extractor — sanitizes Error, PostgREST objects,
 * strings, and arbitrary failure payloads into clean human-readable Spanish text.
 * Strictly guarantees NEVER returning "[object Object]".
 */
export function formatErrorMessage(
  error: unknown,
  fallback = "Ha ocurrido un error inesperado.",
): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : fallback;
  }

  if (error instanceof Error) {
    const msg = error.message?.trim();
    return msg && msg !== "[object Object]" ? msg : fallback;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      const msg = record.message.trim();
      if (msg !== "[object Object]") return msg;
    }

    if (typeof record.details === "string" && record.details.trim()) {
      return record.details.trim();
    }

    if (typeof record.hint === "string" && record.hint.trim()) {
      return record.hint.trim();
    }

    if (typeof record.error_description === "string" && record.error_description.trim()) {
      return record.error_description.trim();
    }

    if (typeof record.code === "string" && record.code.trim()) {
      return `Error (${record.code}): ${fallback}`;
    }
  }

  try {
    const str = String(error).trim();
    if (str && str !== "[object Object]") {
      return str;
    }
  } catch {
    // Ignore conversion failures
  }

  return fallback;
}

