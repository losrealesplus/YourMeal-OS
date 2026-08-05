import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  installYmosRuntimeErrorTraps,
  logYmosRuntimeMainStart,
} from "./runtime/ymos-runtime-audit";
import { installYmosAssetResolutionAudit } from "./runtime/ymos-runtime-assets";
import { installRuntimeSecretGateway } from "./runtime/runtime-secret-gateway";
import { registerBuiltinRuntimeModules } from "./runtime/runtime-core";

// ANDROID-RUNTIME-001 / ANDROID-ASSETS-001 — client boot sensors (observe-only).
// Secret Gateway — hidden keystroke command palette (no UI).
// Runtime Core — register Suite builtins (Assets / DOM / Consistency) metadata only.
if (typeof window !== "undefined") {
  logYmosRuntimeMainStart();
  installYmosRuntimeErrorTraps();
  installYmosAssetResolutionAudit();
  installRuntimeSecretGateway();
  registerBuiltinRuntimeModules();
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
