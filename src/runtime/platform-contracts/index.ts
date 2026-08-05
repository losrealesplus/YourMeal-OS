/**
 * Developer Platform v1.0 — frozen public contracts.
 * DEVELOPER-PLATFORM-011 · ADR-0047
 *
 * After this freeze, changes to these types require a versioned ADR.
 */

export type { RuntimeEvidence } from "../runtime-core";
export {
  DEVELOPER_PLATFORM_VERSION,
  DEVELOPER_PLATFORM_FREEZE,
} from "../runtime-core";

export type { RuntimeCapability } from "../capability-engine";
export type { RuntimeIncident } from "../incident-engine";
export type { RuntimeKnowledge } from "../knowledge-engine";
export type { RuntimeRecommendation } from "../recommendation-engine";
export type { RuntimeRecovery } from "../recovery-engine";

/** Official public contract names (documentation / contract tests). */
export const PLATFORM_PUBLIC_CONTRACTS = [
  "RuntimeCapability",
  "RuntimeIncident",
  "RuntimeKnowledge",
  "RuntimeRecommendation",
  "RuntimeRecovery",
  "RuntimeEvidence",
] as const;

export type PlatformPublicContract =
  (typeof PLATFORM_PUBLIC_CONTRACTS)[number];
