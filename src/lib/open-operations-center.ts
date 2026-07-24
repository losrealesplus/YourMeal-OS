/**
 * EP-002A.1.1 — safe entry into the Operations Center.
 *
 * Home / BrandLeafMark never navigate blindly: they ask this helper whether
 * a staff session exists, then either open the Ops Center (RBAC entry) or
 * send the user through `/auth/admin` with a safe return path.
 */
import type { AppRole } from "@/hooks/use-auth";
import { hasStaffAccess } from "@/permissions";
import { resolveOperationsEntry } from "@/lib/operations-workspaces";

export const OPERATIONS_CENTER_PATH = "/admin" as const;
export const OPERATIONS_AUTH_PATH = "/auth/admin" as const;

export type OperationsAuthSearch = {
  returnTo?: string;
};

export type OpenOperationsCenterResult =
  | { action: "navigate"; to: string }
  | {
      action: "auth";
      to: typeof OPERATIONS_AUTH_PATH;
      search: { returnTo: string };
    };

/** Only in-app backoffice paths may be used as post-login return targets. */
export function isSafeOperationsReturnPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("://") || path.includes("\\")) return false;
  return (
    path === OPERATIONS_CENTER_PATH ||
    path.startsWith(`${OPERATIONS_CENTER_PATH}/`) ||
    path === "/saas" ||
    path.startsWith("/saas/")
  );
}

export function parseOperationsAuthSearch(
  search: Record<string, unknown>,
): OperationsAuthSearch {
  const raw = search.returnTo;
  if (typeof raw !== "string" || !isSafeOperationsReturnPath(raw)) {
    return {};
  }
  return { returnTo: raw };
}

/**
 * Decide where "Centro de Operaciones" should go.
 * Staff → Ops Center or sole workspace. Everyone else → admin login + returnTo.
 */
export function decideOperationsCenterEntry(input: {
  sessionUserId: string | null;
  roles: readonly AppRole[];
}): OpenOperationsCenterResult {
  if (!input.sessionUserId || !hasStaffAccess(input.roles)) {
    return {
      action: "auth",
      to: OPERATIONS_AUTH_PATH,
      search: { returnTo: OPERATIONS_CENTER_PATH },
    };
  }

  if (input.roles.includes("saas_admin") && !hasTenantOpsRoles(input.roles)) {
    return { action: "navigate", to: "/saas" };
  }

  const entry = resolveOperationsEntry(input.roles);
  if (entry.kind === "direct") {
    return { action: "navigate", to: entry.path };
  }
  return { action: "navigate", to: OPERATIONS_CENTER_PATH };
}

function hasTenantOpsRoles(roles: readonly AppRole[]): boolean {
  return (
    roles.includes("company_admin") ||
    roles.includes("operations_manager") ||
    roles.some(
      (r) =>
        r === "kitchen" ||
        r === "production" ||
        r === "purchasing" ||
        r === "inventory" ||
        r === "support" ||
        r === "accounting" ||
        r === "logistics" ||
        r === "delivery",
    )
  );
}

/** Post-login destination for `/auth/admin` once staff roles are confirmed. */
export function resolvePostAdminLoginPath(
  roles: readonly AppRole[],
  returnTo?: string,
): string {
  if (returnTo && isSafeOperationsReturnPath(returnTo)) {
    return returnTo;
  }
  const decision = decideOperationsCenterEntry({
    sessionUserId: "authenticated",
    roles,
  });
  return decision.action === "navigate" ? decision.to : OPERATIONS_CENTER_PATH;
}
