/**
 * EatClean Partial Launch Configuration (EATCLEAN_PARTIAL_LAUNCH).
 *
 * Implements granular module and operational barriers for Release A.
 * Modules dependent on unapplied migrations (M1, M2, M3, M4) or schema `auth`
 * USAGE permissions are explicitly frozen with user-facing "Próximamente" messaging.
 */

export const EATCLEAN_PARTIAL_LAUNCH_CONFIG = {
  isPartialLaunch: true,
  frozenMessage: "Funcionalidad disponible próximamente",
  features: {
    /** Order creation & intake (requires M4 / price snapshot & auth USAGE) */
    orderCreation: false,
    /** Manual staff order capture (requires cr_order_writer / auth USAGE) */
    staffOrderCapture: false,
    /** P34 CRM identity conflict mutations (requires M1 / M2) */
    crmIdentityMutations: false,
    /** Kitchen production batch state mutations dependent on cr_order_writer */
    kitchenStateMutations: false,
    /** Consultations: catalog, weekly menus, existing orders, user profiles */
    catalogConsultation: true,
    weeklyMenuConsultation: true,
    existingOrdersConsultation: true,
    adminDashboardRead: true,
  },
} as const;

export function isEatCleanOrderCreationFrozen(): boolean {
  if (process.env.NODE_ENV === "test" && process.env.EATCLEAN_TEST_FORCE_FREEZE !== "true") {
    return false;
  }
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderCreation;
}

export function isEatCleanCrmMutationFrozen(): boolean {
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.crmIdentityMutations;
}

export function isEatCleanStaffOrderCaptureFrozen(): boolean {
  return !EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.staffOrderCapture;
}
