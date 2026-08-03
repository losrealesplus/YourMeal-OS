/**
 * MOBILE-RELEASE-01 · Distribution delivery pipeline validator.
 * Contract: docs/00-status/MOBILE_RELEASE_01_SPEC.md
 * Evidence before Implementation — runner exists before MR1…MR5 drivers.
 *
 * Certifies private mobile delivery pipeline (Internal Testing readiness),
 * not Business / Experience / Production stores.
 * Tenant-agnostic. Core SaaS → Capacitor → MOBILE-RELEASE.
 */

export const MOBILE_RELEASE_CANONICAL_STEPS = Object.freeze([
  "MOBILE_RELEASE_MR1_STARTED",
  "MOBILE_RELEASE_MR1_COMPLETED",
  "MOBILE_RELEASE_MR2_STARTED",
  "MOBILE_RELEASE_MR2_COMPLETED",
  "MOBILE_RELEASE_MR3_STARTED",
  "MOBILE_RELEASE_MR3_COMPLETED",
  "MOBILE_RELEASE_MR4_STARTED",
  "MOBILE_RELEASE_MR4_COMPLETED",
  "MOBILE_RELEASE_MR5_STARTED",
  "MOBILE_RELEASE_MR5_COMPLETED",
]);

/** Segment labels — Spec §2. */
export const MOBILE_RELEASE_SEGMENTS = Object.freeze({
  1: "preparation",
  2: "android_build",
  3: "android_signing",
  4: "ios_archive",
  5: "internal_testing_acceptance",
});

/** Exit codes: PASS=0 · FAIL=1 · BLOCKED=2 */
export const MOBILE_RELEASE_EXIT = Object.freeze({
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
});

/**
 * @param {1|2|3|4|5} through
 */
export function mobileReleaseStepsThrough(through) {
  const n = Math.max(0, Math.min(5, through)) * 2;
  return MOBILE_RELEASE_CANONICAL_STEPS.slice(0, n);
}

/**
 * @param {readonly string[]} observed
 */
export function certifiedThroughMobileReleaseBlock(observed) {
  let through = 0;
  for (let m = 1; m <= 5; m++) {
    const started = `MOBILE_RELEASE_MR${m}_STARTED`;
    const completed = `MOBILE_RELEASE_MR${m}_COMPLETED`;
    if (observed.includes(started) && observed.includes(completed)) {
      through = m;
    } else {
      break;
    }
  }
  return through;
}

/**
 * Progressive evaluation for MR01-001..005.
 *
 * Empty pipeline (runner-only, no block drivers): BLOCKED at MR1 with
 * duplicates/missing/out_of_order = [] (not FAIL — implementation pending).
 *
 * @param {readonly string[]} observed
 * @param {{ through?: 1|2|3|4|5 | null }} [opts]
 */
