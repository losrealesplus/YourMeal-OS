/**
 * useTenantBrand — read-only React hook exposing the active tenant's brand.
 *
 * All surfaces that need the logo or brand colors read from here. The single
 * query means one signed-URL request per session, cached by React Query, and
 * one invalidation point after a settings update.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createTenantBrandRepository } from "@/modules/branding/infrastructure/tenant-brand-repository";
import type { TenantBrandColors } from "@/modules/branding/domain/tenant-brand";

export type TenantBrandView = {
  logoUrl: string | null;
  colors: Partial<TenantBrandColors>;
  updatedAt: string | null;
  isLoading: boolean;
};

export function tenantBrandQueryKey(tenantId: string | null) {
  return ["tenant-brand", tenantId] as const;
}

export function useTenantBrand(): TenantBrandView {
  const { tenantId } = useAuth();

  const query = useQuery({
    queryKey: tenantBrandQueryKey(tenantId),
    enabled: !!tenantId,
    staleTime: 60 * 60 * 1000, // 1 h — well under 24 h signed-URL TTL
    gcTime: 2 * 60 * 60 * 1000,
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant");
      const repo = createTenantBrandRepository(supabase);
      const brand = await repo.fetch(tenantId);
      const logoUrl = brand.logoPath
        ? await repo.signLogoUrl(brand.logoPath)
        : null;
      return { logoUrl, colors: brand.colors, updatedAt: brand.updatedAt };
    },
  });

  return {
    logoUrl: query.data?.logoUrl ?? null,
    colors: query.data?.colors ?? {},
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
  };
}
