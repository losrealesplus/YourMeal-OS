/**
 * RBAC + Feature Flag catalogue of Operations Center departments.
 * Used to build menus that never link to empty / unauthorized surfaces.
 */
import type { AppRole } from "@/hooks/use-auth";
import { can, hasStaffAccess } from "@/permissions";
import {
  isOperationsAdmin,
  type OperationsWorkspaceId,
} from "@/lib/operations-workspaces";
import {
  PILOT_ADMIN_MODULE_FLAGS,
  type PilotAdminModuleFlag,
} from "@/lib/pilot-feature-flags";

export type OperationsDepartmentId =
  | "dashboard"
  | OperationsWorkspaceId
  | "customers"
  | "support"
  | "audit"
  | "settings"
  | "commercial";

export type OperationsDepartment = {
  id: OperationsDepartmentId;
  path: string;
  labelKey: string;
  /** When set, department is hidden unless the pilot module flag is on. */
  moduleFlag?: PilotAdminModuleFlag;
};

const DEPARTMENT_CATALOG: readonly OperationsDepartment[] = [
  {
    id: "dashboard",
    path: "/admin",
    labelKey: "ops.nav.operations",
  },
  {
    id: "kitchen",
    path: "/admin/kitchen",
    labelKey: "ops.nav.kitchen",
  },
  {
    id: "delivery",
    path: "/admin/delivery",
    labelKey: "ops.nav.delivery",
  },
  {
    id: "stock",
    path: "/admin/inventory",
    labelKey: "ops.nav.inventory",
    moduleFlag: PILOT_ADMIN_MODULE_FLAGS.inventory,
  },
  {
    id: "customers",
    path: "/admin/customers",
    labelKey: "ops.nav.customers",
  },
  {
    id: "support",
    path: "/admin/support",
    labelKey: "support",
  },
  {
    id: "commercial",
    path: "/admin/commercial",
    labelKey: "commercial",
  },
  {
    id: "finance",
    path: "/admin/accounting",
    labelKey: "accounting",
    moduleFlag: PILOT_ADMIN_MODULE_FLAGS.accounting,
  },
  {
    id: "administration",
    path: "/admin/users",
    labelKey: "users",
  },
  {
    id: "settings",
    path: "/admin/settings",
    labelKey: "settings",
  },
  {
    id: "audit",
    path: "/admin/audit",
    labelKey: "audit",
  },
] as const;

export type ModuleFlagMap = Partial<Record<PilotAdminModuleFlag, boolean>>;

function flagEnabled(
  flags: ModuleFlagMap,
  key: PilotAdminModuleFlag | undefined,
): boolean {
  if (!key) return true;
  return Boolean(flags[key]);
}

function mayAccessDepartment(
  dept: OperationsDepartment,
  roles: readonly AppRole[],
): boolean {
  const admin = isOperationsAdmin(roles) || roles.includes("saas_admin");

  switch (dept.id) {
    case "dashboard":
      return hasStaffAccess(roles);
    case "kitchen":
      return (
        can(roles, "kitchen.operate") ||
        roles.includes("kitchen") ||
        roles.includes("production") ||
        admin
      );
    case "delivery":
      return (
        can(roles, "logistics.operate") ||
        roles.includes("delivery") ||
        roles.includes("logistics") ||
        roles.includes("driver") ||
        admin
      );
    case "stock":
      return can(roles, "inventory.operate") || admin;
    case "customers":
      return can(roles, "customers.read") || admin;
    case "support":
      return can(roles, "support.read") || admin;
    case "commercial":
      return (
        can(roles, "customers.read") ||
        can(roles, "company.manage") ||
        can(roles, "admin.settings") ||
        admin
      );
    case "finance":
      return can(roles, "accounting.operate") || admin;
    case "administration":
    case "audit":
      return admin;
    case "settings":
      return can(roles, "admin.settings") || admin;
    default:
      return false;
  }
}

/** Departments the current staff user may open from the Ops Center. */
export function departmentsForRoles(
  roles: readonly AppRole[],
  moduleFlags: ModuleFlagMap = {},
): OperationsDepartment[] {
  if (!hasStaffAccess(roles)) return [];

  return DEPARTMENT_CATALOG.filter((dept) => {
    if (!mayAccessDepartment(dept, roles)) return false;
    return flagEnabled(moduleFlags, dept.moduleFlag);
  });
}
