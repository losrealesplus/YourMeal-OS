/**
 * Developer Platform · Network doctor.
 * Evidence before Implementation.
 */
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
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} env
 */
function resolveProbeUrl(cwd, env) {
  if (env.YMOS_DOCTOR_PROBE_URL) return env.YMOS_DOCTOR_PROBE_URL;
  if (env.VITE_SUPABASE_URL) return env.VITE_SUPABASE_URL;
  if (env.SUPABASE_URL) return env.SUPABASE_URL;
  const example = repoPath(cwd, ".env.example");
  if (pathExists(example)) {
    const body = readText(example);
    const m =
      body.match(/^\s*VITE_SUPABASE_URL\s*=\s*"?([^"\n]+)"?/m) ||
      body.match(/^\s*SUPABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  return "https://example.com";
}

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions} [options]
 * @returns {Promise<import('./doctor-shared.mjs').DoctorResult>}
 */
export async function runDoctorNetwork(options = {}) {
  const result = createDoctorResult();
  const cwd = resolveCwd(options);
  const env = resolveEnv(options);
  const soft = Boolean(options.ci || options.skipNetwork);

  if (options.skipNetwork) {
    recordWarning(result, "network probe skipped (--skip-network)");
    recordCheck(result, "network_probe_skipped", true, "skipped by flag");
    result.evidence.skipped = true;
    return result;
  }

  const url = resolveProbeUrl(cwd, env);
  result.evidence.probeUrl = url;

  let hostname = null;
  try {
    hostname = new URL(url).hostname;
  } catch {
    recordCheck(result, "network_probe_url_valid", false, `invalid URL: ${url}`, {
      soft,
    });
    return result;
  }
  result.evidence.hostname = hostname;
  recordCheck(result, "network_probe_url_valid", true, url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    result.evidence.httpStatus = res.status;
    // Any HTTP response proves connectivity (401/404 still ok).
    recordCheck(
      result,
      "network_http_reachable",
      res.status > 0,
      `HTTP ${res.status} from ${hostname}`,
      { soft },
    );
  } catch (err) {
    // Retry GET — some hosts reject HEAD.
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { Accept: "application/json" },
      });
      result.evidence.httpStatus = res.status;
      recordCheck(
        result,
        "network_http_reachable",
        res.status > 0,
        `HTTP ${res.status} (GET fallback) from ${hostname}`,
        { soft },
      );
    } catch (err2) {
      const msg = String(/** @type {Error} */ (err2).message || err.message);
      result.evidence.networkError = msg;
      recordCheck(
        result,
        "network_http_reachable",
        false,
        msg,
        { soft },
      );
    }
  } finally {
    clearTimeout(timer);
  }

  return result;
}
