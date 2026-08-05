/**
 * Developer Platform · Vite doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  pathExists,
  readJson,
  recordCheck,
  repoPath,
  resolveCwd,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorVite(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);

  const configCandidates = [
    "vite.config.ts",
    "vite.config.mts",
    "vite.config.js",
    "vite.config.mjs",
  ].map((n) => repoPath(cwd, n));
  const configPath = configCandidates.find(pathExists) ?? null;
  result.evidence.viteConfig = configPath;
  recordCheck(
    result,
    "vite_config_present",
    Boolean(configPath),
    configPath ?? "vite.config.* missing",
  );

  const pkgPath = repoPath(cwd, "package.json");
  if (pathExists(pkgPath)) {
    const pkg = readJson(pkgPath);
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    result.evidence.viteVersion = deps.vite ?? null;
    recordCheck(
      result,
      "vite_dependency",
      Boolean(deps.vite),
      deps.vite ? `vite ${deps.vite}` : "vite not in package.json",
    );

    const scripts = pkg.scripts ?? {};
    result.evidence.buildScripts = {
      build: scripts.build ?? null,
      buildWeb: scripts["build:web"] ?? null,
      buildMobile: scripts["build:mobile"] ?? null,
      dev: scripts.dev ?? null,
    };
    recordCheck(
      result,
      "vite_dev_script",
      typeof scripts.dev === "string" && /vite/.test(scripts.dev),
      scripts.dev ?? "dev script missing",
    );
    recordCheck(
      result,
      "vite_build_script",
      typeof scripts.build === "string" && /vite/.test(scripts.build),
      scripts.build ?? "build script missing",
    );
  }

  return result;
}
