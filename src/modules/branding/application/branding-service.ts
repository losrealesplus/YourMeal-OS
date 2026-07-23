/**
 * BrandingService — application layer for Tenant Brand Management.
 *
 * Composes the repository with domain validation and audit writes.
 * All business rules for branding live here; UI never touches Supabase directly.
 */

import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError } from "@/domain/errors";
import { createTenantBrandRepository } from "../infrastructure/tenant-brand-repository";
import {
  isValidHex,
  normalizeHex,
  validateLogoFile,
  type TenantBrand,
  type TenantBrandColors,
} from "../domain/tenant-brand";

export type BrandingSnapshot = TenantBrand & {
  /** Signed URL for the logo, or null when no logo is configured. */
  logoUrl: string | null;
};

export type UpdateBrandInput = {
  colors?: Partial<TenantBrandColors>;
  /** New logo file, or `null` to clear the current logo. `undefined` = keep. */
  logoFile?: File | null;
};

function assertCanManage(ctx: ServiceContext): void {
  const allowed =
    ctx.roles.includes("saas_admin") || ctx.roles.includes("company_admin");
  if (!allowed) {
    throw new DomainError(
      "PERMISSION_DENIED",
      "Only company_admin or saas_admin may manage tenant branding",
    );
  }
}

export const BrandingService = {
  async getSnapshot(ctx: ServiceContext): Promise<BrandingSnapshot> {
    const repo = createTenantBrandRepository(ctx.supabase);
    const brand = await repo.fetch(ctx.tenantId);
    const logoUrl = brand.logoPath ? await repo.signLogoUrl(brand.logoPath) : null;
    return { ...brand, logoUrl };
  },

  async updateBrand(
    ctx: ServiceContext,
    input: UpdateBrandInput,
  ): Promise<BrandingSnapshot> {
    assertCanManage(ctx);
    const repo = createTenantBrandRepository(ctx.supabase);
    const before = await repo.fetch(ctx.tenantId);

    // --- Colors -----------------------------------------------------------
    if (input.colors) {
      const normalized: {
        primary?: string | null;
        primaryForeground?: string | null;
        accent?: string | null;
      } = {
        primary: before.colors.primary ?? null,
        primaryForeground: before.colors.primaryForeground ?? null,
        accent: before.colors.accent ?? null,
      };

      for (const key of ["primary", "primaryForeground", "accent"] as const) {
        const value = input.colors[key];
        if (value === undefined) continue;
        if (value === null || value === "") {
          normalized[key] = null;
          continue;
        }
        if (!isValidHex(value)) {
          throw new DomainError(
            "INVALID_STATE",
            `Invalid HEX color for ${key}: ${value}`,
          );
        }
        normalized[key] = normalizeHex(value);
      }

      await repo.updateColors(ctx.tenantId, normalized);
    }

    // --- Logo -------------------------------------------------------------
    if (input.logoFile !== undefined) {
      if (input.logoFile === null) {
        // Clear current logo
        await repo.setLogoPath(ctx.tenantId, null);
        if (before.logoPath) {
          await repo.removeObject(before.logoPath);
        }
      } else {
        const validation = validateLogoFile(input.logoFile);
        if (validation) {
          throw new DomainError(
            "INVALID_STATE",
            validation.kind === "too_large"
              ? `Logo exceeds 512 KB (${validation.sizeBytes} bytes)`
              : `Unsupported logo MIME type: ${validation.type}`,
          );
        }
        const newPath = await repo.uploadLogo(ctx.tenantId, input.logoFile);
        await repo.setLogoPath(ctx.tenantId, newPath);
        if (before.logoPath && before.logoPath !== newPath) {
          await repo.removeObject(before.logoPath);
        }
      }
    }

    // --- Audit ------------------------------------------------------------
    const after = await repo.fetch(ctx.tenantId);
    await AuditService.write(ctx, {
      entityType: "tenant",
      entityId: ctx.tenantId,
      action: "update",
      oldData: {
        brand_logo_path: before.logoPath,
        brand_primary: before.colors.primary ?? null,
        brand_primary_foreground: before.colors.primaryForeground ?? null,
        brand_accent: before.colors.accent ?? null,
      },
      newData: {
        brand_logo_path: after.logoPath,
        brand_primary: after.colors.primary ?? null,
        brand_primary_foreground: after.colors.primaryForeground ?? null,
        brand_accent: after.colors.accent ?? null,
      },
    });

    const logoUrl = after.logoPath ? await repo.signLogoUrl(after.logoPath) : null;
    return { ...after, logoUrl };
  },
};
