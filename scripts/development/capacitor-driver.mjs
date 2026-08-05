/**
 * Capacitor Capability Driver.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  pathExists,
  recommend,
  repoPath,
  resolveBinary,
  resolveCwd,
  runCommand,
  setStatus,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runCapacitorDriver(ctx = {}) {
  const result = createDriverResult("capacitor", "Capacitor");
  const cwd = resolveCwd(ctx);

  const capConfig =
    pathExists(ctx, repoPath(cwd, "capacitor.config.ts")) ||
    pathExists(ctx, repoPath(cwd, "capacitor.config.json"));
  result.evidence.hasCapacitorConfig = capConfig;
  if (!capConfig) {
    setStatus(result, "WARNING", "capacitor.config.* not found");
    recommend(result, "Ensure Capacitor is initialized at repo root.");
  }

  const androidDir = pathExists(ctx, repoPath(cwd, "android"));
  const iosDir = pathExists(ctx, repoPath(cwd, "ios"));
  result.evidence.hasAndroid = androidDir;
  result.evidence.hasIos = iosDir;
  if (!androidDir) {
    setStatus(result, "WARNING", "android/ platform directory missing");
  }

  if (ctx.skipCapDoctor) {
    if (result.status === "PASS") setStatus(result, "PASS", "Capacitor project layout OK");
    return result;
  }

  const npxBin = resolveBinary(ctx, "npx");
  result.evidence.npxPath = npxBin;
  if (!npxBin) {
    setStatus(result, "WARNING", "npx not found — skip cap doctor");
    return result;
  }

  const cap = runCommand(ctx, npxBin, ["cap", "doctor"], {
    cwd,
    timeoutMs: 60_000,
  });
  result.evidence.capDoctorOk = cap.ok;
  result.evidence.capDoctorOut = `${cap.stdout}\n${cap.stderr}`.trim().slice(0, 2000);

  if (!cap.ok) {
    setStatus(result, "WARNING", "npx cap doctor reported issues");
    recommend(result, "Run `npx cap doctor` and fix reported platform gaps.");
    return result;
  }

  if (result.status === "PASS") {
    setStatus(result, "PASS", "Capacitor doctor OK");
  }
  return result;
}
