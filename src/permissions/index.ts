/**
 * Capability map — keep in sync with docs/09-security/CAPABILITY_MATRIX.md
 */

import type { AppRole } from "@/hooks/use-auth";
import { permissionDenied } from "@/domain/errors";

export type Capability =
  | "dishes.read"
  | "dishes.create"
  | "dishes.update"
  | "dishes.archive"
  | "dishes.restore"
  | "dishes.purge"
  | "dishes.write"
  | "ingredients.read"
  | "ingredients.create"
  | "ingredients.update"
  | "ingredients.archive"
  | "ingredients.write"
  | "recipes.read"
  | "recipes.write"
  | "menus.read"
  | "menus.write"
  | "orders.read"
  | "orders.write"
  | "orders.manage"
  | "customers.read"
  | "customers.write"
  | "support.read"
  | "support.write"
  | "kitchen.operate"
  | "production.operate"
  | "purchasing.operate"
  | "inventory.operate"
  | "accounting.operate"
  | "logistics.operate"
  | "admin.settings"
  | "brand.manage"
  | "company.manage"
  | "site.manage"
  | "organization.manage"
  | "employee.manage"
  | "users.create"
  | "saas.manage"
  | "tenants.manage"
  | "onboarding.manage"
  | "records.purge";

const STAFF_ROLES: AppRole[] = [
  "company_admin",
  "operations_manager",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
  "delivery",
];

/** Role → capabilities. Single source of truth with CAPABILITY_MATRIX.md */
const ROLE_CAPABILITIES: Record<AppRole, readonly Capability[]> = {
  saas_admin: [
    "dishes.read",
    "dishes.create",
    "dishes.update",
    "dishes.archive",
    "dishes.restore",
    "dishes.purge",
    "dishes.write",
    "ingredients.read",
    "ingredients.create",
    "ingredients.update",
    "ingredients.archive",
    "ingredients.write",
    "recipes.read",
    "recipes.write",
    "menus.read",
    "menus.write",
    "orders.read",
    "orders.write",
    "orders.manage",
    "customers.read",
    "customers.write",
    "support.read",
    "support.write",
    "kitchen.operate",
    "production.operate",
    "purchasing.operate",
    "inventory.operate",
    "accounting.operate",
    "logistics.operate",
    "admin.settings",
    "brand.manage",
    "company.manage",
    "site.manage",
    "organization.manage",
    "employee.manage",
    "users.create",
    "saas.manage",
    "tenants.manage",
    "onboarding.manage",
    "records.purge",
  ],
  company_admin: [
    "dishes.read",
    "dishes.create",
    "dishes.update",
    "dishes.archive",
    "dishes.restore",
    "dishes.write",
    "ingredients.read",
    "ingredients.create",
    "ingredients.update",
    "ingredients.archive",
    "ingredients.write",
    "recipes.read",
    "recipes.write",
    "menus.read",
    "menus.write",
    "orders.read",
    "orders.write",
    "orders.manage",
    "customers.read",
    "customers.write",
    "support.read",
    "support.write",
    "kitchen.operate",
    "production.operate",
    "purchasing.operate",
    "inventory.operate",
    "accounting.operate",
    "logistics.operate",
    "admin.settings",
    "brand.manage",
    "company.manage",
    "site.manage",
    "organization.manage",
    "employee.manage",
    "users.create",
  ],
  operations_manager: [
    "dishes.read",
    "ingredients.read",
    "recipes.read",
    "menus.read",
    "orders.read",
    "orders.write",
    "orders.manage",
    "customers.read",
    "customers.write",
    "kitchen.operate",
    "production.operate",
    "purchasing.operate",
    "inventory.operate",
    "logistics.operate",
    "company.manage",
    "site.manage",
    "organization.manage",
    "employee.manage",
    "users.create",
  ],
  kitchen: [
    "dishes.read",
    "ingredients.read",
    "recipes.read",
    "menus.read",
    "orders.read",
    "kitchen.operate",
  ],
  production: [
    "dishes.read",
    "dishes.create",
    "dishes.update",
    "dishes.write",
    "ingredients.read",
    "recipes.read",
    "recipes.write",
    "menus.read",
    "menus.write",
    "orders.read",
    "production.operate",
  ],
  purchasing: [
    "dishes.read",
    "ingredients.read",
    "ingredients.create",
    "ingredients.update",
    "ingredients.write",
    "recipes.read",
    "purchasing.operate",
  ],
  inventory: [
    "dishes.read",
    "ingredients.read",
    "ingredients.create",
    "ingredients.update",
    "ingredients.write",
    "recipes.read",
    "inventory.operate",
  ],
  accounting: ["orders.read", "customers.read", "accounting.operate"],
  logistics: ["orders.read", "customers.read", "logistics.operate"],
  delivery: ["orders.read", "customers.read", "logistics.operate"],
  support: [
    "customers.read",
    "customers.write",
    "orders.read",
    "orders.manage",
    "support.read",
    "support.write",
  ],
  driver: ["orders.read", "logistics.operate"],
  employee: ["dishes.read", "menus.read"],
  customer: ["menus.read", "orders.read", "orders.write"],
};

export function capabilitiesFor(roles: readonly AppRole[]): Set<Capability> {
  const set = new Set<Capability>();
  for (const role of roles) {
    for (const cap of ROLE_CAPABILITIES[role] ?? []) {
      set.add(cap);
    }
  }
  return set;
}

export function can(roles: readonly AppRole[], capability: Capability): boolean {
  if (capability === "dishes.write") {
    return (
      can(roles, "dishes.create") ||
      can(roles, "dishes.update") ||
      roles.some((r) => (ROLE_CAPABILITIES[r] ?? []).includes("dishes.write"))
    );
  }
  if (capability === "ingredients.write") {
    return (
      can(roles, "ingredients.create") ||
      can(roles, "ingredients.update") ||
      roles.some((r) => (ROLE_CAPABILITIES[r] ?? []).includes("ingredients.write"))
    );
  }
  return roles.some((role) => (ROLE_CAPABILITIES[role] ?? []).includes(capability));
}

export function canAny(roles: readonly AppRole[], caps: readonly Capability[]): boolean {
  return caps.some((c) => can(roles, c));
}

export function canAll(roles: readonly AppRole[], caps: readonly Capability[]): boolean {
  return caps.every((c) => can(roles, c));
}

export function isStaffRole(role: AppRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function hasStaffAccess(roles: readonly AppRole[]): boolean {
  return roles.some((r) => isStaffRole(r)) || roles.includes("saas_admin");
}

export function requireCapability(
  roles: readonly AppRole[],
  capability: Capability,
): void {
  if (!can(roles, capability)) {
    throw permissionDenied(capability);
  }
}

export { ROLE_CAPABILITIES, STAFF_ROLES };
