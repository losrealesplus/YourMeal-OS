/**
 * ANDROID-ASSET-005 — fallback logo is a real Vite-bundled PNG
 * (src/tenant/resources/logo.png). Do not use Lovable virtual asset URLs.
 *
 * DEVELOPER-PORTAL-001 — triple-tap opens Developer Portal (discovery only).
 * Does not open Runtime Suite directly.
 *
 * B3.6.11A — Instance-aware logo resolution for public/auth surfaces.
 */
import { useRef } from "react";
import fallbackLogoUrl from "@/tenant/resources/logo.png";
import { brandConfig } from "@/tenant/brand-config";
import { cn } from "@/lib/utils";
import { useTenantBrand } from "@/hooks/use-tenant-brand";
import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";
import {
  createTripleTapDetector,
  requestDeveloperPortal,
} from "@/runtime/developer-portal";

const FALLBACK_LOGO = fallbackLogoUrl;

export function resolveInstanceLogoUrl(hostname?: string): string {
  try {
    const config = resolveInstanceRuntimeConfig(
      hostname ?? (typeof window !== "undefined" ? window.location.hostname : undefined),
    );
    if (config.tenantSlug === "eatclean") {
      return "/assets/eatclean-logo.png";
    }
  } catch {
    // Fall back to default platform logo
  }
  return "/assets/yourmeal-os-logo.png";
}

/**
 * Tenant logo — reads live from BrandingService via useTenantBrand.
 *
 * Falls back to the instance-aware default when the tenant has not uploaded a logo
 * yet, or before the query resolves. Ratio is always preserved.
 *
 * Triple-tap (≈500ms window) requests the Developer Portal — no visible
 * Developer/Debug chrome for normal users.
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
  const instanceDefaultLogo = resolveInstanceLogoUrl();
  const src = logoUrl ?? instanceDefaultLogo ?? FALLBACK_LOGO;
  const detectorRef = useRef(createTripleTapDetector());

  return (
    <img
      src={src}
      alt={`${brandConfig.name} — ${brandConfig.storeAssets.shortDescription}`}
      height={height}
      className={cn("w-auto object-contain select-none", className)}
      style={{ height, width: "auto" }}
      decoding="async"
      onPointerUp={() => {
        if (detectorRef.current.tap()) {
          requestDeveloperPortal();
        }
      }}
    />
  );
}
