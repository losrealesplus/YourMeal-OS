/**
 * Foundation Diagnostic Knowledge articles.
 * Few · well documented · DEVELOPER-PLATFORM-007
 */

import type { RuntimeKnowledge } from "../knowledge.types";
import { registerKnowledge } from "../KnowledgeRegistry";

export const FOUNDATION_KNOWLEDGE: RuntimeKnowledge[] = [
  {
    id: "know.assets.logo-not-found",
    title: "Assets · Logo not found",
    description:
      "The tenant logo asset failed to resolve or returned a non-OK status. Often caused by missing BrandConfig logo URL, bad BASE_URL, or __l5e placeholders on Android WebView.",
    category: "assets",
    severity: "error",
    tags: ["assets", "logo", "brand", "image", "l5e"],
    capabilities: ["assets", "branding"],
    incidentPatterns: [
      "logo",
      "logo not found",
      "logo fail",
      "assets.logo",
      "__l5e",
    ],
    recommendations: [
      "Verify BrandConfig.logo URL is absolute or correctly rooted under BASE_URL",
      "Confirm the logo file is present in the Capacitor web assets bundle",
      "Inspect Assets + DOM tabs for __l5e / broken currentSrc",
    ],
    references: ["docs/05-architecture/RUNTIME_CORE.md", "ANDROID-ASSETS-001"],
  },
  {
    id: "know.branding.config",
    title: "Branding · Brand config incomplete",
    description:
      "Tenant branding config is missing required fields (logo, colors, or display name). Product Core may render fallback or empty brand chrome.",
    category: "branding",
    severity: "warning",
    tags: ["branding", "tenant", "brandconfig", "logo"],
    capabilities: ["branding"],
    incidentPatterns: [
      "branding",
      "brand config",
      "brandconfig",
      "tenant brand",
    ],
    recommendations: [
      "Open tenant BrandConfig and ensure logo + primary colors are set",
      "Re-run Doctor Branding checks after publishing brand changes",
    ],
    references: ["docs/05-architecture/TENANT_BRANDING.md"],
  },
  {
    id: "know.supabase.env-missing",
    title: "Supabase · Environment variables missing",
    description:
      "VITE_SUPABASE_URL and/or anon key are absent in the runtime build. Auth, session, and data planes will fail closed.",
    category: "supabase",
    severity: "critical",
    tags: ["supabase", "env", "vite", "session", "auth"],
    capabilities: ["supabase", "session"],
    incidentPatterns: [
      "supabase",
      "env missing",
      "supabase url",
      "anon key",
      "VITE_SUPABASE",
    ],
    recommendations: [
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for the target flavor",
      "Rebuild the web bundle / Android assets after env changes",
      "Confirm secrets are not stripped by the Vite define pipeline",
    ],
  },
  {
    id: "know.android.sdk-mismatch",
    title: "Android · SDK / Capacitor mismatch",
    description:
      "Capacitor platform reports Android but SDK, WebView, or plugin versions look inconsistent with the project baseline. Common after partial upgrades.",
    category: "android",
    severity: "warning",
    tags: ["android", "sdk", "capacitor", "webview"],
    capabilities: ["android"],
    incidentPatterns: [
      "android",
      "sdk",
      "capacitor",
      "sdk mismatch",
      "webview",
    ],
    recommendations: [
      "Align @capacitor/* packages with android/ native project versions",
      "Run npx cap sync android after dependency bumps",
      "Re-check Doctor Android probe on a clean install build",
    ],
    references: ["docs/adr/0032-native-mobile-strategy.md"],
  },
  {
    id: "know.runtime.disabled",
    title: "Runtime · Suite / overlay disabled",
    description:
      "Runtime Suite is gated off (session dismiss, missing toggle, or env). Developer Platform modules will not paint until re-enabled via Horus / debug flag.",
    category: "runtime",
    severity: "info",
    tags: ["runtime", "suite", "overlay", "horus", "disabled"],
    capabilities: ["runtime"],
    incidentPatterns: [
      "runtime disabled",
      "overlay",
      "inspector disabled",
      "suite closed",
      "ymos.runtime-inspector",
    ],
    recommendations: [
      "Open with YMOS Horus or ?debug-runtime=1",
      "Clear sessionStorage ymos.runtime-inspector if stuck on dismiss (0)",
    ],
    references: ["docs/05-architecture/RUNTIME_SUITE.md"],
  },
  {
    id: "know.runtime.stale-cache",
    title: "Runtime · Stale cache",
    description:
      "WebView or service-worker-like caching may serve stale JS/CSS/assets after a deploy. Symptoms: old branding, missing modules, phantom asset errors.",
    category: "runtime",
    severity: "warning",
    tags: ["runtime", "cache", "stale", "webview", "assets"],
    capabilities: ["runtime", "assets"],
    incidentPatterns: [
      "stale cache",
      "stale",
      "cache",
      "old bundle",
      "historical",
    ],
    recommendations: [
      "Hard-reload the WebView / clear site data for the app origin",
      "Bump asset cache-busting query or build hash",
      "Use Consistency tab to separate HISTORICAL vs LIVE asset failures",
    ],
  },
];

let installed = false;

export function registerFoundationKnowledge(): void {
  if (installed) return;
  for (const article of FOUNDATION_KNOWLEDGE) {
    registerKnowledge(article);
  }
  installed = true;
}

export function resetFoundationKnowledgeFlag(): void {
  installed = false;
}

export const FOUNDATION_KNOWLEDGE_IDS = FOUNDATION_KNOWLEDGE.map((a) => a.id);
