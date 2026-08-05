/**
 * Developer Platform · shared doctor helpers.
 * Evidence before Implementation.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {{ id: string, ok: boolean, detail?: string }} DoctorCheck
 * @typedef {{
 *   ok: boolean,
 *   checks: DoctorCheck[],
 *   evidence: Record<string, unknown>,
 *   warnings: string[],
 *   errors: string[],
 * }} DoctorResult
 * @typedef {{
 *   cwd?: string,
 *   env?: NodeJS.ProcessEnv,
 *   ci?: boolean,
 *   verbose?: boolean,
 *   requireAndroid?: boolean,
 *   skipNetwork?: boolean,
 * }} DoctorOptions
 */

/** @returns {DoctorResult} */
export function createDoctorResult() {
  return {
    ok: true,
    checks: [],
    evidence: {},
    warnings: [],
    errors: [],
  };
}

/**
 * @param {DoctorResult} result
 * @param {string} id
 * @param {boolean} ok
 * @param {string} [detail]
 * @param {{ soft?: boolean }} [opts]
 */
export function recordCheck(result, id, ok, detail = "", opts = {}) {
  result.checks.push({ id, ok, detail });
  if (ok) return;
  if (opts.soft) {
    result.warnings.push(`${id}: ${detail}`);
    return;
  }
  result.ok = false;
  result.errors.push(`${id}: ${detail}`);
}

/**
 * @param {DoctorResult} result
 * @param {string} message
 */
export function recordWarning(result, message) {
  result.warnings.push(message);
}

/**
 * @param {DoctorOptions} [options]
 */
export function resolveCwd(options = {}) {
  return options.cwd ?? process.cwd();
}

/**
 * @param {DoctorOptions} [options]
 */
export function resolveEnv(options = {}) {
  return options.env ?? process.env;
}

/**
 * @param {string} cwd
 * @param {...string} parts
 */
export function repoPath(cwd, ...parts) {
  return path.join(cwd, ...parts);
}

/**
 * @param {string} filePath
 */
export function pathExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} filePath
 * @param {string} [encoding]
 */
export function readText(filePath, encoding = "utf8") {
  return fs.readFileSync(filePath, encoding);
}

/**
 * @param {string} filePath
 */
export function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 */
export function runCommand(command, args, opts = {}) {
  const timeout = opts.timeoutMs ?? 15_000;
  const r = spawnSync(command, args, {
    cwd: opts.cwd,
    env: opts.env,
    encoding: "utf8",
    timeout,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = String(r.stdout ?? "");
  const stderr = String(r.stderr ?? "");
  if (r.error) {
    return {
      ok: false,
      stdout,
      stderr: stderr || r.error.message,
      code: typeof r.status === "number" ? r.status : 1,
    };
  }
  const code = typeof r.status === "number" ? r.status : 1;
  return {
    ok: code === 0,
    stdout,
    stderr,
    code,
  };
}

/**
 * Resolve binary on PATH (or absolute path).
 * @param {string} bin
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveBinary(bin, env = process.env) {
  if (path.isAbsolute(bin) && pathExists(bin)) return bin;
  const whichCmd = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(whichCmd, [bin], {
    env,
    encoding: "utf8",
    timeout: 5_000,
  });
  if (r.status === 0) {
    const line = String(r.stdout ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean);
    if (line && pathExists(line)) return line;
  }
  return null;
}

/**
 * @param {DoctorOptions} [options]
 */
export function androidRequired(options = {}) {
  if (typeof options.requireAndroid === "boolean") return options.requireAndroid;
  return !options.ci;
}

/**
 * Parse common doctor CLI flags.
 * @param {string[]} argv
 */
export function parseDoctorArgs(argv) {
  /** @type {{ ci: boolean, json: boolean, verbose: boolean, requireAndroid: boolean | null, skipNetwork: boolean }} */
  const out = {
    ci: false,
    json: false,
    verbose: false,
    requireAndroid: null,
    skipNetwork: false,
  };
  for (const a of argv) {
    if (a === "--ci") out.ci = true;
    else if (a === "--json") out.json = true;
    else if (a === "--verbose" || a === "--info" || a === "-v")
      out.verbose = true;
    else if (a === "--strict-android") out.requireAndroid = true;
    else if (a === "--soft-android") out.requireAndroid = false;
    else if (a === "--skip-network") out.skipNetwork = true;
  }
  if (out.ci && out.requireAndroid == null) out.requireAndroid = false;
  return out;
}
