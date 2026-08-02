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
  meta = {},
}) {
  const emptyValidation = {
    duplicates: [],
    missing: [],
    out_of_order: [],
    firstFailure: null,
  };
  const v = validation ?? emptyValidation;

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
    terminal: terminal ?? {
      order_status: status === "PASS" ? "delivered" : null,
      packaging_batch: status === "PASS" ? "CLOSED" : null,
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
        `| ${row.step.padEnd(22)} | ✅ | ${row.observed ? "✅" : "⛔"} |`,
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

/** Extract ordered FLOW-01 step names from console / log lines. */
export function extractFlow01Steps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(/\[FLOW-01\]\s+(FLOW01_[A-Z0-9_]+)/);
    if (m) steps.push(m[1]);
  }
  return steps;
}

/**
 * Classify runner outcome.
 * - PASS: contract satisfied
 * - FAIL: pipeline observed but broken
 * - BLOCKED: domain driver not wired / external preconditions
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
