import type { BootstrapStageHandler } from "./BootstrapStage";
import { resolveBootstrapHomePath } from "../services/NavigationBootstrapService";
import {
  getBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";

/**
 * NavigationStage — owns first homePath resolution for startup.
 * Route guards / login UX still navigate; this stage owns the decision value.
 * Who starts Navigation homePath? → NavigationStage (ADR 0052).
 */
export const NavigationStage: BootstrapStageHandler = {
  id: "navigation",
  blocking: true,
  async run(ctx) {
    if (!ctx.hasSession || !ctx.userId) {
      return {
        status: "failed",
        error: {
          code: "NAVIGATION_UNRESOLVED",
          stage: "navigation",
          message: "Navigation stage requires session",
          recoverable: true,
        },
      };
    }

    const snap = getBootstrapIdentitySnapshot();
    const roles = snap.userId === ctx.userId ? snap.roles : [];
    const homePath = resolveBootstrapHomePath(roles);

    publishBootstrapIdentitySnapshot({
      userId: ctx.userId,
      homePath,
      roles,
      profile: snap.profile,
      tenant: snap.tenant,
      status: "ready",
    });

    return {
      status: "ok",
      notes: [
        "navigation:owned_by_navigation_stage",
        "navigation:policy_home_path_for_roles",
      ],
      evidence: { homePath, roleCount: roles.length },
      patch: { homePath },
    };
  },
};
