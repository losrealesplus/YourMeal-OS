import type { AppRole } from "@/hooks/use-auth";

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

/** Post-login home — one app; path depends on roles. */
export function homePathForRoles(roles: readonly AppRole[]): string {
  // Pure saas_admin → platform console. Staff + saas_admin falls through to
  // tenant home; the Centro de Operaciones surfaces a `/saas` entry there.
  if (
    roles.includes("saas_admin") &&
    !STAFF_ROLES.some((r) => roles.includes(r))
  ) {
    return "/saas";
  }
  if (roles.includes("operations_manager") || roles.includes("company_admin")) {
    return "/admin";
  }
  // Kitchen-only → Cocina; delivery/logistics-only → Reparto
  const staff = roles.filter((r) => STAFF_ROLES.includes(r));
  if (staff.length === 1 && staff[0] === "kitchen") return "/admin/kitchen";
  if (
    staff.length === 1 &&
    (staff[0] === "delivery" || staff[0] === "logistics")
  ) {
    return "/admin/delivery";
  }
  if (staff.includes("kitchen") && !staff.includes("delivery") && !staff.includes("logistics") && !staff.includes("operations_manager")) {
    return "/admin/kitchen";
  }
  if (
    (staff.includes("delivery") || staff.includes("logistics")) &&
    !staff.includes("kitchen") &&
    !staff.includes("operations_manager")
  ) {
    return "/admin/delivery";
  }
  if (roles.some((r) => STAFF_ROLES.includes(r))) return "/admin";
  if (roles.includes("driver")) return "/driver";
  return "/app";
}
