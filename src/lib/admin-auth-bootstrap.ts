/**
 * BUGFIX-001 / BUGFIX-002 · Admin auth bootstrap helpers.
 *
 * Ops entry (`enterOperationsCenter`) keeps ensurePlatformOwnerSession
 * **strict** — failures still throw (no privilege bypass).
 * Global navigation uses `tryEnsurePlatformOwnerSession` instead (BUGFIX-002).
 * Callers must catch, surface UI, and always clear loading state.
 */
import type { AppRole } from "@/hooks/use-auth";
import { hasStaffAccess } from "@/permissions";
import { resolvePostAdminLoginPath } from "@/lib/open-operations-center";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export type AdminAuthErrorKind =
  | "network"
  | "rpc_missing"
  | "auth"
  | "session"
  | "forbidden"
  | "unexpected";

export type ClassifiedAdminAuthError = {
  kind: AdminAuthErrorKind;
  /** i18n key under namespace `auth` */
  messageKey: string;
};

export type EnterOperationsCenterResult =
  | { status: "ok"; path: string }
  | { status: "not_staff" };

const MESSAGE_KEYS: Record<AdminAuthErrorKind, string> = {
  network: "adminBootstrapNetwork",
  rpc_missing: "adminBootstrapRpcMissing",
  auth: "adminBootstrapAuth",
  session: "adminBootstrapSession",
  forbidden: "adminBootstrapForbidden",
  unexpected: "adminBootstrapUnexpected",
};

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message}`;
  return String(error ?? "");
}

/**
 * Classify bootstrap failures for user-facing copy (no stack traces).
 */
export function classifyAdminAuthBootstrapError(
  error: unknown,
): ClassifiedAdminAuthError {
  const text = errorText(error).toLowerCase();

  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("fetch failed") ||
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("aborterror")
  ) {
    return { kind: "network", messageKey: MESSAGE_KEYS.network };
  }

  if (
    text.includes("ensure_platform_owner_session") ||
    text.includes("could not find the function") ||
    text.includes("schema cache") ||
    text.includes("pgrst202") ||
    text.includes("42883") || // undefined_function
    text.includes("migration not applied") ||
    text.includes("function missing")
  ) {
    return { kind: "rpc_missing", messageKey: MESSAGE_KEYS.rpc_missing };
  }

  if (
    text.includes("forbidden") ||
    text.includes("permission denied") ||
    text.includes("not authorized") ||
    text.includes("42501")
  ) {
    return { kind: "forbidden", messageKey: MESSAGE_KEYS.forbidden };
  }

  if (
    text.includes("auth session missing") ||
    (text.includes("session") && text.includes("missing")) ||
    text.includes("no session") ||
    (text.includes("jwt") &&
      (text.includes("expired") || text.includes("invalid")))
  ) {
    return { kind: "session", messageKey: MESSAGE_KEYS.session };
  }

  if (
    text.includes("auth") ||
    text.includes("not authenticated") ||
    text.includes("invalid login") ||
    text.includes("platform owner bootstrap failed")
  ) {
    return { kind: "auth", messageKey: MESSAGE_KEYS.auth };
  }

  return { kind: "unexpected", messageKey: MESSAGE_KEYS.unexpected };
}

export function reportAdminAuthBootstrapFailure(
  error: unknown,
  classified: ClassifiedAdminAuthError,
  context: {
    route?: string;
    userId?: string | null;
  } = {},
): void {
  const safeMessage =
    error instanceof Error ? error.message : String(error ?? "unknown");

  console.error("[BUGFIX-001] admin auth bootstrap failed", {
    kind: classified.kind,
    route: context.route ?? "/auth/admin",
    userId: context.userId ?? null,
    timestamp: new Date().toISOString(),
    message: safeMessage,
  });

  reportLovableError(error, {
    boundary: "auth_admin_bootstrap",
    kind: classified.kind,
    route: context.route ?? "/auth/admin",
    userId: context.userId ?? null,
    handled: true,
  });
}

/**
 * Staff gate after **strict** Platform Owner ensure (Ops / SaaS entry).
 * Propagates ensurePlatformOwnerSession errors — callers must catch.
 * Never converts ensure failure into staff access.
 */
export async function enterOperationsCenter(opts: {
  userId: string;
  returnTo?: string;
  /** Must be the strict ensure (default required:true). */
  ensurePlatformOwnerSession: () => Promise<unknown>;
  loadRoles: (userId: string) => Promise<AppRole[]>;
}): Promise<EnterOperationsCenterResult> {
  await opts.ensurePlatformOwnerSession();
  const roles = await opts.loadRoles(opts.userId);
  if (!hasStaffAccess(roles)) {
    return { status: "not_staff" };
  }
  const path = resolvePostAdminLoginPath(roles, opts.returnTo);
  return { status: "ok", path };
}
