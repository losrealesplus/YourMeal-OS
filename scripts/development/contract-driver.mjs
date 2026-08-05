/**
 * Environment Contract Driver — compare machine + .env against official contract.
 * HOUSEKEEPING-003
 *
 * Never auto-fills secrets. Reports ✔ / ✖ with Evidence + Recommendation + Hint.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ENVIRONMENT_CONTRACT,
  ENVIRONMENT_CONTRACT_FILE,
} from "./environment-contract.mjs";
import {
  createDriverResult,
  hint,
  pathExists,
  recommend,
  resolveCwd,
  resolveEnv,
  setStatus,
} from "./shared.mjs";

/**
 * Parse KEY=VALUE dotenv text (simple, quoted values supported).
 * @param {string} body
 */
export function parseDotenv(body) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const raw of String(body || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

/**
 * @param {import('./shared.mjs').DriverContext} ctx
 * @param {string} cwd
 */
export function loadDotenvFiles(ctx, cwd) {
  /** @type {Record<string, string>} */
  const merged = {};
  const files = [
    ENVIRONMENT_CONTRACT_FILE,
    ".env.example",
    ".env",
    ".env.local",
    ".env.development",
  ];
  /** @type {string[]} */
  const loaded = [];
  for (const name of files) {
    const full = path.join(cwd, name);
    if (!pathExists(ctx, full)) continue;
    try {
      const body = fs.readFileSync(full, "utf8");
      Object.assign(merged, parseDotenv(body));
      loaded.push(name);
    } catch {
      /* ignore unreadable */
    }
  }
  return { merged, loaded };
}

/**
 * @param {string | undefined | null} value
 * @param {string[]} [forbidden]
 */
export function isPlaceholder(value, forbidden = []) {
  if (value == null) return true;
  const v = String(value).trim();
  if (!v) return true;
  return forbidden.some((f) => v.includes(f));
}

/**
 * Resolve variable value: process.env wins, then dotenv merge.
 * For altKeys, first present non-placeholder wins.
 * @param {import('./environment-contract.mjs').ContractVariable} entry
 * @param {NodeJS.ProcessEnv} env
 * @param {Record<string, string>} dotenv
 */
export function resolveContractValue(entry, env, dotenv) {
  const keys = [entry.key, ...(entry.altKeys ?? [])];
  for (const k of keys) {
    if (env[k] != null && String(env[k]).trim() !== "") {
      return { key: k, value: String(env[k]), source: "process.env" };
    }
  }
  for (const k of keys) {
    if (dotenv[k] != null && String(dotenv[k]).trim() !== "") {
      return { key: k, value: String(dotenv[k]), source: "dotenv" };
    }
  }
  return { key: entry.key, value: null, source: null };
}

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runContractDriver(ctx = {}) {
  const result = createDriverResult("environment-contract", "Environment Contract");
  const cwd = resolveCwd(ctx);
  const env = resolveEnv(ctx);
  const soft = Boolean(ctx.ci);

  const { merged: dotenv, loaded } = loadDotenvFiles(ctx, cwd);
  result.evidence.contractVersion = ENVIRONMENT_CONTRACT.version;
  result.evidence.contractFile = ENVIRONMENT_CONTRACT_FILE;
  result.evidence.dotenvFilesLoaded = loaded;
  result.evidence.hasContractExample = pathExists(
    ctx,
    path.join(cwd, ENVIRONMENT_CONTRACT_FILE),
  );

  if (!result.evidence.hasContractExample) {
    setStatus(result, "ERROR", `${ENVIRONMENT_CONTRACT_FILE} missing from repo`);
    recommend(result, `Restore ${ENVIRONMENT_CONTRACT_FILE} from git.`);
    return result;
  }

  /** @type {Array<{
   *   key: string,
   *   ok: boolean,
   *   required: boolean,
   *   severity: string,
   *   category: string,
   *   source: string | null,
   *   detail: string,
   * }>} */
  const items = [];
  let missingRequired = 0;
  let missingOptional = 0;

  for (const entry of ENVIRONMENT_CONTRACT.variables) {
    const resolved = resolveContractValue(entry, env, dotenv);
    const forbidden = entry.placeholderForbidden ?? [];
    const placeholder = isPlaceholder(resolved.value, forbidden);
    const present = resolved.value != null && !placeholder;

    let detail = present
      ? `present (${resolved.source}${resolved.key !== entry.key ? ` via ${resolved.key}` : ""})`
      : placeholder && resolved.value
        ? "placeholder / unset value"
        : "Missing";

    // Shell vars: in CI, ANDROID_HOME may be soft
    let ok = present;
    if (!ok && entry.required) {
      if (soft && (entry.category === "android" || entry.category === "java")) {
        detail = `${detail} (soft in CI)`;
        missingOptional += 1;
      } else {
        missingRequired += 1;
      }
    } else if (!ok && !entry.required) {
      missingOptional += 1;
    }

    if (!ok && entry.required && !(soft && (entry.category === "android" || entry.category === "java"))) {
      ok = false;
      const sev = entry.severity === "error" ? "ERROR" : "WARNING";
      setStatus(
        result,
        sev === "ERROR" ? "ERROR" : "WARNING",
        `Missing required: ${entry.key}`,
      );
      recommend(result, `Set ${entry.key} — ${entry.description}`);
      if (entry.kind === "dotenv") {
        hint(result, `cp ${ENVIRONMENT_CONTRACT_FILE} .env  # then fill ${entry.key}`);
      } else if (entry.key === "JAVA_HOME") {
        hint(result, 'export JAVA_HOME="/path/to/jdk-21"');
        hint(result, 'export PATH="$JAVA_HOME/bin:$PATH"');
      } else if (entry.key === "ANDROID_HOME") {
        hint(result, 'export ANDROID_HOME="$HOME/Library/Android/sdk"');
        hint(result, 'export ANDROID_SDK_ROOT="$ANDROID_HOME"');
      }
    } else if (!ok && entry.severity === "warning") {
      setStatus(result, "WARNING", `Optional missing: ${entry.key}`);
      recommend(result, `Optional: set ${entry.key} when needed — ${entry.description}`);
    }

    items.push({
      key: entry.key,
      ok: present,
      required: entry.required,
      severity: entry.severity,
      category: entry.category,
      source: resolved.source,
      detail,
    });
  }

  result.evidence.items = items;
  result.evidence.missingRequired = missingRequired;
  result.evidence.missingOptional = missingOptional;
  result.evidence.presentCount = items.filter((i) => i.ok).length;
  result.evidence.totalCount = items.length;

  if (missingRequired === 0 && result.status === "PASS") {
    setStatus(
      result,
      "PASS",
      `Contract ${ENVIRONMENT_CONTRACT.version} · ${result.evidence.presentCount}/${result.evidence.totalCount} present`,
    );
  } else if (missingRequired === 0 && result.status === "WARNING") {
    result.message = `Contract OK for required vars · ${missingOptional} optional missing`;
  }

  return result;
}

/**
 * Pretty ✔/✖ lines for CLI report.
 * @param {import('./shared.mjs').DriverResult} result
 */
export function formatContractChecklist(result) {
  const items = /** @type {any[]} */ (result.evidence.items ?? []);
  return items.map((i) => {
    const mark = i.ok ? "✔" : "✖";
    const req = i.required ? "" : " (optional)";
    return `${mark} ${i.key}${req}  ${i.ok ? "" : i.detail}`.trimEnd();
  });
}
