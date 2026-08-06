import type { BootstrapStageHandler } from "./BootstrapStage";
import { resolveBootstrapBranding } from "../services/BrandingBootstrapService";
import { getBootstrapIdentitySnapshot } from "../BootstrapIdentityStore";

/**
 * BrandingStage — owns when brand provenance is resolved (NON-BLOCKING).
 * CSS application remains in TenantBrandScope (Provider/paint).
 * Who starts Branding resolve? → BrandingStage (ADR 0052).
 */
export const BrandingStage: BootstrapStageHandler = {
  id: "branding",
  blocking: false,
  async run(ctx) {
    const tenantId =
      ctx.tenantId ?? getBootstrapIdentitySnapshot().tenant?.id ?? null;

    const result = await resolveBootstrapBranding(tenantId);

    return {
      status: result.remoteOk ? "ok" : "degraded",
      notes: [
        "branding:owned_by_branding_stage",
        `branding:provenance_${result.provenance}`,
        "branding:paint_delegated_to_tenant_brand_scope",
      ],
      evidence: {
        provenance: result.provenance,
        slug: result.slug,
        tenantId,
      },
      patch: { brandProvenance: result.provenance },
    };
  },
};
