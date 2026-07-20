/**
 * Permission capabilities — never hardcode role checks in UI.
 * Components ask `can(roles, "dishes.write")`.
 *
 * @see docs/adr/0004-authentication-rbac.md
 */

import type { AppRole } from "@/hooks/use-auth";

export type Capability =
  | "dishes.read"
  | "dishes.write"
  | "ingredients.read"
  | "ingredients.write"
  | "menus.read"
  | "menus.write"
  | "orders.read"
  | "orders.write"
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
  | "saas.manage";

const ALL_STAFF: AppRole[] = [
  "company_admin",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
];

/** Role → capabilities. Single source of truth for UI gating. */
const ROLE_CAPABILITIES: Record<AppRole, readonly Capability[]> = {
  saas_admin: [
    "dishes.read",
    "dishes.write",
    "ingredients.read",
    "ingredients.write",
    "menus.read",
    "menus.write",
    "orders.read",
    "orders.write",
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
    "saas.manage",
  ],
  company_admin: [
    "dishes.read",
    "dishes.write",
    "ingredients.read",
    "ingredients.write",
    "menus.read",
    "menus.write",
    "orders.read",
    "orders.write",
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
  ],
  kitchen: ["dishes.read", "ingredients.read", "menus.read", "orders.read", "kitchen.operate"],
  production: [
    "dishes.read",
    "ingredients.read",
    "menus.read",
    "orders.read",
    "production.operate",
  ],
  purchasing: ["dishes.read", "ingredients.read", "ingredients.write", "purchasing.operate"],
  inventory: ["dishes.read", "ingredients.read", "ingredients.write", "inventory.operate"],
  accounting: ["orders.read", "customers.read", "accounting.operate"],
  logistics: ["orders.read", "customers.read", "logistics.operate"],
  support: ["customers.read", "customers.write", "orders.read", "support.read", "support.write"],
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
  return roles.some((role) => (ROLE_CAPABILITIES[role] ?? []).includes(capability));
}

export function canAny(roles: readonly AppRole[], caps: readonly Capability[]): boolean {
  return caps.some((c) => can(roles, c));
}

export function isStaffRole(role: AppRole): boolean {
  return ALL_STAFF.includes(role);
}

export { ROLE_CAPABILITIES };
