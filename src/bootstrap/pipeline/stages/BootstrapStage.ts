/**
 * BootstrapStage contract — each stage owns delegation to existing services.
 * The Orchestrator must not import Supabase / Router / Branding / Doctor.
 */

import type { BootstrapContext } from "../BootstrapContext";
import type { BootstrapStageId, BootstrapStageOutcome } from "../types";

export type BootstrapStageHandler = {
  readonly id: BootstrapStageId;
  /** When true, failure or auth_required stops the pipeline. */
  readonly blocking: boolean;
  run(ctx: BootstrapContext): Promise<BootstrapStageOutcome>;
};
