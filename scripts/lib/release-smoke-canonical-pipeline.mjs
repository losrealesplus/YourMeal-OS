/**
 * RELEASE-01 · B-01 Smoke canonical pipeline validator.
 * Contract: docs/00-status/RELEASE_SMOKE_SPEC.md
 *
 * Release runners certify platform capabilities — not domain entities.
 * Evidence before Implementation — runner exists before scenario drivers.
 */

export const RELEASE_SMOKE_CANONICAL_STEPS = Object.freeze([
  "RELEASE_SMOKE_S1_STARTED",
  "RELEASE_SMOKE_S1_COMPLETED",
  "RELEASE_SMOKE_S2_STARTED",
  "RELEASE_SMOKE_S2_COMPLETED",
  "RELEASE_SMOKE_S3_STARTED",
  "RELEASE_SMOKE_S3_COMPLETED",
  "RELEASE_SMOKE_S4_STARTED",
  "RELEASE_SMOKE_S4_COMPLETED",
]);

/** Capability labels (platform) — not business entity states. */
export const RELEASE_SMOKE_CAPABILITIES = Object.freeze({
  1: "preflight",
  2: "auth",
  3: "bootstrap",
  4: "dashboard",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const RELEASE_SMOKE_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {readonly string[]} observed
 */
export function listReleaseSmokeOutOfOrderSteps(observed) {
  const filtered = observed.filter((s) =>
    RELEASE_SMOKE_CANONICAL_STEPS.includes(s),
  );
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_SMOKE_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

/**
 * Validate full Smoke contract: every canonical step exactly once, in order.
 * @param {readonly string[]} observed
 */
export function validateReleaseSmokePipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = RELEASE_SMOKE_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = RELEASE_SMOKE_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listReleaseSmokeOutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;
  const extras = observed.filter(
    (s) => !RELEASE_SMOKE_CANONICAL_STEPS.includes(s),
  );

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === RELEASE_SMOKE_CANONICAL_STEPS.length;

  return {
    ok,
    observed: [...observed],
    duplicates,
    missing,
    out_of_order,
    unexpectedOrder,
    firstFailure:
      ok ? null : (missing[0] ?? duplicates[0] ?? out_of_order[0] ?? null),
    table,
    extras,
  };
}

/**
 * Diagnostic spans (ms). Not a PASS/FAIL criterion.
 * @param {Record<string, number>} stepTimestamps
 */
export function computeReleaseSmokeDurations(stepTimestamps) {
  const t = (step) =>
    typeof stepTimestamps[step] === "number" ? stepTimestamps[step] : null;
  const span = (a, b) => (a != null && b != null && b >= a ? b - a : null);

  return {
    s1_ms: span(t("RELEASE_SMOKE_S1_STARTED"), t("RELEASE_SMOKE_S1_COMPLETED")),
    s2_ms: span(t("RELEASE_SMOKE_S2_STARTED"), t("RELEASE_SMOKE_S2_COMPLETED")),
    s3_ms: span(t("RELEASE_SMOKE_S3_STARTED"), t("RELEASE_SMOKE_S3_COMPLETED")),
    s4_ms: span(t("RELEASE_SMOKE_S4_STARTED"), t("RELEASE_SMOKE_S4_COMPLETED")),
    smoke_total_ms: span(
      t("RELEASE_SMOKE_S1_STARTED"),
      t("RELEASE_SMOKE_S4_COMPLETED"),
    ),
  };
}

/**
 * Canonical evidence envelope (comparable over time).
 */
export function buildReleaseSmokeEvidenceReport({
  status,
  reason = "",
  pipeline = [],
  validation = null,
  duration_ms = null,
  code_status = "RUNNER_ONLY",
  terminal = null,
  progress = null,
  evidence = {},
  meta = {},
}) {
  const emptyValidation = {
    duplicates: [],
    missing: [],
    out_of_order: [],
    firstFailure: null,
  };
  const v = validation ?? emptyValidation;
  const fullPass =
    status === "PASS" && (progress?.gate_status ?? status) === "PASS";

  return {
    status,
    reason: reason || "",
    gate: "RELEASE-SMOKE",
    contract: "RELEASE_SMOKE_SPEC",
    level: "release",
    certifies: "platform_capabilities",
    not_domain_entities: true,
    principle: "Evidence before Implementation",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...RELEASE_SMOKE_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 4 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    gate_status: progress?.gate_status ?? status,
    terminal: terminal ?? {
      capability: fullPass ? "dashboard" : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    duration_ms: {
      s1_ms: duration_ms?.s1_ms ?? null,
      s2_ms: duration_ms?.s2_ms ?? null,
      s3_ms: duration_ms?.s3_ms ?? null,
      s4_ms: duration_ms?.s4_ms ?? null,
      smoke_total_ms: duration_ms?.smoke_total_ms ?? null,
    },
    ...meta,
  };
}

export function formatReleaseSmokeComparisonTable(result) {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(28)} | ${row.expected ? "✅" : "·"} | ${row.observed ? "✅" : "⛔"} |`,
    ),
  ];
  if (result.blocked_at || result.firstFailure) {
    lines.push(
      "",
      `First failure / blocked at: **${result.blocked_at ?? result.firstFailure}**`,
    );
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

/** Extract ordered RELEASE_SMOKE step names from console / log lines. */
export function extractReleaseSmokeSteps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(
      /\[RELEASE-SMOKE\]\s+(RELEASE_SMOKE_S[1-4]_(?:STARTED|COMPLETED))/,
    );
    if (m && RELEASE_SMOKE_CANONICAL_STEPS.includes(m[1])) steps.push(m[1]);
  }
  return steps;
}

/** @param {1|2|3|4} n */
export function releaseSmokeStepsThrough(n) {
  return RELEASE_SMOKE_CANONICAL_STEPS.slice(0, n * 2);
}

/**
 * Highest complete scenario (1–4) in observed, or 0 if none.
 * @param {readonly string[]} observed
 */
export function certifiedThroughScenario(observed) {
  const set = new Set(observed);
  let through = 0;
  for (let n = 1; n <= 4; n++) {
    const started = `RELEASE_SMOKE_S${n}_STARTED`;
    const completed = `RELEASE_SMOKE_S${n}_COMPLETED`;
    if (set.has(started) && set.has(completed)) through = n;
    else break;
  }
  return through;
}

/**
 * Progressive evaluation for incremental deliveries RELEASE-SMOKE-001..004.
 *
 * Empty pipeline (runner-only, no drivers): BLOCKED at S1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4 | null }} [opts]
 */
export function evaluateReleaseSmokeProgress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? releaseSmokeStepsThrough(through)
    : [...RELEASE_SMOKE_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) =>
    RELEASE_SMOKE_CANONICAL_STEPS.includes(s),
  );
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_SMOKE_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter(
    (s) => !RELEASE_SMOKE_CANONICAL_STEPS.includes(s),
  );
  const table = RELEASE_SMOKE_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughScenario(observed);
  const next_step =
    certified_through >= 4
      ? null
      : (RELEASE_SMOKE_CANONICAL_STEPS[certified_through * 2] ??
        "RELEASE_SMOKE_S1_STARTED");

  const base = {
    duplicates,
    missing: missingExpected,
    out_of_order,
    extras,
    table,
    certified_through,
    next_step,
  };

  if (duplicates.length || out_of_order.length || extras.length) {
    return {
      ...base,
      status: "FAIL",
      reason:
        "Pipeline violates RELEASE_SMOKE_* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `RELEASE-SMOKE-00${through}` : "RELEASE-SMOKE",
      delivery_status: "FAIL",
      gate_status: "FAIL",
      blocked_at: null,
    };
  }

  // Runner-only: no capability observations yet → BLOCKED (not FAIL)
  if (observed.length === 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason:
        "RELEASE-SMOKE scenarios not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "RELEASE_SMOKE_S1_STARTED",
      delivery: through ? `RELEASE-SMOKE-00${through}` : "RELEASE-SMOKE",
      delivery_status: "BLOCKED",
      gate_status: "BLOCKED",
      blocked_at: "RELEASE_SMOKE_S1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 4
            ? `PASS through S${through} · BLOCKED at ${RELEASE_SMOKE_CANONICAL_STEPS[through * 2]} for full RELEASE-SMOKE`
            : "PASS through S4 · RELEASE-SMOKE FULL PASS",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 4 ? RELEASE_SMOKE_CANONICAL_STEPS[through * 2] : null,
        delivery: `RELEASE-SMOKE-00${through}`,
        delivery_status: "PASS",
        gate_status: through < 4 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 4 ? RELEASE_SMOKE_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery RELEASE-SMOKE-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `RELEASE-SMOKE-00${through}`,
      delivery_status: "FAIL",
      gate_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason: "",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 4,
      next_step: null,
      delivery: "RELEASE-SMOKE",
      delivery_status: "PASS",
      gate_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through S${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: RELEASE_SMOKE_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: `RELEASE-SMOKE-00${certified_through}`,
      delivery_status: "PASS",
      gate_status: "BLOCKED",
      blocked_at: next_step,
    };
  }

  return {
    ...base,
    status: "FAIL",
    reason: `Pipeline stopped at ${missingExpected[0]}`,
    ok: false,
    firstFailure: missingExpected[0],
    delivery: "RELEASE-SMOKE-001",
    delivery_status: "FAIL",
    gate_status: "FAIL",
    blocked_at: null,
  };
}
