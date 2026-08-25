import type { AppRole } from "@/hooks/use-auth";
import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";

/**
 * EP-OPS-002 · Landing Policy (LP-001)
 * Deterministic post-login / post-auth home. Single source for login, "/", Bootstrap.
 * @see docs/10-validation/LANDING_POLICY_VALIDATION.md
 */

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

function hasTenantStaff(roles: readonly AppRole[]): boolean {
  return STAFF_ROLES.some((r) => roles.includes(r));
}

/**
 * Priority (highest first):
 * 1. Pure Platform (`saas_admin` without tenant staff on central platform) → `/saas`
 * 2. Platform Principal on customer tenant instance → `/admin` (tenant operational context)
 * 3. Company Admin / Operations Manager → Tenant Ops `/admin`
 * 4. Sole department workspace (kitchen, delivery, support, accounting, …)
 * 5. Other tenant staff → `/admin`
 * 6. Driver → `/driver`
 * 7. Customer / default → `/app`
 *
 * Hybrid Platform + Tenant staff → Tenant Surface first (`/admin`);
 * Platform entry remains available via SaaS ops entry (not a second ambiguous landing).
 */
export function homePathForRoles(
  roles: readonly AppRole[],
  host?: string,
): string {
  const currentHost =
    host ??
    (typeof window !== "undefined" ? window.location.hostname : undefined);
  let isCustomerTenant = false;
  try {
    const config = resolveInstanceRuntimeConfig(currentHost);
    isCustomerTenant = config.instanceType === "customer_tenant";
  } catch {
    // default to false
  }

  if (roles.includes("saas_admin")) {
    if (isCustomerTenant) {
      return "/admin";
    }
    if (!hasTenantStaff(roles)) {
      return "/saas";
    }
    return "/admin";
  }
  if (roles.includes("operations_manager") || roles.includes("company_admin")) {
    return "/admin";
  }

  const staff = roles.filter((r) => STAFF_ROLES.includes(r));

  if (staff.length === 1) {
    switch (staff[0]) {
      case "kitchen":
      case "production":
        return "/admin/kitchen";
      case "delivery":
      case "logistics":
        return "/admin/delivery";
      case "support":
        return "/admin/support";
      case "accounting":
        return "/admin/accounting";
      case "inventory":
      case "purchasing":
        return "/admin/inventory";
      default:
        break;
    }
  }

  // Multi-role staff without company_admin: prefer kitchen / delivery if exclusive family
  if (
    staff.includes("kitchen") &&
    !staff.includes("delivery") &&
    !staff.includes("logistics") &&
    !staff.includes("operations_manager")
  ) {
    return "/admin/kitchen";
  }
  if (
    (staff.includes("delivery") || staff.includes("logistics")) &&
    !staff.includes("kitchen") &&
    !staff.includes("operations_manager")
  ) {
    return "/admin/delivery";
  }
  if (
    staff.includes("support") &&
    !staff.includes("kitchen") &&
    !staff.includes("delivery") &&
    !staff.includes("logistics") &&
    !staff.includes("accounting")
  ) {
    return "/admin/support";
  }
  if (
    staff.includes("accounting") &&
    !staff.includes("kitchen") &&
    !staff.includes("delivery") &&
    !staff.includes("logistics") &&
    !staff.includes("support")
  ) {
    return "/admin/accounting";
  }

  if (roles.some((r) => STAFF_ROLES.includes(r))) return "/admin";
  if (roles.includes("driver")) return "/driver";
  return "/app";
}
