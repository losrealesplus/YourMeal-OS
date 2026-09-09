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
 * Initialize bundled commercial offers for the active tenant build.
 */
export function initializeBundledCommercialOffers(): void {
  if (brandConfig?.slug && bundledCommercialOffers.length > 0) {
    registerTenantOffers(brandConfig.slug, bundledCommercialOffers);
  }
}

// Auto-initialize when module is loaded
initializeBundledCommercialOffers();


