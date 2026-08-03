#!/usr/bin/env node
/**
 * RELEASE-01 · Product SaaS canonical runner — Evidence before Implementation.
 *
 * Certifies YourMeal OS as operable SaaS (P1–P5).
 *
 * Modes:
 *   --live           Drive capability segments through CERTIFIED_THROUGH (or --through).
 *   --runner-only    Empty pipeline → BLOCKED at P1 (historic Gate baseline).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=P1|…   Scope delivery RELEASE-01-001..005.
 *
 * Spec: docs/00-status/RELEASE_01_SPEC.md
 *
 * NO FLOW-05 · NO Capacitor · NO Track B re-cert · NO functional change in P5.
 */

/** Highest segment with a capability driver implemented. */
const RELEASE_01_CERTIFIED_THROUGH = 5;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_01_CANONICAL_STEPS,
  RELEASE_01_EXIT,
  RELEASE_01_SEGMENTS,
  buildRelease01EvidenceReport,
  evaluateRelease01Progress,
  formatRelease01ComparisonTable,
  release01StepsThrough,
  validateRelease01Pipeline,
} from "./lib/release-01-canonical-pipeline.mjs";
import { runRelease01CapabilityDriver } from "./lib/release-01-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/release-01/evidence",
);

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `release-01-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "release-01-canonical-live.json");
  }
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-01-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `release-01-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-01-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-01-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-01-canonical.json");
}

function parseArgs(argv) {
  let mode = "live";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4|5 | null} */
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^P/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 5) through = /** @type {1|2|3|4|5} */ (n);
    }
  }
  if (mode === "live" && through == null) {
    through = /** @type {1|2|3|4|5} */ (RELEASE_01_CERTIFIED_THROUGH);
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
  if (progress.status === "PASS") return RELEASE_01_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_01_EXIT.BLOCKED;
  return RELEASE_01_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-01 · Canonical runner");
  console.log(
    "Product SaaS · blocks P1–P5 · not a Flow · not Smoke/Cross-flow/E2E/Deploy/Rollback re-run",
  );
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=P${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    const pipeline = [];
    const progress = evaluateRelease01Progress(pipeline, { through: null });
    const report = buildRelease01EvidenceReport({
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
    console.log("RELEASE-01");
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
    const scope = through ?? RELEASE_01_CERTIFIED_THROUGH;
    console.log(`Driving RELEASE-01 segments (through=P${scope})…`);
    const driver = runRelease01CapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildRelease01EvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "RELEASE-01 capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(RELEASE_01_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateRelease01Progress(observed, {
      through: scope,
    });
    const report = buildRelease01EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_P${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment: RELEASE_01_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatRelease01ComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    if (progress.status === "PASS" && progress.certified_through >= 5) {
      console.log("FULL PASS");
    }
    console.log(
      `certified_through=P${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
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
      ? release01StepsThrough(through)
      : [...RELEASE_01_CANONICAL_STEPS];
    const progress = evaluateRelease01Progress(pipeline, { through });
    if (!through) {
      const classic = validateRelease01Pipeline(pipeline);
      if (!classic.ok) {
        console.error(formatRelease01ComparisonTable(classic));
        process.exit(RELEASE_01_EXIT.FAIL);
      }
    }
    const report = buildRelease01EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatRelease01ComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=P${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateRelease01Progress(pipeline, { through });
    const report = buildRelease01EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatRelease01ComparisonTable(progress));
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

  process.exit(RELEASE_01_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_01_EXIT.FAIL);
});
