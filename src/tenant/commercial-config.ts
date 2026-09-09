/**
 * CommercialConfig loader — Tenant Commercial Experience.
 * Bundled resources mirror tenant instance commercial configuration when deployed.
 */
import commercialJson from "./resources/commercial.json";
import { brandConfig } from "./brand-config";
import { registerTenantOffers } from "@/modules/commercial";
import type { CommercialOffer } from "@/modules/commercial";

export const bundledCommercialOffers: CommercialOffer[] =
  Array.isArray(commercialJson) ? (commercialJson as CommercialOffer[]) : [];

/**
 * Initialize bundled commercial offers for the active tenant build and runtime worker.
 */
export function initializeBundledCommercialOffers(): void {
  if (bundledCommercialOffers.length > 0) {
    if (brandConfig?.slug) {
      registerTenantOffers(brandConfig.slug, bundledCommercialOffers);
    }
    // Also ensure 'eatclean' instance mapping is available if bundled
    registerTenantOffers("eatclean", bundledCommercialOffers);
  }
}

// Auto-initialize when module is loaded
initializeBundledCommercialOffers();

