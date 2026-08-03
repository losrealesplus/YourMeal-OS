/**
 * FLOW-05 canonical pipeline validator (Customer Experience Lifecycle).
 * Contract frozen in docs/00-status/FLOW_05_SPEC.md.
 * Evidence before Implementation — runner exists before domain / block drivers.
 *
 * FLOW-05 certifies a full customer journey (B1–B8), not modules.
 * Tenant-agnostic: EatClean is the first implementation, not the contract.
 */

export const FLOW05_CANONICAL_STEPS = Object.freeze([
  "FLOW05_B1_STARTED",
  "FLOW05_B1_COMPLETED",
  "FLOW05_B2_STARTED",
  "FLOW05_B2_COMPLETED",
  "FLOW05_B3_STARTED",
  "FLOW05_B3_COMPLETED",
  "FLOW05_B4_STARTED",
  "FLOW05_B4_COMPLETED",
  "FLOW05_B5_STARTED",
  "FLOW05_B5_COMPLETED",
  "FLOW05_B6_STARTED",
  "FLOW05_B6_COMPLETED",
  "FLOW05_B7_STARTED",
  "FLOW05_B7_COMPLETED",
  "FLOW05_B8_STARTED",
  "FLOW05_B8_COMPLETED",
]);

/** Segment labels — customer journey blocks (Spec §2). */
export const FLOW05_SEGMENTS = Object.freeze({
  1: "registration",
  2: "authentication",
  3: "order_creation",
  4: "production",
  5: "route_planning",
  6: "delivery",
  7: "delivery_confirmation",
  8: "history",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const FLOW05_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {readonly string[]} observed
 */
export function listFlow05OutOfOrderSteps(observed) {
  const filtered = observed.filter((s) => FLOW05_CANONICAL_STEPS.includes(s));
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== FLOW05_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

/**
 * Validate FLOW-05 contract: every canonical step exactly once, in order.
 * @param {readonly string[]} observed
 */
export function validateFlow05Pipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = FLOW05_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = FLOW05_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listFlow05OutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;
  const extras = observed.filter((s) => !FLOW05_CANONICAL_STEPS.includes(s));

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === FLOW05_CANONICAL_STEPS.length;

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

/** @param {1|2|3|4|5|6|7|8} n */
export function flow05StepsThrough(n) {
  return FLOW05_CANONICAL_STEPS.slice(0, n * 2);
}

/**
 * Highest complete block (1–8) in observed, or 0 if none.
 * @param {readonly string[]} observed
 */
export function certifiedThroughFlow05Block(observed) {
  const set = new Set(observed);
  let through = 0;
  for (let n = 1; n <= 8; n++) {
    const started = `FLOW05_B${n}_STARTED`;
    const completed = `FLOW05_B${n}_COMPLETED`;
    if (set.has(started) && set.has(completed)) through = n;
    else break;
  }
  return through;
}

/**
 * Progressive evaluation for FLOW05-001..008.
 *
 * Empty pipeline (runner-only, no block drivers): BLOCKED at B1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4|5|6|7|8 | null }} [opts]
 */
export function evaluateFlow05Progress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? flow05StepsThrough(through)
    : [...FLOW05_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) => FLOW05_CANONICAL_STEPS.includes(s));
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== FLOW05_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter((s) => !FLOW05_CANONICAL_STEPS.includes(s));
  const table = FLOW05_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughFlow05Block(observed);
  const next_step =
    certified_through >= 8
      ? null
      : (FLOW05_CANONICAL_STEPS[certified_through * 2] ?? "FLOW05_B1_STARTED");

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
      reason: "Pipeline violates FLOW05_* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `FLOW05-00${through}` : "FLOW-05",
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
        "FLOW-05 customer journey blocks not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "FLOW05_B1_STARTED",
      delivery: through ? `FLOW05-00${through}` : "FLOW-05",
      delivery_status: "BLOCKED",
      flow_status: "BLOCKED",
      blocked_at: "FLOW05_B1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 8
            ? `PASS through B${through} · BLOCKED at ${FLOW05_CANONICAL_STEPS[through * 2]} for full FLOW-05`
            : "PASS through B8 · FLOW-05 FULL PASS",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 8 ? FLOW05_CANONICAL_STEPS[through * 2] : null,
        delivery: `FLOW05-00${through}`,
        delivery_status: "PASS",
        flow_status: through < 8 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 8 ? FLOW05_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery FLOW05-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `FLOW05-00${through}`,
      delivery_status: "FAIL",
      flow_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason: "PASS through B8 · FLOW-05 FULL PASS",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 8,
      next_step: null,
      delivery: "FLOW-05",
      delivery_status: "PASS",
      flow_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through B${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: FLOW05_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: `FLOW05-00${certified_through}`,
      delivery_status: "PASS",
      flow_status: "BLOCKED",
      blocked_at: next_step,
    };
  }

  return {
    ...base,
    status: "FAIL",
    reason: `Pipeline stopped at ${missingExpected[0]}`,
    ok: false,
    firstFailure: missingExpected[0],
    delivery: "FLOW05-001",
    delivery_status: "FAIL",
    flow_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Canonical evidence envelope.
 */
export function buildFlow05EvidenceReport({
  status,
  reason = "",
  pipeline = [],
  validation = null,
  code_status = "RUNNER_ONLY",
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
    status === "PASS" && (progress?.flow_status ?? status) === "PASS";

  return {
    status,
    reason: reason || "",
    gate: "FLOW-05",
    contract: "FLOW_05_SPEC",
    level: "flow",
    certifies: "customer_experience_lifecycle",
    tenant_agnostic: true,
    principle: "Evidence before Implementation",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...FLOW05_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 8 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    flow_status: progress?.flow_status ?? status,
    terminal: {
      segment: fullPass ? FLOW05_SEGMENTS[8] : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    ...meta,
  };
}

export function formatFlow05ComparisonTable(result) {
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

/** Extract ordered FLOW-05 step names from console / log lines. */
export function extractFlow05Steps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(
      /\[FLOW-05\]\s+(FLOW05_B[1-8]_(?:STARTED|COMPLETED))/,
    );
    if (m && FLOW05_CANONICAL_STEPS.includes(m[1])) steps.push(m[1]);
  }
  return steps;
}
