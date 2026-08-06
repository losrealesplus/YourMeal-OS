import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * Authentication — peek identity presence via existing session facade.
 * Does not render auth UI, change FCR-008, or alter IdentityProvider.
 */
export const AuthenticationStage: BootstrapStageHandler = {
  id: "authentication",
  blocking: true,
  async run(_ctx) {
    try {
      const { getSession } = await import("@/auth/session");
      const { isBootstrapMode } = await import("@/bootstrap/flag");
      const { data, error } = await getSession();

      if (error) {
        return {
          status: "failed",
          error: {
            code: "AUTH_UNAVAILABLE",
            stage: "authentication",
            message: error.message ?? "getSession failed",
            recoverable: true,
          },
        };
      }

      const session = data?.session ?? null;
      const userId = session?.user?.id ?? null;
      const modeNote = isBootstrapMode()
        ? "authentication:bootstrap_mode"
        : "authentication:supabase";

      if (!session?.user) {
        return {
          status: "auth_required",
          notes: [modeNote, "authentication:anonymous"],
          evidence: { hasSession: false },
          patch: { hasSession: false, userId: null },
        };
      }

      return {
        status: "ok",
        notes: [modeNote, "authentication:session_present"],
        evidence: { hasSession: true },
        patch: { hasSession: true, userId },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "failed",
        error: {
          code: "AUTH_UNAVAILABLE",
          stage: "authentication",
          message,
          recoverable: true,
        },
      };
    }
  },
};
