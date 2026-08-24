/**
 * YOURMEAL OS — EATCLEAN FEATURE CONFIGURATION
 *
 * Declares which product modules are enabled for the EatClean tenant instance.
 *
 * ARCHITECTURAL RULE:
 * Feature availability (Tenant level) != RBAC Capability (User level).
 * - Feature: Determines if the module/routes are active for this tenant instance.
 * - Capability: Determines if an authenticated user/role can execute a specific action.
 */

export interface InstanceFeatureSet {
  customers: boolean;
  companies: boolean;
  dishes: boolean;
  menus: boolean;
  orders: boolean;
  kitchen: boolean;
  delivery: boolean;
  support: boolean;
  exceptions: boolean;
  billing: boolean;
  payments: boolean;
  analyticsAdvanced: boolean;
}

export const eatCleanFeatures: InstanceFeatureSet = {
  customers: true,
  companies: true,
  dishes: true,
  menus: true,
  orders: true,
  kitchen: true,
  delivery: true,
  support: true,
  exceptions: true,
  billing: false, // Set to false until the billing domain is formally implemented
  payments: false, // Automated payment gateway disabled
  analyticsAdvanced: false,
};

export function isEatCleanFeatureEnabled(featureName: keyof InstanceFeatureSet): boolean {
  return Boolean(eatCleanFeatures[featureName]);
}
