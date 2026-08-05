/**
 * Development Environment runner — orchestrates Capability Drivers.
 * HOUSEKEEPING-002 · DEVELOPER-PLATFORM-INFRA-001
 */
import { runAdbDriver } from "./adb-driver.mjs";
import { runAndroidSdkDriver } from "./android-sdk-driver.mjs";
import { runCapacitorDriver } from "./capacitor-driver.mjs";
import { runEnvironmentDriver } from "./environment-driver.mjs";
import { runGitDriver } from "./git-driver.mjs";
import { runGradleDriver } from "./gradle-driver.mjs";
import { runJavaDriver } from "./java-driver.mjs";
import { runNodeDriver } from "./node-driver.mjs";
import { runNpmDriver } from "./npm-driver.mjs";

export const DEVELOPMENT_DRIVERS = [
  { id: "java", run: runJavaDriver },
  { id: "android-sdk", run: runAndroidSdkDriver },
  { id: "adb", run: runAdbDriver },
  { id: "gradle", run: runGradleDriver },
  { id: "node", run: runNodeDriver },
  { id: "npm", run: runNpmDriver },
  { id: "capacitor", run: runCapacitorDriver },
  { id: "git", run: runGitDriver },
  { id: "environment", run: runEnvironmentDriver },
];

/**
 * @param {import('./shared.mjs').DriverContext} [ctx]
 */
export function runDevelopmentEnvironment(ctx = {}) {
  /** @type {import('./shared.mjs').DriverResult[]} */
  const drivers = [];
  for (const d of DEVELOPMENT_DRIVERS) {
    drivers.push(d.run(ctx));
  }

  const errors = drivers.filter((d) => d.status === "ERROR");
  const warnings = drivers.filter((d) => d.status === "WARNING");
  const ready = errors.length === 0;

  return {
    ok: ready,
    ready,
    version: "1.0.0",
    track: "HOUSEKEEPING-002",
    drivers,
    errorCount: errors.length,
    warningCount: warnings.length,
    summaryLine: ready
      ? "✅ Development Environment Ready"
      : "❌ Development Environment Not Ready",
  };
}

/**
 * Map driver suite → legacy DoctorResult shape (compat with scripts/developer).
 * @param {ReturnType<typeof runDevelopmentEnvironment>} report
 */
export function toDoctorResult(report) {
  /** @type {import('../developer/doctor-shared.mjs').DoctorResult} */
  const result = {
    ok: report.ok,
    checks: report.drivers.map((d) => ({
      id: d.id,
      ok: d.status !== "ERROR",
      detail: `${d.status} — ${d.message}`,
    })),
    evidence: {
      developmentEnvironment: true,
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      drivers: report.drivers.map((d) => ({
        id: d.id,
        status: d.status,
        message: d.message,
        evidence: d.evidence,
        recommendations: d.recommendations,
        recoveryHints: d.recoveryHints,
      })),
    },
    warnings: report.drivers
      .filter((d) => d.status === "WARNING")
      .map((d) => `${d.name}: ${d.message}`),
    errors: report.drivers
      .filter((d) => d.status === "ERROR")
      .map((d) => `${d.name}: ${d.message}`),
  };
  return result;
}

/**
 * @param {ReturnType<typeof runDevelopmentEnvironment>} report
 * @param {{ verbose?: boolean }} [opts]
 */
export function printDevelopmentReport(report, opts = {}) {
  console.log("═══════════════════════════════════════════════");
  console.log("DEVELOPMENT ENVIRONMENT");
  console.log("Developer Platform · Capability Drivers · FOPEBA");
  console.log("Never auto-recover — Evidence + Recommendation + Hint");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("Development Environment");
  console.log("");

  const pad = Math.max(...report.drivers.map((d) => d.name.length));
  for (const d of report.drivers) {
    const dots = ".".repeat(Math.max(2, pad + 2 - d.name.length));
    console.log(`${d.name} ${dots} ${d.status}`);
    if (opts.verbose || d.status !== "PASS") {
      console.log(`   ${d.message}`);
      for (const r of d.recommendations) console.log(`   → ${r}`);
      for (const h of d.recoveryHints) console.log(`   $ ${h}`);
    }
  }

  console.log("");
  console.log(report.summaryLine);
  if (!report.ready) {
    console.log("");
    console.log("Fix ERROR items above, then re-run: npm run doctor:env");
  }
}

/**
 * @param {string[]} argv
 */
export function main(argv = process.argv.slice(2)) {
  const json = argv.includes("--json");
  const verbose = argv.includes("--verbose") || argv.includes("-v");
  const ci = argv.includes("--ci");
  const report = runDevelopmentEnvironment({
    ci,
    probeGradle: !ci,
    skipCapDoctor: ci,
  });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printDevelopmentReport(report, { verbose });
  }
  return report.ready ? 0 : 1;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("/scripts/development/index.mjs") ||
    process.argv[1].endsWith("\\scripts\\development\\index.mjs"));

if (isDirect) {
  process.exit(main());
}
