/**
 * Developer Platform · Doctor runner.
 * Evidence before Implementation.
 *
 * Modes:
 *   (default)     Full local environment doctor.
 *   --ci          Soft Android toolchain · CI-friendly.
 *   --json        Machine-readable JSON on stdout.
 *   --verbose     Print every check.
 *   --skip-network
 *   --soft-android / --strict-android
 *
 * Spec: docs/00-status/DEVELOPER_PLATFORM_01_SPEC.md
 *
 * Usage:
 *   npm run doctor
 *   npm run doctor:ci
 *   npm run doctor:json
 *   npm run doctor:verbose
 *   npm run doctor:env   → scripts/development (toolchain-only)
 */
import { runDoctorAndroidSdk } from "./doctor-android-sdk.mjs";
import { runDoctorAssets } from "./doctor-assets.mjs";
import { runDoctorCapacitor } from "./doctor-capacitor.mjs";
import { runDoctorDevelopmentEnvironment } from "./doctor-development-environment.mjs";
import { runDoctorEnvironment } from "./doctor-environment.mjs";
import { runDoctorGit } from "./doctor-git.mjs";
import { runDoctorGradle } from "./doctor-gradle.mjs";
import { runDoctorJava } from "./doctor-java.mjs";
import { runDoctorNetwork } from "./doctor-network.mjs";
import { runDoctorNode } from "./doctor-node.mjs";
import { buildDoctorSummary, printDoctorReport } from "./doctor-report.mjs";
import { runDoctorRuntime } from "./doctor-runtime.mjs";
import { parseDoctorArgs } from "./doctor-shared.mjs";
import { runDoctorSupabase } from "./doctor-supabase.mjs";
import { runDoctorVite } from "./doctor-vite.mjs";

export const DOCTOR_MODULES = [
  { name: "development-environment", run: runDoctorDevelopmentEnvironment },
  { name: "environment", run: runDoctorEnvironment },
  { name: "node", run: runDoctorNode },
  { name: "java", run: runDoctorJava },
  { name: "gradle", run: runDoctorGradle },
  { name: "android-sdk", run: runDoctorAndroidSdk },
  { name: "capacitor", run: runDoctorCapacitor },
  { name: "vite", run: runDoctorVite },
  { name: "assets", run: runDoctorAssets },
  { name: "runtime", run: runDoctorRuntime },
  { name: "git", run: runDoctorGit },
  { name: "network", run: runDoctorNetwork },
  { name: "supabase", run: runDoctorSupabase },
];

/**
 * @param {import('./doctor-shared.mjs').DoctorOptions & {
 *   json?: boolean,
 *   verbose?: boolean,
 * }} [options]
 */
export async function runDeveloperDoctor(options = {}) {
  const opts = {
    cwd: options.cwd,
    env: options.env,
    ci: Boolean(options.ci),
    verbose: Boolean(options.verbose),
    requireAndroid: options.requireAndroid,
    skipNetwork: Boolean(options.skipNetwork),
  };

  /** @type {{ name: string, result: import('./doctor-shared.mjs').DoctorResult }[]} */
  const modules = [];
  for (const mod of DOCTOR_MODULES) {
    const result = await Promise.resolve(mod.run(opts));
    modules.push({ name: mod.name, result });
  }

  const mode = opts.ci
    ? "ci"
    : options.json
      ? "json"
      : opts.verbose
        ? "verbose"
        : "default";

  const summary = buildDoctorSummary({ modules, mode, verbose: opts.verbose });
  return summary;
}

/**
 * @param {string[]} argv
 */
export async function main(argv = process.argv.slice(2)) {
  const flags = parseDoctorArgs(argv);
  const summary = await runDeveloperDoctor({
    ci: flags.ci,
    json: flags.json,
    verbose: flags.verbose,
    requireAndroid:
      flags.requireAndroid == null ? undefined : flags.requireAndroid,
    skipNetwork: flags.skipNetwork,
  });

  if (flags.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printDoctorReport(summary, { verbose: flags.verbose });
  }

  return summary.ok ? 0 : 1;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("/scripts/developer/index.mjs") ||
    process.argv[1].endsWith("\\scripts\\developer\\index.mjs") ||
    process.argv[1].endsWith("/scripts/developer/doctor.mjs") ||
    process.argv[1].endsWith("\\scripts\\developer\\doctor.mjs"));

if (isDirect) {
  main().then((code) => process.exit(code));
}
