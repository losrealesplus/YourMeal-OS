/**
 * Pilot surface flags (EP-001 Functional Completeness).
 *
 * Incomplete admin modules stay hidden unless the matching feature_flags row
 * is enabled for the tenant (or globally). Missing key → disabled (cero humo).
 *
 * @see docs/adr/0007-feature-flags.md
 */

export const PILOT_ADMIN_MODULE_FLAGS = {
  inventory: "admin_module_inventory",
  menus: "admin_module_menus",
  dishes: "admin_module_dishes",
  purchasing: "admin_module_purchasing",
  accounting: "admin_module_accounting",
  reports: "admin_module_reports",
  promotions: "admin_module_promotions",
  production: "admin_module_production",
  routes: "admin_module_routes",
  designSystem: "admin_module_design_system",
} as const;

export type PilotAdminModuleFlag =
  (typeof PILOT_ADMIN_MODULE_FLAGS)[keyof typeof PILOT_ADMIN_MODULE_FLAGS];
