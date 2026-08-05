/**
 * Register Recommendations Host module.
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import {
  buildRecommendations,
  exportRecommendations,
  getRecommendationEngineInfo,
} from "./RecommendationEngine";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { RECOMMENDATION_ENGINE_VERSION } from "./recommendation.types";
import { registerFoundationKnowledge } from "../knowledge-engine";

const recommendationsModule: RuntimeModule = {
  id: "recommendations",
  title: "Recommendations",
  description: "Prioritized decisions from Knowledge · not AI",
  icon: "list-checks",
  category: "Recommendations",
  version: RECOMMENDATION_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: () => {
    const info = getRecommendationEngineInfo();
    return {
      ok: true,
      detail: `${info.count} recommendations · v${info.version}`,
    };
  },
  export: () =>
    createEvidence({
      source: "recommendations",
      category: "diagnostics",
      severity: "info",
      payload: { recommendations: exportRecommendations() },
    }),
};

let moduleInstalled = false;
let rendererInstalled = false;

export function registerRecommendationsModule(): void {
  registerFoundationKnowledge();
  // Warm store from current open incidents (may be empty until Doctor runs).
  buildRecommendations({ ensureFoundation: true });

  if (!moduleInstalled) {
    if (!findModule("recommendations")) {
      registerModule(recommendationsModule);
    }
    moduleInstalled = true;
  }
  if (!rendererInstalled) {
    registerModuleRenderer("recommendations", () =>
      createElement(RecommendationsPanel),
    );
    rendererInstalled = true;
  }
}

export function resetRecommendationsModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
}
