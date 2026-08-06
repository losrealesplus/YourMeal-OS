import type { BootstrapStageHandler } from "./BootstrapStage";

/**
 * App Launch — process/shell is up. No business logic.
 */
export const LaunchStage: BootstrapStageHandler = {
  id: "app_launch",
  blocking: true,
  async run(ctx) {
    const isBrowser = typeof window !== "undefined";
    ctx.evidence.host = isBrowser ? "browser" : "non-browser";
    return {
      status: "ok",
      notes: ["launch:shell_mount"],
      evidence: { host: ctx.evidence.host, bootEpochMs: ctx.bootEpochMs },
    };
  },
};
