import type { CapacitorConfig } from "@capacitor/cli";

/**
 * CAPACITOR-001 · C1 Platform Preparation — institutional Capacitor config.
 * Distribution only: prepares the Core SaaS for a native shell.
 * webDir = SPA output from `npm run build:mobile` (Vite CAPACITOR_BUILD).
 * Do NOT set server.url for production (ADR-0032).
 * Core Integrity: does not alter Core SaaS behavior. C2+ owns native platforms.
 */
const config: CapacitorConfig = {
  appId: "com.yourmealos.eatclean",
  appName: "YourMealOS",
  webDir: ".output/public",
};

export default config;
