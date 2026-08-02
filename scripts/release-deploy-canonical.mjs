#!/usr/bin/env node
/**
 * RELEASE-01 · B-04 Deploy canonical runner — Evidence before Implementation.
 *
 * Certifies reproducible deployment (D1–D3). Complements Smoke + Cross-flow + E2E.
 *
 * Default (`npm run test:release-deploy`): --live through max certified (D1).
 * Modes:
 *   --live           Drive certified segments (default through = max certified).
 *   --runner-only    Empty pipeline → BLOCKED at D1 (historic Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=D1|…   Scope delivery RELEASE-DEPLOY-001..003.
 *
 * Spec: docs/00-status/RELEASE_DEPLOY_SPEC.md
 *
 * NO D2/D3 drivers in this PR · NO CI · NO infra · NO Rollback.
 */

/** Highest segment with a capability driver implemented. */
const RELEASE_DEPLOY_CERTIFIED_THROUGH = 2;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_DEPLOY_CANONICAL_STEPS,
  RELEASE_DEPLOY_EXIT,
  RELEASE_DEPLOY_SEGMENTS,
  buildReleaseDeployEvidenceReport,
  evaluateReleaseDeployProgress,
  formatReleaseDeployComparisonTable,
  releaseDeployStepsThrough,
  validateReleaseDeployPipeline,
} from "./lib/release-deploy-canonical-pipeline.mjs";
import { runReleaseDeployCapabilityDriver } from "./lib/release-deploy-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/release-deploy/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `release-deploy-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical-live.json");
  }
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `release-deploy-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-deploy-canonical.json");
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^D/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 3) through = /** @type {1|2|3} */ (n);
    }
  }
  if (mode === "live" && through == null) {
    through = /** @type {1|2|3} */ (RELEASE_DEPLOY_CERTIFIED_THROUGH);
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
  if (progress.status === "PASS") return RELEASE_DEPLOY_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_DEPLOY_EXIT.BLOCKED;
  return RELEASE_DEPLOY_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-DEPLOY · Canonical runner");
  console.log("Reproducible deploy · not Smoke · not Cross-flow · not E2E · not a Flow");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=D${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    const pipeline = [];
    const progress = evaluateReleaseDeployProgress(pipeline, { through: null });
    const report = buildReleaseDeployEvidenceReport({
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
    console.log("RELEASE-DEPLOY");
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
    const scope = through ?? RELEASE_DEPLOY_CERTIFIED_THROUGH;
    console.log(`Driving RELEASE-DEPLOY segments (through=D${scope})…`);
    const driver = runReleaseDeployCapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildReleaseDeployEvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "RELEASE-DEPLOY capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(RELEASE_DEPLOY_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateReleaseDeployProgress(observed, {
      through: scope,
    });
    const report = buildReleaseDeployEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_D${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment: RELEASE_DEPLOY_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatReleaseDeployComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=D${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
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
      ? releaseDeployStepsThrough(through)
      : [...RELEASE_DEPLOY_CANONICAL_STEPS];
    const progress = evaluateReleaseDeployProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseDeployPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseDeployComparisonTable(classic));
        process.exit(RELEASE_DEPLOY_EXIT.FAIL);
      }
    }
    const report = buildReleaseDeployEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatReleaseDeployComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=D${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateReleaseDeployProgress(pipeline, { through });
    const report = buildReleaseDeployEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatReleaseDeployComparisonTable(progress));
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

  process.exit(RELEASE_DEPLOY_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_DEPLOY_EXIT.FAIL);
});
