import { useEffect } from "react";
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
 *
 * ANDROID-ASSET-002 — observe-only [YMOS-ASSET] logs (no behavior change).
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

  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "(ssr)";
    const absolute =
      typeof window !== "undefined"
        ? new URL(src, window.location.href).href
        : src;
    console.log("[YMOS-ASSET] original import", FALLBACK_LOGO);
    console.log("[YMOS-ASSET] brandConfig.assets.logo", brandConfig.assets.logo);
    console.log("[YMOS-ASSET] logoUrl from useTenantBrand", logoUrl);
    console.log("[YMOS-ASSET] image src", src);
    console.log("[YMOS-ASSET] resolved absolute", absolute);
    console.log("[YMOS-ASSET] origin", origin);
    console.log(
      "[YMOS-ASSET] isLovableVirtualPath",
      typeof FALLBACK_LOGO === "string" && FALLBACK_LOGO.includes("/__l5e/"),
    );
  }, [logoUrl, src]);

  return (
    <img
      src={src}
      alt={`${brandConfig.name} — ${brandConfig.storeAssets.shortDescription}`}
      height={height}
      className={cn("w-auto object-contain select-none", className)}
      style={{ height, width: "auto" }}
      decoding="async"
    />
  );
}
