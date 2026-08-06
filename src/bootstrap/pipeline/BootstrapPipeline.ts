/**
 * THE single place in the repository that defines startup stage order.
 * Future startup changes must edit this list (and ADR if order changes).
 *
 * ADR 0050:
 * App Launch → Environment → Services → Authentication
 * → Session → Tenant → Branding → Navigation → Ready
 *
 * Ready is a latch produced by the Orchestrator after the last stage, not a stage handler.
 */

import type { BootstrapStageHandler } from "./stages/BootstrapStage";
import { LaunchStage } from "./stages/LaunchStage";
import { EnvironmentStage } from "./stages/EnvironmentStage";
import { ServicesStage } from "./stages/ServicesStage";
import { AuthenticationStage } from "./stages/AuthenticationStage";
import { SessionStage } from "./stages/SessionStage";
import { TenantStage } from "./stages/TenantStage";
import { BrandingStage } from "./stages/BrandingStage";
import { NavigationStage } from "./stages/NavigationStage";

/** Canonical ordered stages — do not reorder without superseding ADR 0050. */
export const BOOTSTRAP_PIPELINE_STAGES: readonly BootstrapStageHandler[] = [
  LaunchStage,
  EnvironmentStage,
  ServicesStage,
  AuthenticationStage,
  SessionStage,
  TenantStage,
  BrandingStage,
  NavigationStage,
] as const;

export function getBootstrapPipelineStages(): readonly BootstrapStageHandler[] {
  return BOOTSTRAP_PIPELINE_STAGES;
}
