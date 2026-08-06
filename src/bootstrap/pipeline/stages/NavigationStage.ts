import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Navigation — homePath resolution remains in resolveHomePath / route guards.
 * Stage marks sequence position only (no router imports).
 */
export const NavigationStage: BootstrapStageHandler = {
  id: "navigation",
  blocking: true,
  async run(ctx) {
    if (!ctx.hasSession) {
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

    return {
      status: "ok",
      notes: [
        "navigation:home_path_delegated_to_resolveHomePath",
        "navigation:guards_unchanged",
      ],
      evidence: { delegated: true },
    };
  },
};
