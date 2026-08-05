/**
 * Recommendation Engine — Developer Platform v1.5
 *
 * Spec: docs/05-architecture/RECOMMENDATION_ENGINE.md
 * ADR: docs/adr/0044-recommendation-engine.md
 *
 * Consumes Knowledge. Never creates knowledge. Never imports Doctor/Host/UI.
 */

export type {
  RuntimeRecommendation,
  RuntimeRecommendationAction,
  RecommendationPriority,
  RecommendationActionType,
} from "./recommendation.types";
export { RECOMMENDATION_ENGINE_VERSION } from "./recommendation.types";

export {
  buildRecommendations,
  getRecommendations,
  clearRecommendations,
  exportRecommendations,
  getRecommendationEngineInfo,
  type BuildRecommendationsOptions,
} from "./RecommendationEngine";

export {
  registerRecommendationsModule,
  resetRecommendationsModuleFlags,
} from "./register-recommendations-module";

export { RecommendationsPanel } from "./RecommendationsPanel";

export {
  priorityFromSeverity,
  priorityRank,
  RECOMMENDATION_PRIORITY_ORDER,
} from "./RecommendationPriority";

export {
  clearRecommendationStore,
  getRecommendation,
} from "./RecommendationRegistry";
