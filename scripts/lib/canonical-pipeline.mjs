/**
 * Shared PS-002-C / FCR-008 canonical pipeline validator (Node).
 * Keep in sync with src/auth/post-login-pipeline.ts · PS002_CANONICAL_STEPS.
 */
export const PS002_CANONICAL_STEPS = [
  "LOGIN",
  "LOGIN_OK",
  "CANONICAL_SESSION",
  "BOOTSTRAP_START",
  "IDENTITY_READY",
  "PROFILE_READY",
  "MEMBERSHIP_READY",
  "ROLE_READY",
  "HOME_PATH_RESOLVED",
  "NAVIGATE",
  "DASHBOARD_RENDERED",
];

/**
 * @param {readonly string[]} observed
 */
export function listOutOfOrderSteps(observed) {
  const filtered = observed.filter((s) => PS002_CANONICAL_STEPS.includes(s));
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== PS002_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

export function validateCanonicalPipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = PS002_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = PS002_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listOutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;

  const extras = observed.filter((s) => !PS002_CANONICAL_STEPS.includes(s));

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === PS002_CANONICAL_STEPS.length;

  return {
    ok,
    observed: [...observed],
    duplicates,
    missing,
    out_of_order,
    unexpectedOrder,
    firstFailure: ok ? null : missing[0] ?? duplicates[0] ?? out_of_order[0] ?? null,
    table,
    extras,
  };
}

/**
 * Wall-clock spans between first occurrence of milestone steps (ms).
 * Null when either endpoint was never observed — not a performance gate.
 */
export function computePipelineDurations(stepTimestamps) {
  const t = (step) =>
    typeof stepTimestamps[step] === "number" ? stepTimestamps[step] : null;

  const login = t("LOGIN");
  const session = t("CANONICAL_SESSION");
  const bootstrap = t("BOOTSTRAP_START");
  const dashboard = t("DASHBOARD_RENDERED");

  const span = (a, b) => (a != null && b != null && b >= a ? b - a : null);

  return {
    login_to_session: span(login, session),
    session_to_bootstrap: span(session, bootstrap),
    bootstrap_to_dashboard: span(bootstrap, dashboard),
  };
}

/**
 * Canonical evidence envelope for regression comparison over time.
 */
export function buildPs002cEvidenceReport({
  status,
  pipeline,
  validation,
  duration_ms,
  meta = {},
}) {
  return {
    status,
    gate: "PS-002-C",
    contract: "FCR-008",
    auth: "supabase_real",
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...PS002_CANONICAL_STEPS],
    duplicates: [...(validation.duplicates ?? [])],
    missing: [...(validation.missing ?? [])],
    out_of_order: [...(validation.out_of_order ?? [])],
    firstFailure: validation.firstFailure ?? null,
    duration_ms: {
      login_to_session: duration_ms?.login_to_session ?? null,
      session_to_bootstrap: duration_ms?.session_to_bootstrap ?? null,
      bootstrap_to_dashboard: duration_ms?.bootstrap_to_dashboard ?? null,
    },
    ...meta,
  };
}

export function formatPipelineComparisonTable(result) {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(20)} | ✅ | ${row.observed ? "✅" : "⛔"} |`,
    ),
  ];
  if (result.firstFailure) {
    lines.push("", `First failure / blocked at: **${result.firstFailure}**`);
  }
  if (result.duplicates?.length) {
    lines.push(`Duplicates: ${result.duplicates.join(", ")}`);
  }
  if (result.out_of_order?.length) {
    lines.push(`Out of order: ${result.out_of_order.join(", ")}`);
  }
  if (result.extras?.length) {
    lines.push(`Extras: ${result.extras.join(", ")}`);
  }
  return lines.join("\n");
}

/** Normalize step name from console. */
export function normalizeFcr008Step(raw) {
  return raw === "HOME_PATH" ? "HOME_PATH_RESOLVED" : raw;
}

/** Extract ordered FCR-008 step names from Playwright console messages. */
export function extractFcr008Steps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(/\[FCR-008\]\s+([A-Z0-9_]+)/);
    if (m) steps.push(normalizeFcr008Step(m[1]));
  }
  return steps;
}

/**
 * Parse a console line into { step, atMs } using wall clock when the
 * Playwright handler recorded the message (preferred) or now.
 */
export function parseFcr008ConsoleEvent(text, atMs = Date.now()) {
  const m = String(text).match(/\[FCR-008\]\s+([A-Z0-9_]+)/);
  if (!m) return null;
  return { step: normalizeFcr008Step(m[1]), atMs };
}
