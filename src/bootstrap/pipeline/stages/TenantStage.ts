import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Tenant — resolution remains membership-driven inside IdentityProvider (RI-001).
 * Stage marks order position; does not query tenant_members (no behaviour change).
 */
export const TenantStage: BootstrapStageHandler = {
  id: "tenant",
  blocking: true,
  async run(ctx) {
    if (!ctx.hasSession) {
      return {
        status: "failed",
        error: {
          code: "TENANT_MISSING",
          stage: "tenant",
          message: "Tenant stage requires session",
          recoverable: true,
        },
      };
    }

    return {
      status: "ok",
      notes: [
        "tenant:resolution_delegated_to_identity_provider",
        "tenant:ri001_one_user_one_tenant",
      ],
      evidence: { delegated: true },
    };
  },
};
