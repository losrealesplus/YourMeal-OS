/**
 * Developer Platform · Runtime consistency doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  pathExists,
  recordCheck,
  repoPath,
  resolveCwd,
} from "./doctor-shared.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorRuntime(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);

  const consistencyDir = repoPath(
    cwd,
    "src",
    "runtime",
    "ymos-runtime-consistency",
  );
  const assetsDir = repoPath(cwd, "src", "runtime", "ymos-runtime-assets");

  recordCheck(
    result,
    "runtime_consistency_engine",
    pathExists(consistencyDir),
    "src/runtime/ymos-runtime-consistency/",
  );
  recordCheck(
    result,
    "runtime_assets_store",
    pathExists(assetsDir),
    "src/runtime/ymos-runtime-assets/",
  );

  const requiredConsistency = ["engine.ts", "index.ts", "annotate.ts"];
  const present = [];
  for (const name of requiredConsistency) {
    const p = repoPath(cwd, "src", "runtime", "ymos-runtime-consistency", name);
    if (pathExists(p)) present.push(name);
  }
  result.evidence.consistencyFiles = present;
  recordCheck(
    result,
    "runtime_consistency_core_files",
    present.length === requiredConsistency.length,
    present.join(",") || "missing consistency core files",
  );

  const storeTs = repoPath(
    cwd,
    "src",
    "runtime",
    "ymos-runtime-assets",
    "store.ts",
  );
  recordCheck(
    result,
    "runtime_assets_store_ts",
    pathExists(storeTs),
    pathExists(storeTs) ? storeTs : "ymos-runtime-assets/store.ts missing",
  );

  result.evidence.runtimeAnchors = {
    consistency: pathExists(consistencyDir),
    assets: pathExists(assetsDir),
  };

  return result;
}
