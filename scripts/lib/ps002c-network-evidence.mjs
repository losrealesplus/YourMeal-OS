/**
 * AUTH-NET-003 · Playwright network capture (evidence only).
 *
 * Does not change Auth, routing, or FCR-008. Records request/response/failure
 * for the Chromium context so we can compare Playwright vs Chrome DevTools.
 */

export const OFFICIAL_SUPABASE_HOST = "djangucecsphnejplvic.supabase.co";

const SENSITIVE_HEADER = /^(authorization|apikey|cookie|x-supabase-api-version)$/i;

/**
 * @param {string | null | undefined} value
 * @param {number} [keep]
 */
export function redactSecret(value, keep = 12) {
  if (value == null || value === "") return null;
  const s = String(value);
  if (s.length <= keep) return `${s.slice(0, 4)}…(len=${s.length})`;
  return `${s.slice(0, keep)}…(len=${s.length})`;
}

/**
 * @param {Record<string, string>} headers
 */
export function redactHeaders(headers) {
  /** @type {Record<string, string | null>} */
  const out = {};
  for (const [k, v] of Object.entries(headers ?? {})) {
    out[k] = SENSITIVE_HEADER.test(k) ? redactSecret(v) : v;
  }
  return out;
}

/**
 * Never persist JWTs / passwords in evidence JSON.
 * @param {string | null} body
 * @param {string} url
 */
export function summarizeResponseBody(body, url) {
  if (body == null || body === "") return null;
  const text = String(body);
  const isAuthToken = /\/auth\/v1\/token/i.test(url);
  try {
    const json = JSON.parse(text);
    if (isAuthToken && json && typeof json === "object") {
      return {
        kind: "auth_token_json",
        hasAccessToken: Boolean(json.access_token),
        hasRefreshToken: Boolean(json.refresh_token),
        userId: json.user?.id ?? json.user_id ?? null,
        error: json.error ?? json.error_description ?? json.message ?? null,
        keys: Object.keys(json).slice(0, 20),
      };
    }
    if (json && typeof json === "object" && (json.message || json.error)) {
      return {
        kind: "json_error",
        message: json.message ?? null,
        error: json.error ?? null,
        hint: json.hint ?? null,
        code: json.code ?? null,
      };
    }
  } catch {
    /* not JSON */
  }
  const clipped = text.length > 240 ? `${text.slice(0, 240)}…` : text;
  return { kind: "text", preview: clipped.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+/g, "[JWT]") };
}

/**
 * @param {string} url
 */
export function isAuthTokenUrl(url) {
  return /\/auth\/v1\/token/i.test(url);
}

/**
 * @param {string} url
 */
export function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Attach request/response/requestfailed listeners.
 * Call `markPhase("pre_login"|"post_submit")` around the Entrar click.
 *
 * @param {import('playwright').Page} page
 * @param {{ expectedHost?: string }} [opts]
 */
