/**
 * Operations workspaces — presentation mapping only (ADR 0014 / Experience).
 * Visibility uses existing AppRole values. Does not invent RBAC or capabilities.
 *
 * Roles are multi-user: many people can share the same role.
 * Workspaces are the day-to-day entry points for those roles.
 */
import type { AppRole } from "@/hooks/use-auth";

export type OperationsWorkspaceId =
  | "kitchen"
  | "delivery"
  | "stock"
  | "customers"
  | "administration"
  | "finance";

export type OperationsWorkspacePath =
  | "/admin/production"
  | "/admin/routes"
  | "/admin/inventory"
  | "/admin/customers"
  | "/admin/settings"
  | "/admin/accounting";

export type OperationsWorkspace = {
  id: OperationsWorkspaceId;
  /** Existing admin route — no new modules. */
  path: OperationsWorkspacePath;
  /** Roles that unlock this workspace. company_admin / saas_admin see all. */
  roles: readonly AppRole[];
};

/** Canonical workspaces of the EatClean Operations Center. */
export const OPERATIONS_WORKSPACES: readonly OperationsWorkspace[] = [
  {
    id: "kitchen",
    path: "/admin/production",
    roles: ["kitchen", "production"],
  },
  {
    id: "delivery",
    path: "/admin/routes",
    roles: ["logistics"],
  },
  {
    id: "stock",
    path: "/admin/inventory",
    roles: ["inventory", "purchasing"],
  },
  {
    id: "customers",
    path: "/admin/customers",
    roles: ["support"],
  },
  {
    id: "administration",
    path: "/admin/settings",
    roles: [],
  },
  {
    id: "finance",
    path: "/admin/accounting",
    roles: ["accounting"],
  },
] as const;

export function isOperationsAdmin(roles: readonly AppRole[]): boolean {
  return roles.includes("company_admin") || roles.includes("saas_admin");
}

/**
 * Workspaces the signed-in user may enter.
 * Admin → all. Otherwise → role intersection. Never show locked cards.
 */
export function workspacesForRoles(
  roles: readonly AppRole[],
): OperationsWorkspace[] {
  if (isOperationsAdmin(roles)) {
    return [...OPERATIONS_WORKSPACES];
  }
  return OPERATIONS_WORKSPACES.filter((ws) => {
    if (ws.id === "administration") return false;
    return ws.roles.some((r) => roles.includes(r));
  });
}

export type OperationsEntry =
  | { kind: "center"; workspaces: OperationsWorkspace[] }
  | { kind: "direct"; path: OperationsWorkspacePath; workspace: OperationsWorkspace };

/**
 * Entry rule:
 * - Admin → always Operations Center (picker)
 * - Exactly 1 workspace → enter directly
 * - 2+ → Operations Center
 * - 0 → Operations Center empty state (rare)
 */
export function resolveOperationsEntry(
  roles: readonly AppRole[],
): OperationsEntry {
  const workspaces = workspacesForRoles(roles);
  if (!isOperationsAdmin(roles) && workspaces.length === 1) {
    const workspace = workspaces[0]!;
    return { kind: "direct", path: workspace.path, workspace };
  }
  return { kind: "center", workspaces };
}

/** @deprecated Prefer resolveOperationsEntry */
export function shouldShowOperationsCenter(roles: readonly AppRole[]): boolean {
  return resolveOperationsEntry(roles).kind === "center";
}

/** @deprecated Prefer resolveOperationsEntry */
export function soleWorkspace(
  roles: readonly AppRole[],
): OperationsWorkspace | null {
  const entry = resolveOperationsEntry(roles);
  return entry.kind === "direct" ? entry.workspace : null;
}
