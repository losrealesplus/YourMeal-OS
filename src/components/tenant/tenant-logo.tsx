import logoAsset from "@/assets/eatclean-logo.png.asset.json";
const logoUrl = logoAsset.url;
import { brandConfig } from "@/tenant/brand-config";
import { cn } from "@/lib/utils";

/**
 * Official Tenant logo from BrandConfig assets (bundled mirror of tenants/<slug>/logo.svg).
 * Do not crop, recolor, or invent marks — preserve official proportions.
 */
export function TenantLogo({
  className,
  height = 48,
}: {
  className?: string;
  /** CSS height in px — width follows intrinsic ratio. */
  height?: number;
}) {
  return (
    <img
      src={logoUrl}
      alt={brandConfig.name}
      height={height}
      className={cn("w-auto object-contain select-none", className)}
      style={{ height, width: "auto" }}
      decoding="async"
    />
  );
}
