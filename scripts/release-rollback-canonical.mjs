#!/usr/bin/env node
/**
 * RELEASE-01 · B-05 Rollback canonical runner — Evidence before Implementation.
 *
 * Certifies controlled recovery (R1–R3). Complements Deploy + Smoke + Cross-flow + E2E.
 *
 * Default (`npm run test:release-rollback`): --live through max certified (R1).
 * Modes:
 *   --live           Drive certified segments (default through = max certified).
 *   --runner-only    Empty pipeline → BLOCKED at R1 (historic Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=R1|…   Scope delivery RELEASE-ROLLBACK-001..003.
 *
 * Spec: docs/00-status/RELEASE_ROLLBACK_SPEC.md
 *
 * NO R2/R3 drivers in this PR · NO CI · NO infra · NO restore execution.
 */

/** Highest segment with a capability driver implemented. */
const RELEASE_ROLLBACK_CERTIFIED_THROUGH = 1;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_ROLLBACK_CANONICAL_STEPS,
  RELEASE_ROLLBACK_EXIT,
  RELEASE_ROLLBACK_SEGMENTS,
  buildReleaseRollbackEvidenceReport,
  evaluateReleaseRollbackProgress,
  formatReleaseRollbackComparisonTable,
  releaseRollbackStepsThrough,
  validateReleaseRollbackPipeline,
} from "./lib/release-rollback-canonical-pipeline.mjs";
import { runReleaseRollbackCapabilityDriver } from "./lib/release-rollback-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/release-rollback/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `release-rollback-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "release-rollback-canonical-live.json");
  }
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-rollback-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `release-rollback-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-rollback-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-rollback-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-rollback-canonical.json");
}

function parseArgs(argv) {
  let mode = "live";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3 | null} */
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^R/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 3) through = /** @type {1|2|3} */ (n);
    }
  }
  if (mode === "live" && through == null) {
    through = /** @type {1|2|3} */ (RELEASE_ROLLBACK_CERTIFIED_THROUGH);
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const target = evidencePathFor(mode, through);
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return target;
}

function exitFor(progress) {
  if (progress.status === "PASS") return RELEASE_ROLLBACK_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_ROLLBACK_EXIT.BLOCKED;
  return RELEASE_ROLLBACK_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-ROLLBACK · Canonical runner");
  console.log("Controlled recovery · not Deploy · not Smoke · not Cross-flow · not E2E · not a Flow");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=R${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    const pipeline = [];
    const progress = evaluateReleaseRollbackProgress(pipeline, { through: null });
    const report = buildReleaseRollbackEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    console.log("");
    console.log("RELEASE-ROLLBACK");
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
    const scope = through ?? RELEASE_ROLLBACK_CERTIFIED_THROUGH;
    console.log(`Driving RELEASE-ROLLBACK segments (through=R${scope})…`);
    const driver = runReleaseRollbackCapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildReleaseRollbackEvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "RELEASE-ROLLBACK capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(RELEASE_ROLLBACK_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateReleaseRollbackProgress(observed, {
      through: scope,
    });
    const report = buildReleaseRollbackEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_R${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment: RELEASE_ROLLBACK_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatReleaseRollbackComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=R${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );

    const out = await writeEvidence(report, "live", through ?? scope);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? releaseRollbackStepsThrough(through)
      : [...RELEASE_ROLLBACK_CANONICAL_STEPS];
    const progress = evaluateReleaseRollbackProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseRollbackPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseRollbackComparisonTable(classic));
        process.exit(RELEASE_ROLLBACK_EXIT.FAIL);
      }
    }
    const report = buildReleaseRollbackEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatReleaseRollbackComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=R${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateReleaseRollbackProgress(pipeline, { through });
    const report = buildReleaseRollbackEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatReleaseRollbackComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} blocked_at=${report.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );
    const out = await writeEvidence(report, "pipeline", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  process.exit(RELEASE_ROLLBACK_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_ROLLBACK_EXIT.FAIL);
});
