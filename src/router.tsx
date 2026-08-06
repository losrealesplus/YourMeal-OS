import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  installYmosRuntimeErrorTraps,
  logYmosRuntimeMainStart,
} from "./runtime/ymos-runtime-audit";
import { installYmosAssetResolutionAudit } from "./runtime/ymos-runtime-assets";
import { installRuntimeSecretGateway } from "./runtime/runtime-secret-gateway";
import {
  registerBuiltinRuntimeModules,
} from "./runtime/runtime-core";
import { registerLegacyHostModules } from "./runtime/runtime-host";
import { registerDoctorModule } from "./runtime/runtime-doctor";
import { registerIncidentsModule } from "./runtime/incident-engine";
import { registerKnowledgeModule } from "./runtime/knowledge-engine";
import { registerRecommendationsModule } from "./runtime/recommendation-engine";
import { registerCapabilitiesModule } from "./runtime/capability-engine";
import { registerRecoveryModule } from "./runtime/recovery-engine";
import { startBootstrapPipeline } from "./bootstrap/pipeline";

// ANDROID-RUNTIME-001 / ANDROID-ASSETS-001 — client boot sensors (observe-only).
// Secret Gateway — hidden keystroke command palette (no UI).
// Runtime Core — register Suite builtins (Assets / DOM / Consistency) metadata only.
// Runtime Host — register legacy Suite panels into Registry for dynamic sidebar.
// Doctor Engine — register Doctor module + foundation checks (DEVELOPER-PLATFORM-004).
// Incident Engine — structured incidents from Doctor evidence (DEVELOPER-PLATFORM-005).
// Knowledge Engine — diagnostic knowledge model (DEVELOPER-PLATFORM-007).
// Recommendation Engine — decisions from Knowledge (DEVELOPER-PLATFORM-008).
// Capability Engine — RuntimeCapability contract (DEVELOPER-PLATFORM-009).
// Recovery Engine — orchestrate Capability.recover → verify (DEVELOPER-PLATFORM-010).
// App Bootstrap Pipeline — PRODUCT-CORE-002 orchestrator (order only; does not gate UI).
if (typeof window !== "undefined") {
  logYmosRuntimeMainStart();
  installYmosRuntimeErrorTraps();
  installYmosAssetResolutionAudit();
  installRuntimeSecretGateway();
  registerBuiltinRuntimeModules();
  registerLegacyHostModules();
  registerDoctorModule();
  registerIncidentsModule();
  registerKnowledgeModule();
  registerRecommendationsModule();
  registerCapabilitiesModule();
  registerRecoveryModule();
  void startBootstrapPipeline({ mode: "cold" });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
