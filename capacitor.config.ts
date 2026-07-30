import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MF-001 · M-01.3 — Capacitor shell (EatClean spike appId).
 * Hybrid Shell: webDir is the SPA output from `npm run build:mobile`.
 * Do NOT set server.url for production (ADR-0032).
 */
const config: CapacitorConfig = {
  appId: "com.yourmealos.eatclean",
  appName: "YourMealOS",
  webDir: ".output/public",
};

export default config;
