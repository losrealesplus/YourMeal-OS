/**
 * BrandingBootstrapService — resolve brand provenance for bootstrap timeline.
 * Remote fetch is best-effort; failure → static fallback (NON-BLOCKING).
 */

import { brandConfig } from "@/tenant/brand-config";

export type BrandingBootstrapResult = {
  provenance: "static" | "remote" | "fallback";
  slug: string;
  remoteOk: boolean;
};

export async function resolveBootstrapBranding(
  tenantId: string | null,
): Promise<BrandingBootstrapResult> {
  if (!tenantId) {
    return {
      provenance: "fallback",
      slug: brandConfig.slug,
      remoteOk: false,
    };
  }

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { createTenantBrandRepository } = await import(
      "@/modules/branding/infrastructure/tenant-brand-repository"
    );
    const repo = createTenantBrandRepository(supabase);
    const brand = await repo.fetch(tenantId);
    const hasRemote = Boolean(brand.logoPath) || Object.keys(brand.colors).length > 0;
    return {
      provenance: hasRemote ? "remote" : "static",
      slug: brandConfig.slug,
      remoteOk: hasRemote,
    };
  } catch {
    return {
      provenance: "fallback",
      slug: brandConfig.slug,
      remoteOk: false,
    };
  }
}
