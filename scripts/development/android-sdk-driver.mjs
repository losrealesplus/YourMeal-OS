/**
 * Android SDK Capability Driver.
 * HOUSEKEEPING-002
 */
import fs from "node:fs";
import path from "node:path";
import {
  createDriverResult,
  hint,
  pathExists,
  recommend,
  repoPath,
  resolveCwd,
  resolveEnv,
  setStatus,
} from "./shared.mjs";

/**
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} env
 * @param {import('./shared.mjs').DriverContext} ctx
 */
function resolveSdkRoot(cwd, env, ctx) {
  if (env.ANDROID_HOME && pathExists(ctx, env.ANDROID_HOME)) {
    return { root: env.ANDROID_HOME, source: "ANDROID_HOME" };
  }
  if (env.ANDROID_SDK_ROOT && pathExists(ctx, env.ANDROID_SDK_ROOT)) {
    return { root: env.ANDROID_SDK_ROOT, source: "ANDROID_SDK_ROOT" };
  }
  const localProps = repoPath(cwd, "android", "local.properties");
  if (pathExists(ctx, localProps)) {
    try {
      const body = fs.readFileSync(localProps, "utf8");
      const m = body.match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m);
      if (m) {
        const raw = m[1].trim().replace(/\\\\/g, "\\");
        if (pathExists(ctx, raw)) {
          return { root: raw, source: "android/local.properties" };
        }
      }
    } catch {
      /* ignore */
    }
  }
  const workspaceSdk = repoPath(cwd, ".android-sdk");
  if (pathExists(ctx, workspaceSdk)) {
    return { root: workspaceSdk, source: ".android-sdk" };
  }
  return { root: null, source: null };
}

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runAndroidSdkDriver(ctx = {}) {
  const result = createDriverResult("android-sdk", "Android SDK");
  const cwd = resolveCwd(ctx);
  const env = resolveEnv(ctx);
  const soft = Boolean(ctx.ci);

  result.evidence.ANDROID_HOME = env.ANDROID_HOME ?? null;
  result.evidence.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT ?? null;

  const { root, source } = resolveSdkRoot(cwd, env, ctx);
  result.evidence.sdkRoot = root;
  result.evidence.sdkSource = source;

  if (!root) {
    setStatus(
      result,
      soft ? "WARNING" : "ERROR",
      "Android SDK not found (ANDROID_HOME / ANDROID_SDK_ROOT / sdk.dir)",
    );
    recommend(result, "Install Android SDK and export ANDROID_HOME.");
    hint(result, 'export ANDROID_HOME="$HOME/Library/Android/sdk"');
    hint(result, 'export ANDROID_SDK_ROOT="$ANDROID_HOME"');
    hint(result, 'export PATH="$ANDROID_HOME/platform-tools:$PATH"');
    return result;
  }

  setStatus(result, "PASS", `SDK via ${source}`);

  const platformTools = path.join(root, "platform-tools");
  const platforms = path.join(root, "platforms");
  const buildTools = path.join(root, "build-tools");

  if (!pathExists(ctx, platformTools)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "platform-tools missing");
    recommend(result, "Install Android SDK Platform-Tools.");
  }
  if (!pathExists(ctx, platforms)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "platforms/ missing");
    recommend(result, "Install at least one Android platform (sdkmanager).");
  } else {
    try {
      const entries = fs
        .readdirSync(platforms)
        .filter((n) => n.startsWith("android-"));
      result.evidence.platforms = entries;
      if (entries.length === 0) {
        setStatus(result, soft ? "WARNING" : "ERROR", "No android-* platforms installed");
      }
    } catch {
      setStatus(result, "WARNING", "Unable to list platforms/");
    }
  }
  if (!pathExists(ctx, buildTools)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "build-tools missing");
    recommend(result, "Install Android SDK Build-Tools.");
  } else {
    try {
      result.evidence.buildTools = fs.readdirSync(buildTools);
    } catch {
      /* ignore */
    }
  }

  const adb = path.join(platformTools, process.platform === "win32" ? "adb.exe" : "adb");
  result.evidence.adbPath = pathExists(ctx, adb) ? adb : null;
  if (!pathExists(ctx, adb)) {
    setStatus(result, soft ? "WARNING" : "ERROR", "adb binary missing under platform-tools");
  }

  return result;
}
