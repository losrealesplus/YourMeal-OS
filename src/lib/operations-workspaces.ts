/**
 * Operations workspaces — presentation mapping (ADR 0014 / Experience).
 * EP-OPS-002: kitchen → /admin/kitchen · delivery → /admin/delivery · support → /admin/support
 */
import type { AppRole } from "@/hooks/use-auth";

export type OperationsWorkspaceId =
  | "kitchen"
  | "delivery"
  | "stock"
  | "support"
  | "administration"
  | "finance";

export type OperationsWorkspacePath =
  | "/admin/kitchen"
  | "/admin/delivery"
  | "/admin/production"
  | "/admin/routes"
  | "/admin/inventory"
  | "/admin/customers"
  | "/admin/support"
  | "/admin/settings"
  | "/admin/accounting"
  | "/admin/orders";

export type OperationsWorkspace = {
  id: OperationsWorkspaceId;
  path: OperationsWorkspacePath;
  roles: readonly AppRole[];
};

export const OPERATIONS_WORKSPACES: readonly OperationsWorkspace[] = [
  {
    id: "kitchen",
    path: "/admin/kitchen",
    roles: ["kitchen", "production", "operations_manager"],
  },
  {
    id: "delivery",
    path: "/admin/delivery",
    roles: ["logistics", "delivery", "driver", "operations_manager"],
  },
  {
    id: "stock",
    path: "/admin/inventory",
    roles: ["inventory", "purchasing", "operations_manager"],
  },
  {
    id: "support",
    path: "/admin/support",
    roles: ["support", "operations_manager"],
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
  return (
    roles.includes("company_admin") ||
    roles.includes("saas_admin") ||
    roles.includes("operations_manager")
  );
}

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
  | {
      kind: "direct";
      path: OperationsWorkspacePath;
      workspace: OperationsWorkspace;
    };

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
