/**
 * Bridge: Development Environment drivers → Developer Doctor module.
 * HOUSEKEEPING-002 — does not modify Doctor Engine (runtime).
 */
import {
  runDevelopmentEnvironment,
  toDoctorResult,
} from "../development/index.mjs";

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 */
export function runDoctorDevelopmentEnvironment(options = {}) {
  const report = runDevelopmentEnvironment({
    cwd: options.cwd,
    env: options.env,
    ci: Boolean(options.ci),
    // Keep Gradle live probe off in CI for speed; local doctor may probe.
    probeGradle: options.ci ? false : true,
    skipCapDoctor: Boolean(options.ci),
  });
  return toDoctorResult(report);
}
