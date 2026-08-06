import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Session — identity ladder enrichment remains in IdentityProvider.
 * This stage records that a canonical session object exists for the run.
 */
export const SessionStage: BootstrapStageHandler = {
  id: "session",
  blocking: true,
  async run(ctx) {
    if (!ctx.hasSession || !ctx.userId) {
      return {
        status: "failed",
        error: {
          code: "SESSION_INVALID",
          stage: "session",
          message: "Session stage requires authenticated context",
          recoverable: true,
        },
      };
    }

    return {
      status: "ok",
      notes: [
        "session:object_present",
        "session:profile_membership_roles_delegated_to_identity_provider",
      ],
      evidence: { userIdPresent: true },
    };
  },
};
