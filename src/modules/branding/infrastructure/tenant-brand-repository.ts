/**
 * TenantBrandRepository — Supabase-backed persistence for tenant branding.
 *
 * Keeps SQL and Storage calls out of the Service layer. The Service composes
 * these primitives with domain validation and audit writes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { TenantBrand } from "../domain/tenant-brand";
import { extensionForMime } from "../domain/tenant-brand";

const BUCKET = "tenant-branding";
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;

type TenantRow = {
  brand_logo_path: string | null;
  brand_primary: string | null;
  brand_primary_foreground: string | null;
  brand_accent: string | null;
  brand_updated_at: string | null;
};

export function createTenantBrandRepository(
  supabase: SupabaseClient<Database>,
) {
  return {
    async fetch(tenantId: string): Promise<TenantBrand> {
      const { data, error } = await supabase
        .from("tenants")
        .select(
          "brand_logo_path, brand_primary, brand_primary_foreground, brand_accent, brand_updated_at",
        )
        .eq("id", tenantId)
        .maybeSingle();

      if (error) {
        throw new Error(`fetchBrand failed: ${error.message}`);
      }

      const row = (data ?? null) as TenantRow | null;
      return {
        logoPath: row?.brand_logo_path ?? null,
        updatedAt: row?.brand_updated_at ?? null,
        colors: {
          ...(row?.brand_primary ? { primary: row.brand_primary } : {}),
          ...(row?.brand_primary_foreground
            ? { primaryForeground: row.brand_primary_foreground }
            : {}),
          ...(row?.brand_accent ? { accent: row.brand_accent } : {}),
        },
      };
    },

    async updateColors(
      tenantId: string,
      colors: {
        primary?: string | null;
        primaryForeground?: string | null;
        accent?: string | null;
      },
    ): Promise<void> {
      const { error } = await supabase
        .from("tenants")
        .update({
          brand_primary: colors.primary ?? null,
          brand_primary_foreground: colors.primaryForeground ?? null,
          brand_accent: colors.accent ?? null,
          brand_updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);
      if (error) throw new Error(`updateColors failed: ${error.message}`);
    },

    async setLogoPath(tenantId: string, path: string | null): Promise<void> {
      const { error } = await supabase
        .from("tenants")
        .update({
          brand_logo_path: path,
          brand_updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId);
      if (error) throw new Error(`setLogoPath failed: ${error.message}`);
    },

    async uploadLogo(tenantId: string, file: File): Promise<string> {
      // Path convention: `{tenantId}/logo-{timestamp}.{ext}`.
      // A timestamped filename is used so the CDN never serves a stale copy
      // after replacement and to avoid cache-buster query string plumbing.
      const ext = extensionForMime(file.type);
      const path = `${tenantId}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
      if (error) throw new Error(`uploadLogo failed: ${error.message}`);
      return path;
    },

    async removeObject(path: string): Promise<void> {
      // Best-effort. Old logo cleanup shouldn't fail the whole update.
      await supabase.storage.from(BUCKET).remove([path]);
    },

    async signLogoUrl(path: string): Promise<string | null> {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
  };
}

export type TenantBrandRepository = ReturnType<
  typeof createTenantBrandRepository
>;
