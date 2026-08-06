import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Branding — NON-BLOCKING. Application of theme/logo stays in shells /
 * TenantBrandScope. Fallback provenance recorded for timeline evidence.
 */
export const BrandingStage: BootstrapStageHandler = {
  id: "branding",
  blocking: false,
  async run() {
    return {
      status: "degraded",
      notes: [
        "branding:delegated_to_tenant_brand_scope",
        "branding:fallback_static_until_remote_applied",
      ],
      evidence: { provenance: "fallback" },
      patch: { brandProvenance: "fallback" },
    };
  },
};
