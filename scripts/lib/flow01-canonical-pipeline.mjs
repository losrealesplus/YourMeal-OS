/**
 * FLOW-01 canonical pipeline validator (Kitchen → Delivery).
 * Contract frozen in docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md.
 * Evidence before Implementation — runner exists before domain code.
 */

export const FLOW01_CANONICAL_STEPS = Object.freeze([
  "FLOW01_T1_STARTED",
  "FLOW01_T1_COMPLETED",
  "FLOW01_T2_STARTED",
  "FLOW01_T2_COMPLETED",
  "FLOW01_T3_STARTED",
  "FLOW01_T3_COMPLETED",
  "FLOW01_T4_STARTED",
  "FLOW01_T4_COMPLETED",
]);

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const FLOW01_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {readonly string[]} observed
 */
export function listFlow01OutOfOrderSteps(observed) {
  const filtered = observed.filter((s) => FLOW01_CANONICAL_STEPS.includes(s));
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== FLOW01_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

/**
 * Validate FLOW-01 contract: every canonical step exactly once, in order.
 * @param {readonly string[]} observed
 */
export function validateFlow01Pipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = FLOW01_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = FLOW01_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listFlow01OutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;

  const extras = observed.filter((s) => !FLOW01_CANONICAL_STEPS.includes(s));

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === FLOW01_CANONICAL_STEPS.length;

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
export function computeFlow01Durations(stepTimestamps) {
  const t = (step) =>
    typeof stepTimestamps[step] === "number" ? stepTimestamps[step] : null;
  const span = (a, b) => (a != null && b != null && b >= a ? b - a : null);

  return {
    t1_ms: span(t("FLOW01_T1_STARTED"), t("FLOW01_T1_COMPLETED")),
    t2_ms: span(t("FLOW01_T2_STARTED"), t("FLOW01_T2_COMPLETED")),
    t3_ms: span(t("FLOW01_T3_STARTED"), t("FLOW01_T3_COMPLETED")),
    t4_ms: span(t("FLOW01_T4_STARTED"), t("FLOW01_T4_COMPLETED")),
    flow_total_ms: span(t("FLOW01_T1_STARTED"), t("FLOW01_T4_COMPLETED")),
  };
}

/**
 * Canonical evidence envelope (comparable over time).
 */
export function buildFlow01EvidenceReport({
  status,
  reason = "",
  pipeline = [],
  validation = null,
  duration_ms = null,
  code_status = "RUNNER_ONLY",
  terminal = null,
  progress = null,
  meta = {},
}) {
  const emptyValidation = {
    duplicates: [],
    missing: [],
    out_of_order: [],
    firstFailure: null,
  };
  const v = validation ?? emptyValidation;
  const fullPass = status === "PASS" && (progress?.flow_status ?? status) === "PASS";

  return {
    status,
    reason: reason || "",
    gate: "FLOW-01",
    contract: "FLOW_01_KITCHEN_DELIVERY_SPEC",
    principle: "Evidence before Implementation",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...FLOW01_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 4 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    flow_status: progress?.flow_status ?? status,
    terminal: terminal ?? {
      order_status: fullPass ? "delivered" : null,
      packaging_batch: fullPass ? "CLOSED" : null,
    },
    duration_ms: {
      t1_ms: duration_ms?.t1_ms ?? null,
      t2_ms: duration_ms?.t2_ms ?? null,
      t3_ms: duration_ms?.t3_ms ?? null,
      t4_ms: duration_ms?.t4_ms ?? null,
      flow_total_ms: duration_ms?.flow_total_ms ?? null,
    },
    ...meta,
  };
}

export function formatFlow01ComparisonTable(result) {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(22)} | ${row.expected ? "✅" : "·"} | ${row.observed ? "✅" : "⛔"} |`,
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

/** Extract ordered FLOW-01 step names from console / log lines (canonical only). */
export function extractFlow01Steps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(/\[FLOW-01\]\s+(FLOW01_T[1-4]_(?:STARTED|COMPLETED))/);
    if (m && FLOW01_CANONICAL_STEPS.includes(m[1])) steps.push(m[1]);
  }
  return steps;
}

/** @param {1|2|3|4} n */
export function flow01StepsThrough(n) {
  return FLOW01_CANONICAL_STEPS.slice(0, n * 2);
}

/**
 * Highest complete transition (1–4) in observed, or 0 if none.
 * Requires contiguous COMPLETED pairs from T1 without gaps.
 * @param {readonly string[]} observed
 */
export function certifiedThroughTransition(observed) {
  const set = new Set(observed);
  let through = 0;
  for (let n = 1; n <= 4; n++) {
    const started = `FLOW01_T${n}_STARTED`;
    const completed = `FLOW01_T${n}_COMPLETED`;
    if (set.has(started) && set.has(completed)) through = n;
    else break;
  }
  return through;
}

/**
 * Progressive evaluation for incremental deliveries FLOW01-001..004.
 *
 * - FAIL: duplicates / out-of-order / extras / scoped delivery incomplete
 * - PASS: full contract, or `--through=Tn` prefix complete (delivery PASS)
 * - BLOCKED: no impl yet, or clean prefix with later transitions pending
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4 | null }} [opts]
 */
export function evaluateFlow01Progress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? flow01StepsThrough(through)
    : [...FLOW01_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) => FLOW01_CANONICAL_STEPS.includes(s));
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== FLOW01_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter((s) => !FLOW01_CANONICAL_STEPS.includes(s));
  const table = FLOW01_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughTransition(observed);
  const next_step =
    certified_through >= 4
      ? null
      : (FLOW01_CANONICAL_STEPS[certified_through * 2] ?? "FLOW01_T1_STARTED");

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
      reason: "Pipeline violates FLOW01_* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `FLOW01-00${through}` : "FLOW-01",
      delivery_status: "FAIL",
      flow_status: "FAIL",
      blocked_at: null,
    };
  }

  if (observed.length === 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason:
        "FLOW-01 domain driver not wired (runner ready; implementation pending)",
      ok: false,
      missing: [...expected],
      firstFailure: expected[0],
      delivery: through ? `FLOW01-00${through}` : "FLOW-01",
      delivery_status: "BLOCKED",
      flow_status: "BLOCKED",
      blocked_at: expected[0],
    };
  }

  // Scoped delivery (FLOW01-00n): require exact prefix
  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 4
            ? `PASS through T${through} · BLOCKED at ${FLOW01_CANONICAL_STEPS[through * 2]} for full FLOW-01`
            : "FLOW-01 complete",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 4 ? FLOW01_CANONICAL_STEPS[through * 2] : null,
        delivery: `FLOW01-00${through}`,
        delivery_status: "PASS",
        flow_status: through < 4 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 4 ? FLOW01_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery FLOW01-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `FLOW01-00${through}`,
      delivery_status: "FAIL",
      flow_status: "FAIL",
      blocked_at: null,
    };
  }

  // Full FLOW-01
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
      delivery: "FLOW-01",
      delivery_status: "PASS",
      flow_status: "PASS",
      blocked_at: null,
    };
  }

  // Clean progressive progress: later steps missing → BLOCKED (not FAIL)
  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through T${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: FLOW01_CANONICAL_STEPS.filter((s) => (counts.get(s) ?? 0) !== 1),
      firstFailure: next_step,
      delivery: `FLOW01-00${certified_through}`,
      delivery_status: "PASS",
      flow_status: "BLOCKED",
      blocked_at: next_step,
    };
  }

  // Started but T1 not completed → FAIL (implementation breached T1)
  return {
    ...base,
    status: "FAIL",
    reason: `Pipeline stopped at ${missingExpected[0]}`,
    ok: false,
    firstFailure: missingExpected[0],
    delivery: "FLOW01-001",
    delivery_status: "FAIL",
    flow_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Classify runner outcome.
 * - PASS: contract satisfied
 * - FAIL: pipeline observed but broken
 * - BLOCKED: domain driver not wired / later transition not implemented
 */
export function classifyFlow01Outcome({
  mode,
  validationOk,
  pipelineStarted,
  domainDriverReady,
  reason = "",
}) {
  if (mode === "self-test" && validationOk) {
    return { status: "PASS", reason: "Contract self-test", stop: null };
  }
  if (mode === "live" && !domainDriverReady) {
    return {
      status: "BLOCKED",
      reason:
        reason ||
        "FLOW-01 domain driver not wired (runner ready; implementation pending)",
      stop: null,
    };
  }
  if (validationOk) {
    return { status: "PASS", reason: "", stop: null };
  }
  if (!pipelineStarted) {
    return {
      status: "BLOCKED",
      reason: reason || "Pipeline never started",
      stop: null,
    };
  }
  return {
    status: "FAIL",
    reason: reason || "Pipeline incomplete or out of contract",
    stop: "FLOW01_T1_STARTED",
  };
}
