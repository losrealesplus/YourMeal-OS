/**
 * Capacitor · Distribution canonical pipeline validator.
 * Contract: docs/00-status/CAPACITOR_SPEC.md
 * Evidence before Implementation — runner exists before shell / platform drivers.
 *
 * Certifies Distribution (native shell · reproducible builds), not Business.
 * Tenant-agnostic. Core SaaS → Capacitor → Android / iOS.
 */

export const CAPACITOR_CANONICAL_STEPS = Object.freeze([
  "CAPACITOR_C1_STARTED",
  "CAPACITOR_C1_COMPLETED",
  "CAPACITOR_C2_STARTED",
  "CAPACITOR_C2_COMPLETED",
  "CAPACITOR_C3_STARTED",
  "CAPACITOR_C3_COMPLETED",
  "CAPACITOR_C4_STARTED",
  "CAPACITOR_C4_COMPLETED",
  "CAPACITOR_C5_STARTED",
  "CAPACITOR_C5_COMPLETED",
]);

/** Segment labels — Distribution blocks (Spec §2). */
export const CAPACITOR_SEGMENTS = Object.freeze({
  1: "platform_preparation",
  2: "native_shell",
  3: "android_build",
  4: "ios_build",
  5: "acceptance",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const CAPACITOR_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {1|2|3|4|5} through
 */
export function capacitorStepsThrough(through) {
  const n = Math.max(0, Math.min(5, through)) * 2;
  return CAPACITOR_CANONICAL_STEPS.slice(0, n);
}

/**
 * @param {readonly string[]} observed
 */
export function certifiedThroughCapacitorBlock(observed) {
  let through = 0;
  for (let c = 1; c <= 5; c++) {
    const started = `CAPACITOR_C${c}_STARTED`;
    const completed = `CAPACITOR_C${c}_COMPLETED`;
    if (observed.includes(started) && observed.includes(completed)) {
      through = c;
    } else {
      break;
    }
  }
  return through;
}

/**
 * Progressive evaluation for CAPACITOR-001..005.
 *
 * Empty pipeline (runner-only, no block drivers): BLOCKED at C1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4|5 | null }} [opts]
 */
export function evaluateCapacitorProgress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? capacitorStepsThrough(through)
    : [...CAPACITOR_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) => CAPACITOR_CANONICAL_STEPS.includes(s));
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== CAPACITOR_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter((s) => !CAPACITOR_CANONICAL_STEPS.includes(s));
  const table = CAPACITOR_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughCapacitorBlock(observed);
  const next_step =
    certified_through >= 5
      ? null
      : (CAPACITOR_CANONICAL_STEPS[certified_through * 2] ??
        "CAPACITOR_C1_STARTED");

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
        "Pipeline violates CAPACITOR_C* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `CAPACITOR-00${through}` : "CAPACITOR",
      delivery_status: "FAIL",
      domain_status: "FAIL",
      blocked_at: null,
    };
  }

  if (observed.length === 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason:
        "Capacitor Distribution blocks not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "CAPACITOR_C1_STARTED",
      delivery: through ? `CAPACITOR-00${through}` : "CAPACITOR",
      delivery_status: "BLOCKED",
      domain_status: "BLOCKED",
      blocked_at: "CAPACITOR_C1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 5
            ? `PASS through C${through} · BLOCKED at ${CAPACITOR_CANONICAL_STEPS[through * 2]} for full CAPACITOR`
            : "PASS through C5 · CAPACITOR FULL PASS · Distribution Certified",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 5 ? CAPACITOR_CANONICAL_STEPS[through * 2] : null,
        delivery: `CAPACITOR-00${through}`,
        delivery_status: "PASS",
        domain_status: through < 5 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 5 ? CAPACITOR_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery CAPACITOR-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `CAPACITOR-00${through}`,
      delivery_status: "FAIL",
      domain_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason: "PASS through C5 · CAPACITOR FULL PASS · Distribution Certified",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 5,
      next_step: null,
      delivery: "CAPACITOR",
      delivery_status: "PASS",
      domain_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through C${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: CAPACITOR_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: "CAPACITOR",
      delivery_status: "BLOCKED",
      domain_status: "BLOCKED",
      blocked_at: next_step,
    };
  }

  return {
    ...base,
    status: "FAIL",
    reason: `Incomplete Capacitor pipeline · missing ${missingExpected[0]}`,
    ok: false,
    firstFailure: missingExpected[0],
    delivery: "CAPACITOR",
    delivery_status: "FAIL",
    domain_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Full-contract validation (self-test / COMPLETE pipeline).
 * @param {readonly string[]} observed
 */
export function validateCapacitorPipeline(observed) {
  const progress = evaluateCapacitorProgress(observed, { through: null });
  return {
    ok: progress.status === "PASS",
    status: progress.status,
    duplicates: progress.duplicates,
    missing: progress.missing,
    out_of_order: progress.out_of_order,
    table: progress.table,
    firstFailure: progress.firstFailure,
    blocked_at: progress.blocked_at,
  };
}

/**
 * Canonical evidence envelope.
 */
export function buildCapacitorEvidenceReport({
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
    status === "PASS" && (progress?.domain_status ?? status) === "PASS";

  return {
    status,
    reason: reason || "",
    gate: "CAPACITOR",
    contract: "CAPACITOR_SPEC",
    level: "distribution",
    certifies: "native_shell_reproducible_builds",
    tenant_agnostic: true,
    core_integrity: true,
    principle: "Evidence before Implementation",
    architecture: "Core SaaS → Capacitor → Android / iOS",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...CAPACITOR_CANONICAL_STEPS],
    duplicates: [...(v.duplicates ?? [])],
    missing: [...(v.missing ?? [])],
    out_of_order: [...(v.out_of_order ?? [])],
    firstFailure: v.firstFailure ?? null,
    certified_through: progress?.certified_through ?? (fullPass ? 5 : 0),
    blocked_at: progress?.blocked_at ?? null,
    delivery: progress?.delivery ?? null,
    delivery_status: progress?.delivery_status ?? null,
    domain_status: progress?.domain_status ?? status,
    terminal: {
      segment: fullPass ? CAPACITOR_SEGMENTS[5] : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    ...meta,
  };
}

export function formatCapacitorComparisonTable(result) {
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

/** Extract ordered CAPACITOR step names from console / log lines. */
export function extractCapacitorSteps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(
      /\[CAPACITOR\]\s+(CAPACITOR_C[1-5]_(?:STARTED|COMPLETED))/,
    );
    if (m && CAPACITOR_CANONICAL_STEPS.includes(m[1])) steps.push(m[1]);
  }
  return steps;
}
