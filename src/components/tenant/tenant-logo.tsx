import logoAsset from "@/assets/eatclean-logo.png.asset.json";
import { brandConfig } from "@/tenant/brand-config";
import { cn } from "@/lib/utils";
import { useTenantBrand } from "@/hooks/use-tenant-brand";

const FALLBACK_LOGO = logoAsset.url;

/**
 * Tenant logo — reads live from BrandingService via useTenantBrand.
 *
 * Falls back to the bundled default when the tenant has not uploaded a logo
 * yet, or before the query resolves. Ratio is always preserved.
 */
export function TenantLogo({
  className,
  height = 48,
}: {
  className?: string;
  /** CSS height in px — width follows intrinsic ratio. */
  height?: number;
}) {
  const { logoUrl } = useTenantBrand();
  const src = logoUrl ?? FALLBACK_LOGO;
  return (
    <img
      src={src}
      alt={brandConfig.name}
      height={height}
      className={cn("w-auto object-contain select-none", className)}
      style={{ height, width: "auto" }}
      decoding="async"
    />
  );
}
