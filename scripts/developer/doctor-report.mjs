/**
 * Developer Platform · report formatter.
 * Evidence before Implementation.
 */

/**
 * @typedef {import('./doctor-shared.mjs').DoctorResult} DoctorResult
 * @typedef {{ name: string, result: DoctorResult }} DoctorModuleReport
 */

/**
 * @param {{
 *   modules: DoctorModuleReport[],
 *   mode: string,
 *   verbose?: boolean,
 * }} input
 */
export function buildDoctorSummary(input) {
  const failed = input.modules.filter((m) => !m.result.ok).map((m) => m.name);
  const warnings = input.modules.flatMap((m) =>
    m.result.warnings.map((w) => `${m.name}: ${w}`),
  );
  const errors = input.modules.flatMap((m) =>
    m.result.errors.map((e) => `${m.name}: ${e}`),
  );
  const checkCount = input.modules.reduce(
    (n, m) => n + m.result.checks.length,
    0,
  );
  const passCount = input.modules.reduce(
    (n, m) => n + m.result.checks.filter((c) => c.ok).length,
    0,
  );
  return {
    ok: failed.length === 0,
    mode: input.mode,
    modules: input.modules.map((m) => ({
      name: m.name,
      ok: m.result.ok,
      checks: m.result.checks,
      evidence: m.result.evidence,
      warnings: m.result.warnings,
      errors: m.result.errors,
    })),
    failed,
    warnings,
    errors,
    checkCount,
    passCount,
  };
}

/**
 * @param {ReturnType<typeof buildDoctorSummary>} summary
 * @param {{ verbose?: boolean }} [opts]
 */
export function printDoctorReport(summary, opts = {}) {
  console.log("═══════════════════════════════════════════════");
  console.log("DEVELOPER PLATFORM · Doctor");
  console.log("YourMeal OS · Capability Driver · Environment integrity");
  console.log("Evidence before Implementation · Core Integrity Rule");
  console.log(`mode: ${summary.mode}`);
  console.log("═══════════════════════════════════════════════");
  console.log("");

  for (const mod of summary.modules) {
    const mark = mod.ok ? "PASS" : "FAIL";
    console.log(`── ${mod.name} · ${mark}`);
    if (opts.verbose) {
      for (const c of mod.checks) {
        console.log(`   ${c.ok ? "✓" : "✗"} ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
      }
      if (Object.keys(mod.evidence).length) {
        console.log(`   evidence=${JSON.stringify(mod.evidence)}`);
      }
    } else {
      const failed = mod.checks.filter((c) => !c.ok);
      if (failed.length) {
        for (const c of failed) {
          console.log(`   ✗ ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
        }
      } else {
        console.log(`   checks=${mod.checks.length} ok`);
      }
    }
    for (const w of mod.warnings) {
      console.log(`   warn: ${w}`);
    }
    for (const e of mod.errors) {
      console.log(`   error: ${e}`);
    }
    console.log("");
  }

  console.log("───────────────────────────────────────────────");
  console.log(
    `status=${summary.ok ? "PASS" : "FAIL"} · checks=${summary.passCount}/${summary.checkCount}`,
  );
  if (summary.failed.length) {
    console.log(`failed_modules=${JSON.stringify(summary.failed)}`);
  }
  if (summary.warnings.length && opts.verbose) {
    console.log(`warnings=${summary.warnings.length}`);
  }
  console.log("═══════════════════════════════════════════════");
}
