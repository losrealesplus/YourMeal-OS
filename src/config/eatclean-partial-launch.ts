/**
 * EatClean Partial Launch Configuration (EATCLEAN_PARTIAL_LAUNCH).
 *
 * Implements granular module and operational barriers for Release A.
 * Modules dependent on unapplied migrations (M1, M2, M3, M4) or schema `auth`
 * USAGE permissions are strictly frozen for EatClean with user-facing
 * "Funcionalidad disponible próximamente" messaging.
 *
 * STRICT INVARIANT:
 * - Isolation: These restrictions ONLY apply to the EatClean tenant instance.
 * - Non-EatClean instances (such as demo, platform, or other customer tenants)
 *   retain their full standard operational behaviour.
 * - Zero Regressions: Capabilities proven to function in production without
 *   the pending Supabase permissions (dish catalog, weekly menus, existing orders,
 *   customer directory, non-custom kitchen batches) remain fully OPERATIONAL.
 */

import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";

export const EATCLEAN_TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
export const EATCLEAN_TENANT_SLUG = "eatclean";

export const EATCLEAN_PARTIAL_LAUNCH_CONFIG = {
  isPartialLaunch: true,
  frozenMessage: "Funcionalidad disponible próximamente",
  features: {
    /** Order creation & intake via app/draft (blocked by unapplied M4 / cr_order_writer auth schema USAGE) */
    orderCreation: false,
    /** P34 CRM identity conflict mutations (blocked by unapplied M1 / M2) */
    crmIdentityMutations: false,

    /** Operational capabilities verified functional without unapplied migrations */
    dishMutations: true,
    menuMutations: true,
    customerDirectoryMutations: true,
    orderWorkflowMutations: true,
    kitchenStateMutations: true,
    staffOrderCapture: false,
    catalogConsultation: true,
    weeklyMenuConsultation: true,
    existingOrdersConsultation: true,
    adminDashboardRead: true,
  },
} as const;

export type TenantContextParam =
  | {
      tenantId?: string | null;
      tenantSlug?: string | null;
      hostname?: string | null;
    }
  | string
  | null
  | undefined;

/**
 * Resolves whether the current operational scope belongs to EatClean.
 * Can inspect an explicit tenantId/tenantSlug or fallback to client hostname.
 */
export function isEatCleanContext(param?: TenantContextParam): boolean {
  if (typeof param === "string") {
    const trimmed = param.trim().toLowerCase();
    return trimmed === EATCLEAN_TENANT_ID || trimmed === EATCLEAN_TENANT_SLUG;
  }

  if (param && typeof param === "object") {
    if (param.tenantId === EATCLEAN_TENANT_ID) return true;
    if (param.tenantSlug === EATCLEAN_TENANT_SLUG) return true;
    if (param.hostname) {
      try {
        const config = resolveInstanceRuntimeConfig(param.hostname);
        return config.tenantSlug === EATCLEAN_TENANT_SLUG;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Fallback to client browser hostname if available
  if (typeof window !== "undefined" && window.location) {
    try {
      const host = window.location.hostname;
      const config = resolveInstanceRuntimeConfig(host);
      return config.tenantSlug === EATCLEAN_TENANT_SLUG;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Checks whether order creation is frozen for the given tenant context.
 */
export function isEatCleanOrderCreationFrozen(context?: TenantContextParam): boolean {
  if (!isEatCleanContext(context)) return false;
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderCreation;
}

/**
 * Checks whether CRM P34 identity review/conflict mutations are frozen.
 */
export function isEatCleanCrmMutationFrozen(context?: TenantContextParam): boolean {
  if (!isEatCleanContext(context)) return false;
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.crmIdentityMutations;
}

/**
 * Staff order capture - retained functional unless explicitly frozen.
 */
export function isEatCleanStaffOrderCaptureFrozen(context?: TenantContextParam): boolean {
  if (!isEatCleanContext(context)) return false;
  if (
    import.meta.env?.VITE_YOURMEAL_RUNTIME_ENV === "staging_local" ||
    (typeof process !== "undefined" && process.env?.YOURMEAL_RUNTIME_ENV === "staging_local")
  ) {
    return false;
  }
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.staffOrderCapture;
}

/**
 * Dish catalog mutations - retained functional.
 */
export function isEatCleanDishMutationFrozen(context?: TenantContextParam): boolean {
  if (!isEatCleanContext(context)) return false;
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.dishMutations;
}

/**
 * Weekly menu mutations - retained functional.
 */
export function isEatCleanMenuMutationFrozen(context?: TenantContextParam): boolean {
  if (!isEatCleanContext(context)) return false;
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.menuMutations;
}
