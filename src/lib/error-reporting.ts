/**
 * Global runtime error reporting helper for YourMeal OS
 */

export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[YMOS-RUNTIME-ERROR]", message, {
    route: window.location.pathname,
    ...context,
    error,
  });
}

// Backward compatibility alias
export const reportLovableError = reportRuntimeError;
