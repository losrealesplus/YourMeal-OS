#!/usr/bin/env node
/**
 * RELEASE-01 · B-01 Smoke canonical runner — Evidence before Implementation.
 *
 * Certifies platform capabilities (preflight · auth · bootstrap · dashboard).
 * Does NOT certify domain entity states (planned / applied / paid / …).
 *
 * Default (no drivers): BLOCKED at RELEASE_SMOKE_S1_STARTED.
 * Modes:
 *   (default)     Empty pipeline → BLOCKED (runner-only).
 *   --self-test   Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *   --through=S1|S2|S3|S4   Scope delivery RELEASE-SMOKE-001..004.
 *
 *   npm run test:release-smoke
 *
 * Spec: docs/00-status/RELEASE_SMOKE_SPEC.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_SMOKE_CANONICAL_STEPS,
  RELEASE_SMOKE_CAPABILITIES,
  RELEASE_SMOKE_EXIT,
  buildReleaseSmokeEvidenceReport,
  computeReleaseSmokeDurations,
  evaluateReleaseSmokeProgress,
  formatReleaseSmokeComparisonTable,
  releaseSmokeStepsThrough,
  validateReleaseSmokePipeline,
} from "./lib/release-smoke-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/release-smoke/evidence",
);

function evidencePathFor(mode, through) {
  if (through) {
    return path.join(
      EVIDENCE_DIR,
      `release-smoke-00${through}-canonical.json`,
    );
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-smoke-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-smoke-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-smoke-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") {
      console.error(
        "RELEASE-SMOKE: --live not available (no Playwright / browser / Supabase / domain in runner PR).",
      );
      process.exit(RELEASE_SMOKE_EXIT.FAIL);
    } else if (a === "--self-test") mode = "self-test";
    else if (a.startsWith("--pipeline=")) {
      mode = "pipeline";
      pipelineArg = a
        .slice("--pipeline=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--through=")) {
      const raw = a.slice("--through=".length).toUpperCase().replace(/^S/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 4) through = /** @type {1|2|3|4} */ (n);
    }
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const target = evidencePathFor(mode, through);
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return target;
}

function syntheticTimestamps(steps) {
  const t0 = Date.now() - steps.length * 15;
  /** @type {Record<string, number>} */
  const ts = {};
  steps.forEach((s, i) => {
    ts[s] = t0 + i * 15;
  });
  return ts;
}

/** Exit: PASS=0 · FAIL=1 · BLOCKED=2 */
function exitFor(progress) {
  if (progress.status === "PASS") return RELEASE_SMOKE_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_SMOKE_EXIT.BLOCKED;
  return RELEASE_SMOKE_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-SMOKE · Canonical runner");
  console.log("Platform capabilities · not domain entities");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=S${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  // Default: executable contract with zero drivers → BLOCKED at S1
  if (mode === "default") {
    const pipeline = [];
    const progress = evaluateReleaseSmokeProgress(pipeline, { through });
    const report = buildReleaseSmokeEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      duration_ms: computeReleaseSmokeDurations({}),
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    console.log("");
    console.log("RELEASE-SMOKE");
    console.log("");
    console.log(report.status);
    console.log("");
    console.log(`blocked_at=${report.blocked_at}`);
    console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
    console.log(`missing=${JSON.stringify(report.missing)}`);
    console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
    console.log(`evidence=${JSON.stringify(report.evidence)}`);

    const out = await writeEvidence(report, mode, through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? releaseSmokeStepsThrough(through)
      : [...RELEASE_SMOKE_CANONICAL_STEPS];
    const progress = evaluateReleaseSmokeProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseSmokePipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseSmokeComparisonTable(classic));
        process.exit(RELEASE_SMOKE_EXIT.FAIL);
      }
    }
    const duration_ms = computeReleaseSmokeDurations(
      syntheticTimestamps(pipeline),
    );
    const report = buildReleaseSmokeEvidenceReport({
      status: progress.status,
      reason: progress.reason || (through ? "" : "Contract self-test"),
      pipeline,
      validation: progress,
      duration_ms,
      code_status: "RUNNER_SELF_TEST",
      terminal: {
        capability:
          RELEASE_SMOKE_CAPABILITIES[progress.certified_through] ?? null,
      },
      progress,
      evidence: {},
    });
    console.log(formatReleaseSmokeComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} delivery=${report.delivery_status} gate=${report.gate_status} certified_through=S${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    if (report.status === "PASS") {
      console.log(
        through
          ? `PASS — RELEASE-SMOKE-00${through} (full gate still BLOCKED at ${report.blocked_at})`
          : "PASS — RELEASE-SMOKE evidence contract satisfied (self-test)",
      );
    }
    process.exit(exitFor(progress));
  }

  // --pipeline=
  const pipeline = pipelineArg ?? [];
  const progress = evaluateReleaseSmokeProgress(pipeline, { through });
  const duration_ms = computeReleaseSmokeDurations(
    syntheticTimestamps(pipeline),
  );
  const report = buildReleaseSmokeEvidenceReport({
    status: progress.status,
    reason: progress.reason,
    pipeline,
    validation: progress,
    duration_ms,
    code_status: "OBSERVED_PIPELINE",
    terminal: {
      capability: RELEASE_SMOKE_CAPABILITIES[progress.certified_through] ?? null,
    },
    progress,
    evidence: {},
  });

  console.log(formatReleaseSmokeComparisonTable(progress));
  console.log("");
  console.log(
    `status=${report.status} delivery=${report.delivery_status} gate=${report.gate_status} certified_through=S${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
  );
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);

  const out = await writeEvidence(report, "pipeline", through);
  console.log(`evidence_file: ${path.relative(ROOT, out)}`);
  process.exit(exitFor(progress));
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_SMOKE_EXIT.FAIL);
});
