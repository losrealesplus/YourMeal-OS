/**
 * Developer Platform · Supabase doctor.
 * Evidence before Implementation.
 */
import fs from "node:fs";
import {
  createDoctorResult,
  pathExists,
  readText,
  recordCheck,
  recordWarning,
  repoPath,
  resolveCwd,
  resolveEnv,
} from "./doctor-shared.mjs";

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!pathExists(filePath)) return out;
  const body = readText(filePath);
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {import('./doctor-shared.mjs').DoctorResult}
 */
export function runDoctorSupabase(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const env = resolveEnv(options);

  const examplePath = repoPath(cwd, ".env.example");
  const hasExample = pathExists(examplePath);
  recordCheck(
    result,
    "env_example_present",
    hasExample,
    hasExample ? ".env.example" : ".env.example missing",
  );

  const example = hasExample ? parseEnvFile(examplePath) : {};
  const requiredKeys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
  ];
  for (const key of requiredKeys) {
    recordCheck(
      result,
      `env_example_${key.toLowerCase()}`,
      Boolean(example[key]),
      example[key] ? `${key} documented` : `${key} missing in .env.example`,
    );
  }

  const clientPath = repoPath(
    cwd,
    "src",
    "integrations",
    "supabase",
    "client.ts",
  );
  recordCheck(
    result,
    "supabase_client_module",
    pathExists(clientPath),
    pathExists(clientPath)
      ? "src/integrations/supabase/client.ts"
      : "supabase client.ts missing",
  );

  const localEnvPath = repoPath(cwd, ".env");
  const hasLocalEnv = pathExists(localEnvPath);
  result.evidence.hasLocalEnv = hasLocalEnv;
  const local = hasLocalEnv ? parseEnvFile(localEnvPath) : {};

  const url =
    env.VITE_SUPABASE_URL ||
    local.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    local.SUPABASE_URL ||
    example.VITE_SUPABASE_URL ||
    null;
  const key =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    local.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    local.SUPABASE_PUBLISHABLE_KEY ||
    null;

  result.evidence.supabaseUrlHost = url
    ? (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return null;
        }
      })()
    : null;

  recordCheck(
    result,
    "supabase_url_resolvable",
    Boolean(url),
    url ? "Supabase URL present (env/.env/.env.example)" : "no Supabase URL",
  );

  // Live credentials are optional for structural doctor PASS.
  // Missing / placeholder keys are warnings (auth live flows will fail separately).
  if (!key) {
    recordWarning(
      result,
      "publishable key not in process env/.env (documented in .env.example is enough for doctor structure)",
    );
    recordCheck(
      result,
      "supabase_publishable_key_documented",
      Boolean(example.VITE_SUPABASE_PUBLISHABLE_KEY),
      example.VITE_SUPABASE_PUBLISHABLE_KEY
        ? "key documented in .env.example"
        : "key not documented",
    );
  } else {
    const placeholder = /REPLACE_ME|your-anon-key|changeme/i.test(key);
    result.evidence.publishableKeyPlaceholder = placeholder;
    if (placeholder) {
      recordWarning(
        result,
        "VITE_SUPABASE_PUBLISHABLE_KEY looks like a placeholder (live auth will fail)",
      );
    }
    recordCheck(
      result,
      "supabase_publishable_key_documented",
      true,
      placeholder ? "placeholder key present" : "key present",
    );
  }

  result.evidence.envKeysDocumented = Object.keys(example).filter((k) =>
    /SUPABASE/i.test(k),
  );

  if (hasLocalEnv) {
    try {
      result.evidence.localEnvBytes = fs.statSync(localEnvPath).size;
    } catch {
      /* ignore */
    }
  }

  return result;
}
