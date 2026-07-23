/**
 * BrandConfig loader — Tenant Experience (ADR 0014).
 * Bundled resources mirror `tenants/<slug>/` (keep in sync). No product forks.
 */
import brandJson from "./resources/brand.json";
import copyEs from "./resources/copy.es.json";

export type BrandConfig = typeof brandJson;
export type TenantCopy = typeof copyEs;

/** Active BrandConfig for Customer Application surfaces. */
export const brandConfig: BrandConfig = brandJson;

export const tenantCopyEs: TenantCopy = copyEs;

/** Apply BrandConfig CSS variables on a root element (customer shell / auth). */
export function applyBrandTheme(el: HTMLElement | null, config: BrandConfig = brandConfig) {
  if (!el) return;
  el.style.setProperty("--tenant-primary", config.primaryColor);
  el.style.setProperty("--tenant-secondary", config.secondaryColor);
  el.style.setProperty("--tenant-background", config.background);
  el.style.setProperty("--tenant-surface", config.surface);
  el.style.setProperty("--tenant-foreground", config.foreground);
  el.style.setProperty("--tenant-success", config.success);
  el.style.setProperty("--tenant-error", config.error);
  el.style.setProperty("--tenant-radius", config.borderRadius);
  el.dataset.tenantBrand = config.slug;
}

export function poweredByLabel(config: BrandConfig = brandConfig) {
  return config.poweredBy.visible ? config.poweredBy.label : "";
}
