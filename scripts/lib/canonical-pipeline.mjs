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

  const filtered = observed.filter((s) => PS002_CANONICAL_STEPS.includes(s));
  let unexpectedOrder = false;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== PS002_CANONICAL_STEPS[i]) {
      unexpectedOrder = true;
      break;
    }
  }

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
    unexpectedOrder,
    firstFailure: ok ? null : missing[0] ?? duplicates[0] ?? null,
    table,
    extras,
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
  if (result.extras?.length) {
    lines.push(`Extras: ${result.extras.join(", ")}`);
  }
  return lines.join("\n");
}

/** Extract ordered FCR-008 step names from Playwright console messages. */
export function extractFcr008Steps(consoleLines) {
  const steps = [];
  for (const line of consoleLines) {
    const text = typeof line === "string" ? line : String(line);
    // Formats: "[FCR-008] LOGIN {...}" or "LOGIN" after prefix strip
    const m = text.match(/\[FCR-008\]\s+([A-Z0-9_]+)/);
    if (m) steps.push(m[1] === "HOME_PATH" ? "HOME_PATH_RESOLVED" : m[1]);
  }
  return steps;
}
