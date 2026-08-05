/**
 * npm Capability Driver.
 * HOUSEKEEPING-002
 */
import {
  createDriverResult,
  recommend,
  resolveBinary,
  runCommand,
  setStatus,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runNpmDriver(ctx = {}) {
  const result = createDriverResult("npm", "npm");

  if (ctx.forceNoNpm) {
    setStatus(result, "ERROR", "npm not found");
    recommend(result, "Install npm (bundled with Node.js).");
    return result;
  }

  const npmBin = resolveBinary(ctx, "npm");
  result.evidence.npmPath = npmBin;
  if (!npmBin) {
    setStatus(result, "ERROR", "npm not found on PATH");
    recommend(result, "Install npm (bundled with Node.js).");
    return result;
  }

  const ver = runCommand(ctx, npmBin, ["--version"]);
  const version = (ver.stdout || "").trim();
  result.evidence.npmVersion = version || null;
  if (!ver.ok || !version) {
    setStatus(result, "ERROR", "npm --version failed");
    return result;
  }

  setStatus(result, "PASS", `npm ${version}`);
  return result;
}
