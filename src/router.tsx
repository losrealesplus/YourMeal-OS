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

// ANDROID-RUNTIME-001 / ANDROID-ASSETS-001 — client boot sensors (observe-only).
// Secret Gateway — hidden keystroke command palette (no UI).
// Runtime Core — register Suite builtins (Assets / DOM / Consistency) metadata only.
// Runtime Host — register legacy Suite panels into Registry for dynamic sidebar.
if (typeof window !== "undefined") {
  logYmosRuntimeMainStart();
  installYmosRuntimeErrorTraps();
  installYmosAssetResolutionAudit();
  installRuntimeSecretGateway();
  registerBuiltinRuntimeModules();
  registerLegacyHostModules();
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
