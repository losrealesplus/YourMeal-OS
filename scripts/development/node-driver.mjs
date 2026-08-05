/**
 * Node Capability Driver.
 * HOUSEKEEPING-002
 */
import {
  MIN_NODE_MAJOR,
  createDriverResult,
  recommend,
  resolveEnv,
  setStatus,
} from "./shared.mjs";

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runNodeDriver(ctx = {}) {
  const result = createDriverResult("node", "Node");
  const env = resolveEnv(ctx);

  // Allow mocks via ctx.nodeVersion
  const nodeVersion = ctx.nodeVersion ?? process.versions.node;
  const major = Number(String(nodeVersion).split(".")[0] || 0);
  result.evidence.nodeVersion = nodeVersion;
  result.evidence.nodeMajor = major;
  result.evidence.execPath = ctx.execPath ?? process.execPath;

  if (ctx.forceNoNode) {
    setStatus(result, "ERROR", "node not available");
    recommend(result, "Install Node.js 20+ (LTS recommended).");
    return result;
  }

  if (major < MIN_NODE_MAJOR) {
    setStatus(
      result,
      "ERROR",
      `node v${nodeVersion} — require major >= ${MIN_NODE_MAJOR}`,
    );
    recommend(result, `Upgrade Node.js to ${MIN_NODE_MAJOR}+ LTS.`);
    return result;
  }

  setStatus(result, "PASS", `node v${nodeVersion}`);
  if (!env.npm_config_user_agent && !ctx.ci) {
    // informational only
    result.evidence.npmUserAgent = null;
  }
  return result;
}
