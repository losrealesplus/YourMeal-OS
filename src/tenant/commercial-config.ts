/**
 * CommercialConfig loader — Tenant Commercial Experience.
 * Bundled resources mirror tenant instance commercial configuration when deployed.
 */
import commercialJson from "./resources/commercial.json";
import brandJson from "./resources/brand.json";
import { hasRegisteredTenantOffers } from "@/modules/commercial/application/commercial-offer-registry";
import { hasTenantCommercial } from "@tenant-commercial";
import { registerTenantOffers } from "@/modules/commercial";
import type { CommercialOffer } from "@/modules/commercial";

export const bundledCommercialOffers: CommercialOffer[] = Array.isArray(commercialJson)
  ? (commercialJson as CommercialOffer[])
  : [];

/**
 * Initialize bundled commercial offers for the active tenant build.
 */
export function initializeBundledCommercialOffers(): void {
  if (!brandJson?.slug || !Array.isArray(commercialJson)) return;
  if (
    bundledCommercialOffers.length > 0 ||
    (!hasTenantCommercial && !hasRegisteredTenantOffers(brandJson.slug))
  ) {
    registerTenantOffers(brandJson.slug, bundledCommercialOffers);
  }
}

// Auto-initialize when module is loaded
initializeBundledCommercialOffers();