export function evaluateMobileReleaseProgress(observed, opts = {}) {
  const through = opts.through ?? null;
  const expected = through
    ? mobileReleaseStepsThrough(through)
    : [...MOBILE_RELEASE_CANONICAL_STEPS];

  const counts = new Map();
  for (const s of observed) counts.set(s, (counts.get(s) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([s]) => s);

  const filtered = observed.filter((s) =>
    MOBILE_RELEASE_CANONICAL_STEPS.includes(s),
  );
  const out_of_order = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== MOBILE_RELEASE_CANONICAL_STEPS[i]) {
      out_of_order.push(filtered[i]);
    }
  }

  const extras = observed.filter(
    (s) => !MOBILE_RELEASE_CANONICAL_STEPS.includes(s),
  );
  const table = MOBILE_RELEASE_CANONICAL_STEPS.map((step) => ({
    step,
    expected: expected.includes(step),
    observed: (counts.get(step) ?? 0) === 1,
  }));

  const missingExpected = expected.filter(
    (step) => (counts.get(step) ?? 0) !== 1,
  );
  const certified_through = certifiedThroughMobileReleaseBlock(observed);
  const next_step =
    certified_through >= 5
      ? null
      : (MOBILE_RELEASE_CANONICAL_STEPS[certified_through * 2] ??
        "MOBILE_RELEASE_MR1_STARTED");

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
        "Pipeline violates MOBILE_RELEASE_MR* contract (duplicate / order / extras)",
      ok: false,
      firstFailure: duplicates[0] ?? out_of_order[0] ?? extras[0] ?? null,
      delivery: through ? `MR01-00${through}` : "MOBILE-RELEASE",
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
        "Mobile Release blocks not implemented (runner ready; Evidence before Implementation)",
      ok: false,
      missing: [],
      firstFailure: "MOBILE_RELEASE_MR1_STARTED",
      delivery: through ? `MR01-00${through}` : "MOBILE-RELEASE",
      delivery_status: "BLOCKED",
      domain_status: "BLOCKED",
      blocked_at: "MOBILE_RELEASE_MR1_STARTED",
    };
  }

  if (through) {
    if (missingExpected.length === 0) {
      return {
        ...base,
        status: "PASS",
        reason:
          through < 5
            ? `PASS through MR${through} · BLOCKED at ${MOBILE_RELEASE_CANONICAL_STEPS[through * 2]} for full MOBILE-RELEASE`
            : "PASS through MR5 · MOBILE-RELEASE FULL PASS · Ready for Internal Testing",
        ok: true,
        missing: [],
        firstFailure: null,
        certified_through: through,
        next_step:
          through < 5 ? MOBILE_RELEASE_CANONICAL_STEPS[through * 2] : null,
        delivery: `MR01-00${through}`,
        delivery_status: "PASS",
        domain_status: through < 5 ? "BLOCKED" : "PASS",
        blocked_at:
          through < 5 ? MOBILE_RELEASE_CANONICAL_STEPS[through * 2] : null,
      };
    }
    return {
      ...base,
      status: "FAIL",
      reason: `Delivery MR01-00${through} incomplete · missing ${missingExpected[0]}`,
      ok: false,
      firstFailure: missingExpected[0],
      delivery: `MR01-00${through}`,
      delivery_status: "FAIL",
      domain_status: "FAIL",
      blocked_at: null,
    };
  }

  if (missingExpected.length === 0) {
    return {
      ...base,
      status: "PASS",
      reason:
        "PASS through MR5 · MOBILE-RELEASE FULL PASS · Ready for Internal Testing",
      ok: true,
      missing: [],
      firstFailure: null,
      certified_through: 5,
      next_step: null,
      delivery: "MOBILE-RELEASE",
      delivery_status: "PASS",
      domain_status: "PASS",
      blocked_at: null,
    };
  }

  if (certified_through > 0) {
    return {
      ...base,
      status: "BLOCKED",
      reason: `PASS through MR${certified_through} · BLOCKED at ${next_step}`,
      ok: false,
      missing: MOBILE_RELEASE_CANONICAL_STEPS.filter(
        (s) => (counts.get(s) ?? 0) !== 1,
      ),
      firstFailure: next_step,
      delivery: "MOBILE-RELEASE",
      delivery_status: "BLOCKED",
      domain_status: "BLOCKED",
      blocked_at: next_step,
    };
  }

  return {
    ...base,
    status: "FAIL",
    reason: `Incomplete Mobile Release pipeline · missing ${missingExpected[0]}`,
    ok: false,
    firstFailure: missingExpected[0],
    delivery: "MOBILE-RELEASE",
    delivery_status: "FAIL",
    domain_status: "FAIL",
    blocked_at: null,
  };
}

/**
 * Full-contract validation (self-test / COMPLETE pipeline).
 * @param {readonly string[]} observed
 */
export function validateMobileReleasePipeline(observed) {
  const progress = evaluateMobileReleaseProgress(observed, { through: null });
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
export function buildMobileReleaseEvidenceReport({
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
    gate: "MOBILE-RELEASE",
    contract: "MOBILE_RELEASE_01_SPEC",
    level: "distribution",
    certifies: "private_mobile_delivery_pipeline",
    tenant_agnostic: true,
    core_integrity: true,
    principle: "Evidence before Implementation",
    architecture: "Core SaaS → Capacitor → MOBILE-RELEASE → Internal Testing",
    code_status,
    at: new Date().toISOString(),
    pipeline: [...pipeline],
    expected: [...MOBILE_RELEASE_CANONICAL_STEPS],
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
      segment: fullPass ? MOBILE_RELEASE_SEGMENTS[5] : null,
    },
    evidence: evidence && typeof evidence === "object" ? { ...evidence } : {},
    ...meta,
  };
}

export function formatMobileReleaseComparisonTable(result) {
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

/** Extract ordered MOBILE_RELEASE step names from console / log lines. */
export function extractMobileReleaseSteps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    const m = text.match(
      /\[MOBILE-RELEASE\]\s+(MOBILE_RELEASE_MR[1-5]_(?:STARTED|COMPLETED))/,
    );
    if (m && MOBILE_RELEASE_CANONICAL_STEPS.includes(m[1])) steps.push(m[1]);
  }
  return steps;
}
