/**
 * Recommendation Engine contracts — decision layer over Knowledge.
 * DEVELOPER-PLATFORM-008 · Developer Platform v1.5
 *
 * Never: Incident → Recommendation.
 * Always: Incident → Knowledge → Recommendation.
 */

export type RecommendationPriority = "low" | "medium" | "high" | "critical";

export type RecommendationActionType = "manual" | "documentation" | "recovery";

export type RuntimeRecommendationAction = {
  id: string;
  label: string;
  type: RecommendationActionType;
  /** Recovery Engine resolves Capability.recover() via capabilityIds. */
  supported: boolean;
};

export type RuntimeRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  /** 0–1 */
  confidence: number;
  incidentIds: string[];
  knowledgeIds: string[];
  /** Capability ids from Knowledge — Recovery resolves recover() here. */
  capabilityIds: string[];
  evidenceIds: string[];
  actions: RuntimeRecommendationAction[];
};

export const RECOMMENDATION_ENGINE_VERSION = "1.5.0";
