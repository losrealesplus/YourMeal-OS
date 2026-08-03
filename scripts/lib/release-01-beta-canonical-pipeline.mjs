/**
 * RELEASE-01 · B-06 Beta Acceptance canonical pipeline validator.
 * Contract: docs/00-status/RELEASE_01_BETA_SPEC.md
 *
 * Certifies the product-as-a-whole (B1–B5) by composing already-certified anchors.
 * Evidence before Implementation — runner before B1 driver.
 * Not a Flow · not Smoke/Cross-flow/E2E/Deploy/Rollback re-run · not FLOW-05.
 */

export const RELEASE_01_BETA_CANONICAL_STEPS = Object.freeze([
  "RELEASE_01_BETA_B1_STARTED",
  "RELEASE_01_BETA_B1_COMPLETED",
  "RELEASE_01_BETA_B2_STARTED",
  "RELEASE_01_BETA_B2_COMPLETED",
  "RELEASE_01_BETA_B3_STARTED",
  "RELEASE_01_BETA_B3_COMPLETED",
  "RELEASE_01_BETA_B4_STARTED",
  "RELEASE_01_BETA_B4_COMPLETED",
  "RELEASE_01_BETA_B5_STARTED",
  "RELEASE_01_BETA_B5_COMPLETED",
]);

/** Segment labels — beta composition slices, not product domain states. */
export const RELEASE_01_BETA_SEGMENTS = Object.freeze({
  1: "foundation",
  2: "canonical_flows",
  3: "platform_capabilities",
  4: "release_stack",
  5: "beta_acceptance",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const RELEASE_01_BETA_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {readonly string[]} observed
 */
export function listRelease01BetaOutOfOrderSteps(observed) {
  const filtered = observed.filter((s) =>
    RELEASE_01_BETA_CANONICAL_STEPS.includes(s),
  );
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_01_BETA_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

/**
 * @param {readonly string[]} observed
 */
export function validateRelease01BetaPipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = RELEASE_01_BETA_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = RELEASE_01_BETA_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listRelease01BetaOutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;
  const extras = observed.filter(
    (s) => !RELEASE_01_BETA_CANONICAL_STEPS.includes(s),
  );

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === RELEASE_01_BETA_CANONICAL_STEPS.length;

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

/** @param {1|2|3|4|5} n */
export function release01BetaStepsThrough(n) {
  return RELEASE_01_BETA_CANONICAL_STEPS.slice(0, n * 2);
}

/**
 * Highest complete segment (1–5) in observed, or 0 if none.
 * @param {readonly string[]} observed
 */
export function certifiedThroughBetaSegment(observed) {
  const set = new Set(observed);
  let through = 0;
  for (let n = 1; n <= 5; n++) {
    const started = `RELEASE_01_BETA_B${n}_STARTED`;
    const completed = `RELEASE_01_BETA_B${n}_COMPLETED`;
    if (set.has(started) && set.has(completed)) through = n;
    else break;
  }
  return through;
}

/**
 * Progressive evaluation for RELEASE-01-BETA-001..005.
 *
 * Empty pipeline (runner-only, no segment drivers): BLOCKED at B1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4|5 | null }} [opts]
 */
export function evaluateRelease01BetaProgress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? release01BetaStepsThrough(through)
    : [...RELEASE_01_BETA_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) =>
    RELEASE_01_BETA_CANONICAL_STEPS.includes(s),
  );
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_01_BETA_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter(
    (s) => !RELEASE_01_BETA_CANONICAL_STEPS.includes(s),
  );
  const table = RELEASE_01_BETA_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughBetaSegment(observed);
  const next_step =
    certified_through >= 5
      ? null
      : (RELEASE_01_BETA_CANONICAL_STEPS[certified_through * 2] ??
        "RELEASE_01_BETA_B1_STARTED");

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
        "Pipeline violates RELEASE_01_BETA_* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `RELEASE-01-BETA-00${through}` : "RELEASE-01-BETA",
      delivery_status: "FAIL",
      gate_status: "FAIL",
      blocked_at: null,
    };
  }

  if (observed.length === 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason:
        "RELEASE-01-BETA segments not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "RELEASE_01_BETA_B1_STARTED",
      delivery: through ? `RELEASE-01-BETA-00${through}` : "RELEASE-01-BETA",
      delivery_status: "BLOCKED",
      gate_status: "BLOCKED",
      blocked_at: "RELEASE_01_BETA_B1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 5
            ? `PASS through B${through} · BLOCKED at ${RELEASE_01_BETA_CANONICAL_STEPS[through * 2]} for full RELEASE-01-BETA`
            : "PASS through B5 · RELEASE-01-BETA FULL PASS",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 5 ? RELEASE_01_BETA_CANONICAL_STEPS[through * 2] : null,
        delivery: `RELEASE-01-BETA-00${through}`,
        delivery_status: "PASS",
        gate_status: through < 5 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 5 ? RELEASE_01_BETA_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery RELEASE-01-BETA-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `RELEASE-01-BETA-00${through}`,
      delivery_status: "FAIL",
      gate_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason: "PASS through B5 · RELEASE-01-BETA FULL PASS",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 5,
      next_step: null,
      delivery: "RELEASE-01-BETA",
      delivery_status: "PASS",
      gate_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through B${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: RELEASE_01_BETA_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: `RELEASE-01-BETA-00${certified_through}`,
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
    delivery: "RELEASE-01-BETA-001",
    delivery_status: "FAIL",
    gate_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Canonical evidence envelope.
 */
export function buildRelease01BetaEvidenceReport({
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
    status === "PASS" && (progress?.gate_status ?? status) === "PASS";

  return {
    status,
    reason: reason || "",
    gate: "RELEASE-01-BETA",
    contract: "RELEASE_01_BETA_SPEC",
    level: "release",
    certifies: "beta_acceptance",
    composes_track_b_pass_tags: true,
    principle: "Evidence before Implementation",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...RELEASE_01_BETA_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 5 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    gate_status: progress?.gate_status ?? status,
    terminal: {
      segment: fullPass ? RELEASE_01_BETA_SEGMENTS[5] : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    ...meta,
  };
}

export function formatRelease01BetaComparisonTable(result) {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(32)} | ${row.expected ? "✅" : "·"} | ${row.observed ? "✅" : "⛔"} |`,
    ),
  ];
  if (result.blocked_at || result.firstFailure) {
    lines.push(
      "",
      `First failure / blocked at: **${result.blocked_at ?? result.firstFailure}**`,
    );
  }
  return lines.join("\n");
}
