import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  installYmosRuntimeErrorTraps,
  logYmosRuntimeMainStart,
} from "./runtime/ymos-runtime-audit";
import { installYmosAssetResolutionAudit } from "./runtime/ymos-runtime-assets";

// ANDROID-RUNTIME-001 / ANDROID-ASSETS-001 — client boot sensors (observe-only).
if (typeof window !== "undefined") {
  logYmosRuntimeMainStart();
  installYmosRuntimeErrorTraps();
  installYmosAssetResolutionAudit();
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
