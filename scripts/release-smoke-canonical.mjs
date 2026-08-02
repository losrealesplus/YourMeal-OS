#!/usr/bin/env node
/**
 * RELEASE-01 · B-01 Smoke canonical runner — Evidence before Implementation.
 *
 * Certifies platform capabilities (preflight · auth · bootstrap · dashboard).
 * Does NOT certify domain entity states (planned / applied / paid / …).
 *
 * Default (`npm run test:release-smoke`): --live through max certified (S1+).
 * Modes:
 *   --live           Drive certified capabilities (default through = max certified).
 *   --runner-only    Empty pipeline → BLOCKED at S1 (historic Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=S1|…   Scope delivery RELEASE-SMOKE-001..004.
 *
 *   npm run test:release-smoke
 *   npm run test:release-smoke-001
 *
 * Spec: docs/00-status/RELEASE_SMOKE_SPEC.md
 */

/** Highest scenario with a capability driver implemented. */
const RELEASE_SMOKE_CERTIFIED_THROUGH = 4;
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
import { runReleaseSmokeCapabilityDriver } from "./lib/release-smoke-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/release-smoke/evidence",
);

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `release-smoke-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "release-smoke-canonical-live.json");
  }
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-smoke-canonical.json");
  }
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
  // Default = live through certified max (post–001 contract on main).
  let mode = "live";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") mode = "live";
    else if (a === "--runner-only") mode = "runner-only";
    else if (a === "--self-test") mode = "self-test";
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
  if (mode === "live" && through == null) {
    through = /** @type {1|2|3|4} */ (RELEASE_SMOKE_CERTIFIED_THROUGH);
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

  // Historic Gate land-check: empty pipeline → BLOCKED at S1
  if (mode === "runner-only") {
    const pipeline = [];
    const progress = evaluateReleaseSmokeProgress(pipeline, { through: null });
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

    const out = await writeEvidence(report, "runner-only", null);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "live") {
    const scope = through ?? RELEASE_SMOKE_CERTIFIED_THROUGH;
    console.log(
      `Driving RELEASE-SMOKE capabilities (through=S${scope})…`,
    );
    const driver = runReleaseSmokeCapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildReleaseSmokeEvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "RELEASE-SMOKE capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        terminal: { capability: null },
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(RELEASE_SMOKE_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateReleaseSmokeProgress(observed, { through: scope });
    const duration_ms = computeReleaseSmokeDurations(
      syntheticTimestamps(observed),
    );
    const report = buildReleaseSmokeEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      duration_ms,
      code_status: `CAPABILITY_DRIVER_S${progress.certified_through || 0}`,
      terminal: {
        capability:
          RELEASE_SMOKE_CAPABILITIES[progress.certified_through] ?? null,
      },
      progress,
      evidence: driver.evidence ?? {},
    });

    console.log(formatReleaseSmokeComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=S${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );

    const out = await writeEvidence(report, "live", through ?? scope);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);

    if (
      progress.certified_through >= 1 &&
      progress.blocked_at === "RELEASE_SMOKE_S2_STARTED"
    ) {
      console.log(
        "RELEASE-SMOKE-001 · PASS through S1 · BLOCKED at S2 (expected)",
      );
    } else if (
      progress.certified_through >= 2 &&
      progress.blocked_at === "RELEASE_SMOKE_S3_STARTED"
    ) {
      console.log(
        "RELEASE-SMOKE-002 · PASS through S2 · BLOCKED at S3 (expected)",
      );
    } else if (
      progress.certified_through >= 3 &&
      progress.blocked_at === "RELEASE_SMOKE_S4_STARTED"
    ) {
      console.log(
        "RELEASE-SMOKE-003 · PASS through S3 · BLOCKED at S4 (expected)",
      );
    } else if (
      progress.certified_through >= 4 &&
      progress.status === "PASS" &&
      progress.blocked_at == null
    ) {
      console.log("RELEASE-SMOKE");
      console.log("FULL PASS");
      console.log(
        "RELEASE-SMOKE-004 · PASS through S4 · certified_through=S4 · blocked_at=—",
      );
    }
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
