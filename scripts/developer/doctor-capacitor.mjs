/**
 * Developer Platform · Capacitor doctor.
 * Evidence before Implementation.
 * Read-only — does not modify Capacitor pipelines.
 */
import {
  createDoctorResult,
  pathExists,
  readJson,
  readText,
  recordCheck,
  repoPath,
  resolveCwd,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorCapacitor(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);

  const configTs = repoPath(cwd, "capacitor.config.ts");
  const configJs = repoPath(cwd, "capacitor.config.js");
  const configJson = repoPath(cwd, "capacitor.config.json");
  const configPath = [configTs, configJs, configJson].find(pathExists) ?? null;
  result.evidence.capacitorConfig = configPath;
  recordCheck(
    result,
    "capacitor_config_present",
    Boolean(configPath),
    configPath ?? "capacitor.config.(ts|js|json) missing",
  );

  if (configPath) {
    const body = readText(configPath);
    const hasAppId = /appId\s*:/.test(body) || /"appId"\s*:/.test(body);
    const hasWebDir = /webDir\s*:/.test(body) || /"webDir"\s*:/.test(body);
    recordCheck(result, "capacitor_config_app_id", hasAppId, "appId field");
    recordCheck(result, "capacitor_config_web_dir", hasWebDir, "webDir field");
  }

  const pkgPath = repoPath(cwd, "package.json");
  if (pathExists(pkgPath)) {
    const pkg = readJson(pkgPath);
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    const core = Boolean(deps["@capacitor/core"]);
    const cli = Boolean(deps["@capacitor/cli"]);
    const android = Boolean(deps["@capacitor/android"]);
    result.evidence.capacitorDeps = {
      core: deps["@capacitor/core"] ?? null,
      cli: deps["@capacitor/cli"] ?? null,
      android: deps["@capacitor/android"] ?? null,
      ios: deps["@capacitor/ios"] ?? null,
    };
    recordCheck(result, "capacitor_core_dependency", core, "@capacitor/core");
    recordCheck(result, "capacitor_cli_dependency", cli, "@capacitor/cli");
    recordCheck(
      result,
      "capacitor_android_dependency",
      android,
      "@capacitor/android",
    );
  }

  recordCheck(
    result,
    "android_project_dir",
    pathExists(repoPath(cwd, "android")),
    "android/",
  );

  return result;
}
