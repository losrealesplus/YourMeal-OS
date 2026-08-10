/**
 * Phase 2.3 — Deployment identity claim (lookup hint only).
 * Authority is the SaaS Deployment Registry on the server — never BrandConfig.
 *
 * Native builds use the Capacitor appId flavor constant.
 * Web production uses hostname. Localhost / Capacitor WebView falls back to appId
 * so EatClean OPPO builds resolve without a web domain seed.
 */

/** Build-flavor package id — must match capacitor.config.ts / store applicationId. */
export const DEPLOYMENT_APP_ID = "com.yourmealos.eatclean" as const;

export type DeploymentPlatform = "android" | "ios" | "web";

export type DeploymentClaim = {
  platform: DeploymentPlatform;
  identifier: string;
};

export async function resolveDeploymentClaim(): Promise<DeploymentClaim> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const platform: DeploymentPlatform =
        Capacitor.getPlatform() === "ios" ? "ios" : "android";
      return { platform, identifier: DEPLOYMENT_APP_ID };
    }
  } catch {
    // Non-Capacitor / SSR — fall through to web heuristics.
  }

  const host =
    typeof window !== "undefined" ? window.location.hostname.trim() : "";
  if (
    host &&
    host !== "localhost" &&
    host !== "127.0.0.1" &&
    !host.endsWith(".local")
  ) {
    return { platform: "web", identifier: host };
  }

  // Dev / Capacitor localhost WebView: use Android package seed for EatClean MVP.
  return { platform: "android", identifier: DEPLOYMENT_APP_ID };
}
