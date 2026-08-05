/**
 * Developer Platform · Android SDK / ADB doctor.
 * Evidence before Implementation.
 */
import fs from "node:fs";
import path from "node:path";
import {
  androidRequired,
  createDoctorResult,
  pathExists,
  readText,
  recordCheck,
  recordWarning,
  repoPath,
  resolveBinary,
  resolveCwd,
  resolveEnv,
  runCommand,
} from "./doctor-shared.mjs";

/**
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} env
 */
function resolveSdkRoot(cwd, env) {
  if (env.ANDROID_HOME && pathExists(env.ANDROID_HOME)) {
    return { root: env.ANDROID_HOME, source: "ANDROID_HOME" };
  }
  if (env.ANDROID_SDK_ROOT && pathExists(env.ANDROID_SDK_ROOT)) {
    return { root: env.ANDROID_SDK_ROOT, source: "ANDROID_SDK_ROOT" };
  }
  const localProps = repoPath(cwd, "android", "local.properties");
  if (pathExists(localProps)) {
    const body = readText(localProps);
    const m = body.match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m);
    if (m) {
      const raw = m[1].trim().replace(/\\\\/g, "\\");
      if (pathExists(raw)) return { root: raw, source: "android/local.properties" };
    }
  }
  const workspaceSdk = repoPath(cwd, ".android-sdk");
  if (pathExists(workspaceSdk)) {
    return { root: workspaceSdk, source: ".android-sdk" };
  }
  return { root: null, source: null };
}

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorAndroidSdk(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const env = resolveEnv(options);
  const soft = !androidRequired(options);

  const { root, source } = resolveSdkRoot(cwd, env);
  result.evidence.sdkRoot = root;
  result.evidence.sdkSource = source;
  recordCheck(
    result,
    "android_sdk_root",
    Boolean(root),
    root ? `${source}=${root}` : "ANDROID_HOME / sdk.dir / .android-sdk not found",
    { soft },
  );

  if (!root) return result;

  const platformTools = path.join(root, "platform-tools");
  const platforms = path.join(root, "platforms");
  recordCheck(
    result,
    "android_platform_tools",
    pathExists(platformTools),
    platformTools,
    { soft },
  );
  recordCheck(
    result,
    "android_platforms_dir",
    pathExists(platforms),
    platforms,
    { soft },
  );

  if (pathExists(platforms)) {
    try {
      const entries = fs
        .readdirSync(platforms)
        .filter((n) => n.startsWith("android-"));
      result.evidence.platforms = entries;
      recordCheck(
        result,
        "android_platform_installed",
        entries.length > 0,
        entries.length ? entries.join(",") : "no android-* under platforms/",
        { soft },
      );
    } catch (err) {
      recordCheck(
        result,
        "android_platform_installed",
        false,
        String(/** @type {Error} */ (err).message),
        { soft },
      );
    }
  }

  const adbCandidate = path.join(root, "platform-tools", "adb");
  const adbBin =
    (pathExists(adbCandidate) ? adbCandidate : null) ||
    resolveBinary("adb", env);
  result.evidence.adbPath = adbBin;
  recordCheck(
    result,
    "adb_present",
    Boolean(adbBin),
    adbBin ?? "adb not found",
    { soft },
  );

  if (adbBin) {
    const ver = runCommand(adbBin, ["version"], { env });
    const line = (ver.stdout || ver.stderr || "").trim().split(/\r?\n/)[0] ?? "";
    result.evidence.adbVersion = line || null;
    recordCheck(
      result,
      "adb_version_readable",
      ver.ok && Boolean(line),
      line || ver.stderr || "adb version failed",
      { soft },
    );
  } else if (soft) {
    recordWarning(result, "ADB soft-skipped in CI/soft-android mode");
  }

  return result;
}
