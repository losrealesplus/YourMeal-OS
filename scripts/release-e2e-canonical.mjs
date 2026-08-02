#!/usr/bin/env node
/**
 * RELEASE-01 · B-03 E2E canonical runner — Evidence before Implementation.
 *
 * Certifies the pilot journey (E1–E4). Complements Smoke + Cross-flow.
 *
 * Default (`npm run test:release-e2e`): --live through max certified (E2+).
 * Modes:
 *   --live           Drive certified segments (default through = max certified).
 *   --runner-only    Empty pipeline → BLOCKED at E1 (historic Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=E1|…   Scope delivery RELEASE-E2E-001..004.
 *
 * Spec: docs/00-status/RELEASE_E2E_SPEC.md
 */

/** Highest segment with a capability driver implemented. */
const RELEASE_E2E_CERTIFIED_THROUGH = 2;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_E2E_CANONICAL_STEPS,
  RELEASE_E2E_EXIT,
  RELEASE_E2E_SEGMENTS,
  buildReleaseE2eEvidenceReport,
  evaluateReleaseE2eProgress,
  formatReleaseE2eComparisonTable,
  releaseE2eStepsThrough,
  validateReleaseE2ePipeline,
} from "./lib/release-e2e-canonical-pipeline.mjs";
import { runReleaseE2eCapabilityDriver } from "./lib/release-e2e-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/release-e2e/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `release-e2e-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "release-e2e-canonical-live.json");
  }
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-e2e-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `release-e2e-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-e2e-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-e2e-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-e2e-canonical.json");
}

function parseArgs(argv) {
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^E/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 4) through = /** @type {1|2|3|4} */ (n);
    }
  }
  if (mode === "live" && through == null) {
    through = /** @type {1|2|3|4} */ (RELEASE_E2E_CERTIFIED_THROUGH);
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
  if (progress.status === "PASS") return RELEASE_E2E_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_E2E_EXIT.BLOCKED;
  return RELEASE_E2E_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-E2E · Canonical runner");
  console.log("Pilot journey · not Smoke · not Cross-flow · not a Flow");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=E${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    const pipeline = [];
    const progress = evaluateReleaseE2eProgress(pipeline, { through: null });
    const report = buildReleaseE2eEvidenceReport({
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
    console.log("RELEASE-E2E");
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
    const scope = through ?? RELEASE_E2E_CERTIFIED_THROUGH;
    console.log(`Driving RELEASE-E2E segments (through=E${scope})…`);
    const driver = runReleaseE2eCapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildReleaseE2eEvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "RELEASE-E2E capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(RELEASE_E2E_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateReleaseE2eProgress(observed, {
      through: scope,
    });
    const report = buildReleaseE2eEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_E${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment: RELEASE_E2E_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatReleaseE2eComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=E${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );

    const out = await writeEvidence(report, "live", through ?? scope);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);

    if (
      progress.certified_through >= 2 &&
      progress.blocked_at === "RELEASE_E2E_E3_STARTED"
    ) {
      console.log(
        "RELEASE-E2E-002 · PASS through E2 · BLOCKED at E3 (expected)",
      );
    } else if (
      progress.certified_through >= 1 &&
      progress.blocked_at === "RELEASE_E2E_E2_STARTED"
    ) {
      console.log(
        "RELEASE-E2E-001 · PASS through E1 · BLOCKED at E2 (expected)",
      );
    }
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? releaseE2eStepsThrough(through)
      : [...RELEASE_E2E_CANONICAL_STEPS];
    const progress = evaluateReleaseE2eProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseE2ePipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseE2eComparisonTable(classic));
        process.exit(RELEASE_E2E_EXIT.FAIL);
      }
    }
    const report = buildReleaseE2eEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatReleaseE2eComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=E${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateReleaseE2eProgress(pipeline, { through });
    const report = buildReleaseE2eEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatReleaseE2eComparisonTable(progress));
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

  process.exit(RELEASE_E2E_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_E2E_EXIT.FAIL);
});
