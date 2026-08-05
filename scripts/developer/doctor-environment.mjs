/**
 * Developer Platform · Environment doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  pathExists,
  readJson,
  recordCheck,
  repoPath,
  resolveCwd,
  resolveEnv,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorEnvironment(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const env = resolveEnv(options);

  const pkgPath = repoPath(cwd, "package.json");
  const hasPkg = pathExists(pkgPath);
  recordCheck(
    result,
    "package_json_present",
    hasPkg,
    hasPkg ? pkgPath : "package.json missing at repo root",
  );

  if (hasPkg) {
    const pkg = readJson(pkgPath);
    result.evidence.packageName = pkg.name ?? null;
    result.evidence.packageType = pkg.type ?? null;
    recordCheck(
      result,
      "package_type_module",
      pkg.type === "module",
      `type=${pkg.type ?? "(unset)"}`,
    );
  }

  recordCheck(
    result,
    "scripts_developer_dir",
    pathExists(repoPath(cwd, "scripts", "developer")),
    "scripts/developer/",
  );

  result.evidence.cwd = cwd;
  result.evidence.platform = process.platform;
  result.evidence.arch = process.arch;
  result.evidence.nodeEnv = env.NODE_ENV ?? null;
  result.evidence.ci = Boolean(options.ci || env.CI);

  return result;
}
