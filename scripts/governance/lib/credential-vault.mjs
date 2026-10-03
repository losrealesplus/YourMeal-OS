// @ts-check
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DEFAULT_VAULT_PATH = path.join(os.homedir(), ".yourmeal-os", "production-vault.env");

/**
 * Loads production credentials securely from an external, non-repository vault file.
 *
 * @param {string} [vaultPath=DEFAULT_VAULT_PATH]
 * @returns {Record<string, string>}
 */
export function loadProductionVault(vaultPath = DEFAULT_VAULT_PATH) {
  // Security invariant: Vault must NEVER reside inside the git repository
  const repoRoot = process.cwd();
  const resolvedVault = path.resolve(vaultPath);
  if (resolvedVault.startsWith(repoRoot) && !resolvedVault.includes(".gatekeeper")) {
    throw new Error(
      `[GATEKEEPER] SECURITY VIOLATION: Production vault path ${resolvedVault} must NOT reside inside the repository!`,
    );
  }

  if (!fs.existsSync(resolvedVault)) {
    throw new Error(
      `[GATEKEEPER] PRODUCTION_VAULT_NOT_FOUND: External vault not found at ${resolvedVault}. Direct production operations are locked.`,
    );
  }

  // Check file permissions on POSIX systems (should be 0600 or 0400)
  try {
    const stats = fs.statSync(resolvedVault);
    const mode = stats.mode & 0o777;
    if (process.platform !== "win32" && (mode & 0o077) !== 0) {
      console.warn(
        `[GATEKEEPER] Warning: Vault file ${resolvedVault} has overly permissive permissions (0${mode.toString(8)}). Recommended: 0600.`,
      );
    }
  } catch {
    // Ignore stat error
  }

  const content = fs.readFileSync(resolvedVault, "utf8");
  /** @type {Record<string, string>} */
  const credentials = {};

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      credentials[key] = val;
    }
  }

  return credentials;
}

/**
 * Executes a target command with privilege-separated injected credentials.
 *
 * @param {Object} params
 * @param {string} params.command
 * @param {string[]} params.args
 * @param {Record<string, string>} params.credentials
 * @returns {Promise<number>} exit code
 */
export function executeWithVault({ command, args, credentials }) {
  return new Promise((resolve, reject) => {
    const cleanEnv = {
      ...process.env,
      ...credentials,
    };

    const child = spawn(command, args, {
      stdio: "inherit",
      env: cleanEnv,
      shell: true,
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
