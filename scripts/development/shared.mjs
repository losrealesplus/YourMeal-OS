/**
 * Development Environment · shared Capability Driver contract.
 * HOUSEKEEPING-002 · DEVELOPER-PLATFORM-INFRA-001
 *
 * Drivers never auto-recover. They return Evidence + Recommendation + Recovery Hint.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** @typedef {'PASS' | 'WARNING' | 'ERROR'} DriverStatus */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   status: DriverStatus,
 *   message: string,
 *   evidence: Record<string, unknown>,
 *   recommendations: string[],
 *   recoveryHints: string[],
 * }} DriverResult
 */

/**
 * @typedef {{
 *   cwd?: string,
 *   env?: NodeJS.ProcessEnv,
 *   ci?: boolean,
 *   runCommand?: typeof defaultRunCommand,
 *   resolveBinary?: typeof defaultResolveBinary,
 *   pathExists?: typeof defaultPathExists,
 *   now?: () => Date,
 * }} DriverContext
 */

export const EXPECTED_JDK_MAJOR = 21;
export const MIN_NODE_MAJOR = 20;

/** @returns {DriverResult} */
export function createDriverResult(id, name) {
  return {
    id,
    name,
    status: "PASS",
    message: "OK",
    evidence: {},
    recommendations: [],
    recoveryHints: [],
  };
}

/**
 * @param {DriverResult} result
 * @param {DriverStatus} status
 * @param {string} message
 */
export function setStatus(result, status, message) {
  const rank = { PASS: 0, WARNING: 1, ERROR: 2 };
  if (rank[status] >= rank[result.status]) {
    result.status = status;
    result.message = message;
  }
}

/**
 * @param {DriverResult} result
 * @param {string} text
 */
export function recommend(result, text) {
  if (text && !result.recommendations.includes(text)) {
    result.recommendations.push(text);
  }
}

/**
 * @param {DriverResult} result
 * @param {string} text
 */
export function hint(result, text) {
  if (text && !result.recoveryHints.includes(text)) {
    result.recoveryHints.push(text);
  }
}

/** @param {DriverContext} [ctx] */
export function resolveCwd(ctx = {}) {
  return ctx.cwd ?? process.cwd();
}

/** @param {DriverContext} [ctx] */
export function resolveEnv(ctx = {}) {
  return ctx.env ?? process.env;
}

/** @param {string} filePath */
export function defaultPathExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {DriverContext} ctx
 * @param {string} filePath
 */
export function pathExists(ctx, filePath) {
  return (ctx.pathExists ?? defaultPathExists)(filePath);
}

/**
 * @param {string} cwd
 * @param {...string} parts
 */
export function repoPath(cwd, ...parts) {
  return path.join(cwd, ...parts);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 */
export function defaultRunCommand(command, args, opts = {}) {
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
  return { ok: code === 0, stdout, stderr, code };
}

/**
 * @param {string} bin
 * @param {NodeJS.ProcessEnv} [env]
 */
export function defaultResolveBinary(bin, env = process.env) {
  if (path.isAbsolute(bin) && defaultPathExists(bin)) return bin;
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
    if (line && defaultPathExists(line)) return line;
  }
  return null;
}

/**
 * @param {DriverContext} ctx
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 */
export function runCommand(ctx, command, args, opts = {}) {
  const fn = ctx.runCommand ?? defaultRunCommand;
  return fn(command, args, {
    cwd: opts.cwd ?? resolveCwd(ctx),
    env: opts.env ?? resolveEnv(ctx),
    timeoutMs: opts.timeoutMs,
  });
}

/**
 * @param {DriverContext} ctx
 * @param {string} bin
 */
export function resolveBinary(ctx, bin) {
  const fn = ctx.resolveBinary ?? defaultResolveBinary;
  return fn(bin, resolveEnv(ctx));
}

/**
 * @param {string} text
 */
export function parseJavaVersion(text) {
  const m =
    text.match(/version\s+"([^"]+)"/i) ||
    text.match(/openjdk\s+(\d+(?:\.\d+)*)/i);
  return m ? m[1] : null;
}

/**
 * @param {string} version
 */
export function javaMajor(version) {
  return Number(String(version).split(".")[0] || 0);
}

/**
 * Suggest JBR/JDK 21 JAVA_HOME candidates (hints only — never applied).
 * @param {NodeJS.ProcessEnv} env
 */
export function suggestJavaHomeHints(env = process.env) {
  const hints = [];
  const candidates = [
    env.JAVA_HOME_21,
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
    `${env.HOME ?? ""}/Library/Java/JavaVirtualMachines/jbr-21.jdk/Contents/Home`,
    "/usr/lib/jvm/java-21-openjdk",
    "/usr/lib/jvm/temurin-21-jdk",
  ].filter(Boolean);
  for (const home of candidates) {
    hints.push(`export JAVA_HOME="${home}"`);
    hints.push(`export PATH="$JAVA_HOME/bin:$PATH"`);
  }
  if (hints.length === 0) {
    hints.push(
      "Install JetBrains Runtime / Temurin JDK 21, then export JAVA_HOME to that path.",
    );
  }
  return hints;
}
