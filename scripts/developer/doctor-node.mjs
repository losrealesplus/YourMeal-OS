/**
 * Developer Platform · Node / npm doctor.
 * Evidence before Implementation.
 */
import {
  createDoctorResult,
  recordCheck,
  recordWarning,
  resolveBinary,
  resolveEnv,
  runCommand,
} from "./doctor-shared.mjs";

const MIN_NODE_MAJOR = 20;

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorNode(options = {}) {
  const result = createDoctorResult();
  const env = resolveEnv(options);

  const nodeVersion = process.versions.node;
  const major = Number(String(nodeVersion).split(".")[0] || 0);
  result.evidence.nodeVersion = nodeVersion;
  result.evidence.nodeMajor = major;
  result.evidence.execPath = process.execPath;

  recordCheck(
    result,
    "node_version_supported",
    major >= MIN_NODE_MAJOR,
    `node v${nodeVersion} (min major ${MIN_NODE_MAJOR})`,
  );

  const npmBin = resolveBinary("npm", env);
  result.evidence.npmPath = npmBin;
  recordCheck(
    result,
    "npm_on_path",
    Boolean(npmBin),
    npmBin ?? "npm not found on PATH",
  );

  if (npmBin) {
    const npmVer = runCommand(npmBin, ["--version"], { env });
    const version = (npmVer.stdout || "").trim();
    result.evidence.npmVersion = version || null;
    recordCheck(
      result,
      "npm_version_readable",
      npmVer.ok && Boolean(version),
      version || npmVer.stderr || "npm --version failed",
    );
  }

  if (env.npm_config_user_agent) {
    result.evidence.npmUserAgent = env.npm_config_user_agent;
  } else {
    recordWarning(result, "npm_config_user_agent unset (not running via npm?)");
  }

  return result;
}
