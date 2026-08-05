/**
 * Environment variables Capability Driver.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  hint,
  recommend,
  resolveEnv,
  setStatus,
  suggestJavaHomeHints,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runEnvironmentDriver(ctx = {}) {
  const result = createDriverResult("environment", "Environment");
  const env = resolveEnv(ctx);

  result.evidence.JAVA_HOME = env.JAVA_HOME ?? null;
  result.evidence.ANDROID_HOME = env.ANDROID_HOME ?? null;
  result.evidence.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT ?? null;
  result.evidence.PATH = env.PATH ? "(set)" : null;
  result.evidence.platform = process.platform;
  result.evidence.arch = process.arch;

  const missing = [];
  if (!env.JAVA_HOME) missing.push("JAVA_HOME");
  if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
    missing.push("ANDROID_HOME|ANDROID_SDK_ROOT");
  }
  if (!env.PATH) missing.push("PATH");

  result.evidence.missing = missing;

  if (missing.includes("JAVA_HOME")) {
    setStatus(result, "WARNING", "JAVA_HOME unset");
    recommend(result, "Configure JAVA_HOME apuntando a JBR 21.");
    for (const h of suggestJavaHomeHints(env)) hint(result, h);
  }

  if (missing.includes("ANDROID_HOME|ANDROID_SDK_ROOT") && !ctx.ci) {
    setStatus(result, "WARNING", "ANDROID_HOME / ANDROID_SDK_ROOT unset");
    recommend(result, "Export ANDROID_HOME to your Android SDK root.");
    hint(result, 'export ANDROID_HOME="$HOME/Library/Android/sdk"');
    hint(result, 'export ANDROID_SDK_ROOT="$ANDROID_HOME"');
  }

  if (result.status === "PASS") {
    setStatus(result, "PASS", "Core environment variables present");
  }
  return result;
}
