import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Services — confirm core infrastructure handles can be obtained.
 * Ownership of QueryClient / providers stays in __root / router.
 * We only verify the auth client module can resolve (lazy Supabase).
 */
export const ServicesStage: BootstrapStageHandler = {
  id: "services",
  blocking: true,
  async run() {
    try {
      // Dynamic import keeps Orchestrator free of direct Supabase types;
      // this stage is allowed to touch the auth client facade.
      const { getAuthClient } = await import("@/auth/client");
      const client = getAuthClient();
      if (!client?.auth) {
        return {
          status: "failed",
          error: {
            code: "SERVICE_INIT_FAILED",
            stage: "services",
            message: "Auth client unavailable",
            recoverable: true,
          },
        };
      }
      return {
        status: "ok",
        notes: [
          "services:auth_client_ready",
          "services:query_client_owned_by_router",
          "services:i18n_owned_by_root",
        ],
        evidence: { authClient: true },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "failed",
        error: {
          code: "SERVICE_INIT_FAILED",
          stage: "services",
          message,
          recoverable: true,
          evidence: { thrown: true },
        },
      };
    }
  },
};
