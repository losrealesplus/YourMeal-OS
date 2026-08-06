import type { BootstrapStageHandler } from "./BootstrapStage";
import { loadSessionIdentity } from "../services/SessionBootstrapService";
import {
  publishBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";

/**
 * SessionStage — owns startup of the identity ladder (roles / profile / membership).
 * Who starts Session enrichment? → SessionStage (ADR 0052).
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

    const userId = ctx.userId;
    publishBootstrapIdentitySnapshot({
      userId,
      status: "loading",
      roles: [],
      profile: null,
      tenant: null,
      homePath: null,
    });

    try {
      const data = await loadSessionIdentity(userId);
      publishBootstrapIdentitySnapshot({
        userId: data.userId,
        roles: data.roles,
        profile: data.profile,
        tenant: data.tenant,
        status: "loading",
      });

      return {
        status: "ok",
        notes: [
          "session:owned_by_session_stage",
          "session:ladder_via_session_bootstrap_service",
        ],
        evidence: {
          roleCount: data.roles.length,
          hasProfile: Boolean(data.profile),
          hasTenant: Boolean(data.tenant),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "failed",
        error: {
          code: "SESSION_INVALID",
          stage: "session",
          message,
          recoverable: true,
        },
      };
    }
  },
};