export function attachPs002cNetworkCapture(page, opts = {}) {
  const expectedHost = opts.expectedHost ?? OFFICIAL_SUPABASE_HOST;
  /** @type {string} */
  let phase = "page_load";
  /** @type {Map<string, object>} */
  const byId = new Map();
  /** @type {object[]} */
  const events = [];
  /** @type {Promise<void>[]} */
  const pending = [];

  function upsert(id, patch) {
    const prev = byId.get(id) ?? { id };
    const next = { ...prev, ...patch };
    byId.set(id, next);
    return next;
  }

  page.on("request", (req) => {
    const url = req.url();
    const id = req.url() + "|" + req.method() + "|" + Date.now() + "|" + Math.random();
    // Playwright Request has no stable id across events — correlate via object.
    // @ts-expect-error stash
    req.__ps002cNetId = id;
    const entry = {
      id,
      phase,
      method: req.method(),
      url,
      host: hostOf(url),
      resourceType: req.resourceType(),
      isAuthToken: isAuthTokenUrl(url),
      isSupabase: (hostOf(url) || "").includes("supabase.co"),
      requestHeaders: redactHeaders(req.headers()),
      startedAtMs: Date.now(),
      status: null,
      ok: null,
      failure: null,
      responseHeaders: null,
      responseSummary: null,
    };
    byId.set(id, entry);
    events.push(entry);
  });

  page.on("response", (res) => {
    const req = res.request();
    // @ts-expect-error stash
    const id = req.__ps002cNetId;
    if (!id || !byId.has(id)) return;
    pending.push(
      (async () => {
        let body = null;
        try {
          // Avoid huge binaries; auth/json only
          const ct = res.headers()["content-type"] || "";
          if (
            isAuthTokenUrl(res.url()) ||
            ct.includes("json") ||
            ct.includes("text")
          ) {
            body = await res.text();
          }
        } catch {
          body = null;
        }
        upsert(id, {
          status: res.status(),
          ok: res.ok(),
          finishedAtMs: Date.now(),
          responseHeaders: redactHeaders(res.headers()),
          responseSummary: summarizeResponseBody(body, res.url()),
        });
      })(),
    );
  });

  page.on("requestfailed", (req) => {
    // @ts-expect-error stash
    const id = req.__ps002cNetId;
    const failure = req.failure();
    const patch = {
      ok: false,
      status: null,
      finishedAtMs: Date.now(),
      failure: {
        errorText: failure?.errorText ?? "unknown",
        // Playwright exposes net::ERR_* here when available
      },
    };
    if (id && byId.has(id)) {
      upsert(id, patch);
    } else {
      events.push({
        id: `failed-${Date.now()}`,
        phase,
        method: req.method(),
        url: req.url(),
        host: hostOf(req.url()),
        resourceType: req.resourceType(),
        isAuthToken: isAuthTokenUrl(req.url()),
        isSupabase: (hostOf(req.url()) || "").includes("supabase.co"),
        requestHeaders: redactHeaders(req.headers()),
        startedAtMs: Date.now(),
        ...patch,
        responseHeaders: null,
        responseSummary: null,
      });
    }
  });

  return {
    markPhase(next) {
      phase = next;
    },
    async flush() {
      await Promise.all(pending.splice(0));
    },
    /**
     * Best-effort SPA env probe. `import.meta.env` is not available inside
     * page.evaluate; SoT for the Auth URL is the captured auth/v1/token request.
     * @param {import('playwright').Page} p
     */
    async captureViteEnv(p) {
      try {
        return await p.evaluate(() => {
          const w = /** @type {Record<string, unknown>} */ (
            /** @type {unknown} */ (window)
          );
          const exposed =
            w.__YMOS_VITE_SUPABASE_URL__ ??
            w.VITE_SUPABASE_URL ??
            null;
          return {
            note: "Auth URL SoT = auth_net_003.authTokenRequests[].url (not page.evaluate import.meta).",
            exposedWindowUrl:
              typeof exposed === "string" ? exposed : null,
            locationOrigin: window.location.origin,
            locationHref: window.location.href,
          };
        });
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    buildEvidence() {
      return buildAuthNet003Evidence(events, { expectedHost });
    },
  };
}

/**
 * @param {readonly object[]} events
 * @param {{ expectedHost?: string }} [opts]
 */
export function buildAuthNet003Evidence(events, opts = {}) {
  const expectedHost = opts.expectedHost ?? OFFICIAL_SUPABASE_HOST;
  const list = [...events];
  const authToken = list.filter((e) => e.isAuthToken);
  const supabase = list.filter((e) => e.isSupabase);
  const failed = list.filter((e) => e.failure || e.ok === false);
  const postSubmitAuth = authToken.filter((e) => e.phase === "post_submit");

  const hosts = [
    ...new Set(
      authToken.map((e) => e.host).filter((h) => typeof h === "string"),
    ),
  ];

  const wrongHost = hosts.filter((h) => h !== expectedHost);
  const anyFailedAuth = authToken.some((e) => e.failure || e.status == null && e.ok === false);
  const any200 = authToken.some((e) => e.status === 200);

  let diagnosisNote =
    "No auth/v1/token requests captured — Playwright may not have reached signInWithPassword.";
  if (authToken.length > 0) {
    if (wrongHost.length) {
      diagnosisNote = `Auth token host(s) differ from official project: got ${hosts.join(", ")}; expected ${expectedHost}.`;
    } else if (anyFailedAuth && !any200) {
      const err =
        authToken.find((e) => e.failure)?.failure?.errorText ?? "request failed";
      diagnosisNote = `Auth token request to ${expectedHost} failed in Playwright: ${err}. Chrome 200 does not apply to this browser context.`;
    } else if (any200) {
      diagnosisNote =
        "Playwright observed auth/v1/token HTTP 200 — Failed to fetch is NOT a missing/wrong host; inspect post-200 client error or a different failed request.";
    } else {
      diagnosisNote = `Auth token requests seen (statuses: ${authToken
        .map((e) => e.status ?? e.failure?.errorText ?? "?")
        .join(", ")}).`;
    }
  }

  return {
    expectedHost,
    counts: {
      total: list.length,
      supabase: supabase.length,
      authToken: authToken.length,
      failed: failed.length,
      postSubmitAuthToken: postSubmitAuth.length,
    },
    authTokenHosts: hosts,
    wrongHost,
    authTokenRequests: authToken.map((e) => ({
      phase: e.phase,
      method: e.method,
      url: e.url,
      host: e.host,
      status: e.status,
      ok: e.ok,
      failure: e.failure,
      requestHeaders: e.requestHeaders,
      responseSummary: e.responseSummary,
      startedAtMs: e.startedAtMs,
      finishedAtMs: e.finishedAtMs ?? null,
    })),
    /** Supabase + failures only (keep evidence smaller than full HAR). */
    supabaseAndFailed: list
      .filter((e) => e.isSupabase || e.failure || e.isAuthToken)
      .map((e) => ({
        phase: e.phase,
        method: e.method,
        url: e.url,
        host: e.host,
        status: e.status,
        ok: e.ok,
        failure: e.failure,
        isAuthToken: e.isAuthToken,
        responseSummary: e.responseSummary,
      })),
    diagnosis: {
      callsOfficialHost:
        authToken.length > 0 && wrongHost.length === 0 && hosts.includes(expectedHost),
      missingAuthTokenRequest: authToken.length === 0,
      playwrightAuthTokenFailed: anyFailedAuth && !any200,
      playwrightAuthToken200: any200,
      note: diagnosisNote,
    },
  };
}

/**
 * @param {ReturnType<typeof buildAuthNet003Evidence>} evidence
 */
export function formatAuthNet003Report(evidence) {
  const lines = [
    "AUTH-NET-003 · Playwright network (auth focus)",
    "",
    `expectedHost: ${evidence.expectedHost}`,
    `authTokenHosts: ${JSON.stringify(evidence.authTokenHosts)}`,
    `wrongHost: ${JSON.stringify(evidence.wrongHost)}`,
    `counts: ${JSON.stringify(evidence.counts)}`,
    "",
    "auth/v1/token requests:",
  ];
  if (!evidence.authTokenRequests.length) {
    lines.push("  (none)");
  } else {
    for (const r of evidence.authTokenRequests) {
      lines.push(
        `  [${r.phase}] ${r.method} ${r.url}`,
        `    status=${r.status ?? "—"} ok=${r.ok} failure=${r.failure?.errorText ?? "—"}`,
        `    response=${JSON.stringify(r.responseSummary)}`,
      );
    }
  }
  lines.push("", `diagnosis: ${evidence.diagnosis.note}`);
  return lines.join("\n");
}
