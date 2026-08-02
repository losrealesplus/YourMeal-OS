/**
 * RELEASE-01 · B-05 Rollback canonical pipeline validator.
 * Contract: docs/00-status/RELEASE_ROLLBACK_SPEC.md
 *
 * Certifies controlled recovery (R1–R3) of the deployed platform.
 * Evidence before Implementation — runner before R1 driver.
 * Not Deploy re-run · not a Flow · not Smoke/Cross-flow/E2E re-run.
 */

export const RELEASE_ROLLBACK_CANONICAL_STEPS = Object.freeze([
  "RELEASE_ROLLBACK_R1_STARTED",
  "RELEASE_ROLLBACK_R1_COMPLETED",
  "RELEASE_ROLLBACK_R2_STARTED",
  "RELEASE_ROLLBACK_R2_COMPLETED",
  "RELEASE_ROLLBACK_R3_STARTED",
  "RELEASE_ROLLBACK_R3_COMPLETED",
]);

/** Segment labels — rollback slices, not product domain states. */
export const RELEASE_ROLLBACK_SEGMENTS = Object.freeze({
  1: "detect_decide",
  2: "execute_rollback_restore",
  3: "post_rollback_verify",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const RELEASE_ROLLBACK_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {readonly string[]} observed
 */
export function listReleaseRollbackOutOfOrderSteps(observed) {
  const filtered = observed.filter((s) =>
    RELEASE_ROLLBACK_CANONICAL_STEPS.includes(s),
  );
  const outOfOrder = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_ROLLBACK_CANONICAL_STEPS[i]) {
      outOfOrder.push(filtered[i]);
    }
  }
  return outOfOrder;
}

/**
 * @param {readonly string[]} observed
 */
export function validateReleaseRollbackPipeline(observed) {
  const counts = new Map();
  for (const s of observed) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const table = RELEASE_ROLLBACK_CANONICAL_STEPS.map((step) => ({
    step,
    expected: true,
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missing = RELEASE_ROLLBACK_CANONICAL_STEPS.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );

  const out_of_order = listReleaseRollbackOutOfOrderSteps(observed);
  const unexpectedOrder = out_of_order.length > 0;
  const extras = observed.filter(
    (s) => !RELEASE_ROLLBACK_CANONICAL_STEPS.includes(s),
  );

  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    !unexpectedOrder &&
    extras.length === 0 &&
    observed.length === RELEASE_ROLLBACK_CANONICAL_STEPS.length;

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

/** @param {1|2|3} n */
export function releaseRollbackStepsThrough(n) {
  return RELEASE_ROLLBACK_CANONICAL_STEPS.slice(0, n * 2);
}

/**
 * Highest complete segment (1–3) in observed, or 0 if none.
 * @param {readonly string[]} observed
 */
export function certifiedThroughRollbackSegment(observed) {
  const set = new Set(observed);
  let through = 0;
  for (let n = 1; n <= 3; n++) {
    const started = `RELEASE_ROLLBACK_D${n}_STARTED`;
    const completed = `RELEASE_ROLLBACK_D${n}_COMPLETED`;
    if (set.has(started) && set.has(completed)) through = n;
    else break;
  }
  return through;
}

/**
 * Progressive evaluation for RELEASE-ROLLBACK-001..003.
 *
 * Empty pipeline (runner-only, no segment drivers): BLOCKED at R1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3 | null }} [opts]
 */
export function evaluateReleaseRollbackProgress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? releaseRollbackStepsThrough(through)
    : [...RELEASE_ROLLBACK_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) =>
    RELEASE_ROLLBACK_CANONICAL_STEPS.includes(s),
  );
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== RELEASE_ROLLBACK_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter(
    (s) => !RELEASE_ROLLBACK_CANONICAL_STEPS.includes(s),
  );
  const table = RELEASE_ROLLBACK_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughRollbackSegment(observed);
  const next_step =
    certified_through >= 3
      ? null
      : (RELEASE_ROLLBACK_CANONICAL_STEPS[certified_through * 2] ??
        "RELEASE_ROLLBACK_R1_STARTED");

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
        "Pipeline violates RELEASE_ROLLBACK_* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `RELEASE-ROLLBACK-00${through}` : "RELEASE-ROLLBACK",
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
        "RELEASE-ROLLBACK segments not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "RELEASE_ROLLBACK_R1_STARTED",
      delivery: through ? `RELEASE-ROLLBACK-00${through}` : "RELEASE-ROLLBACK",
      delivery_status: "BLOCKED",
      gate_status: "BLOCKED",
      blocked_at: "RELEASE_ROLLBACK_R1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 3
            ? `PASS through R${through} · BLOCKED at ${RELEASE_ROLLBACK_CANONICAL_STEPS[through * 2]} for full RELEASE-ROLLBACK`
            : "PASS through R3 · RELEASE-ROLLBACK FULL PASS",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 3 ? RELEASE_ROLLBACK_CANONICAL_STEPS[through * 2] : null,
        delivery: `RELEASE-ROLLBACK-00${through}`,
        delivery_status: "PASS",
        gate_status: through < 3 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 3 ? RELEASE_ROLLBACK_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery RELEASE-ROLLBACK-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `RELEASE-ROLLBACK-00${through}`,
      delivery_status: "FAIL",
      gate_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason: "PASS through R3 · RELEASE-ROLLBACK FULL PASS",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 3,
      next_step: null,
      delivery: "RELEASE-ROLLBACK",
      delivery_status: "PASS",
      gate_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through R${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: RELEASE_ROLLBACK_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: `RELEASE-ROLLBACK-00${certified_through}`,
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
    delivery: "RELEASE-ROLLBACK-001",
    delivery_status: "FAIL",
    gate_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Canonical evidence envelope.
 */
export function buildReleaseRollbackEvidenceReport({
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
    gate: "RELEASE-ROLLBACK",
    contract: "RELEASE_ROLLBACK_SPEC",
    level: "release",
    certifies: "controlled_recovery",
    complements_deploy_e2e_smoke_crossflow: true,
    principle: "Evidence before Implementation",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...RELEASE_ROLLBACK_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 3 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    gate_status: progress?.gate_status ?? status,
    terminal: {
      segment: fullPass ? RELEASE_ROLLBACK_SEGMENTS[3] : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    ...meta,
  };
}

export function formatReleaseRollbackComparisonTable(result) {
  const lines = [
    "| Paso | Esperado | Observado |",
    "| ---- | -------- | --------- |",
    ...result.table.map(
      (row) =>
        `| ${row.step.padEnd(30)} | ${row.expected ? "✅" : "·"} | ${row.observed ? "✅" : "⛔"} |`,
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
