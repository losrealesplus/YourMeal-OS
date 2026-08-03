#!/usr/bin/env node
/**
 * MOBILE-RELEASE-01 · Distribution delivery canonical runner.
 * Evidence before Implementation.
 *
 * Certifies private mobile delivery pipeline toward Internal Testing.
 * Tenant-agnostic — Core SaaS → Capacitor → MOBILE-RELEASE.
 *
 * Modes:
 *   (default) / --runner-only  Empty pipeline → BLOCKED at MR1 (Gate baseline).
 *   --live                     Through CERTIFIED_THROUGH (0 = BLOCKED at MR1).
 *   --self-test                Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c           Validate an explicit observed step list.
 *   --through=MR1|…|MR5        Scope delivery MR01-001..005 (future).
 *
 * Spec: docs/00-status/MOBILE_RELEASE_01_SPEC.md
 *
 * CERTIFIED_THROUGH=1 — MR1 Preparation only · NO APK · NO signing · NO stores.
 */

/** Highest block with a capability driver implemented. */
const MOBILE_RELEASE_CERTIFIED_THROUGH = 1;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MOBILE_RELEASE_CANONICAL_STEPS,
  MOBILE_RELEASE_EXIT,
  MOBILE_RELEASE_SEGMENTS,
  buildMobileReleaseEvidenceReport,
  evaluateMobileReleaseProgress,
  formatMobileReleaseComparisonTable,
  mobileReleaseStepsThrough,
  validateMobileReleasePipeline,
} from "./lib/mobile-release-canonical-pipeline.mjs";
import { runMobileReleaseCapabilityDriver } from "./lib/mobile-release-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/mobile-release/evidence",
);

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(
      EVIDENCE_DIR,
      `mobile-release-00${through}-canonical-live.json`,
    );
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "mobile-release-canonical-live.json");
  }
  if (mode === "runner-only" || mode === "default") {
    return path.join(EVIDENCE_DIR, "mobile-release-canonical.json");
  }
  if (through) {
    return path.join(
      EVIDENCE_DIR,
      `mobile-release-00${through}-canonical.json`,
    );
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "mobile-release-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "mobile-release-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "mobile-release-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
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
      const raw = a
        .slice("--through=".length)
        .toUpperCase()
        .replace(/^MR/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 5) through = /** @type {1|2|3|4|5} */ (n);
    }
  }
  if (
    mode === "live" &&
    through == null &&
    MOBILE_RELEASE_CERTIFIED_THROUGH > 0
  ) {
    through = /** @type {1|2|3|4|5} */ (MOBILE_RELEASE_CERTIFIED_THROUGH);
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  const target = evidencePathFor(mode, through);
  await writeFile(target, payload, "utf8");
  if (
    mode === "live" &&
    through != null &&
    through === MOBILE_RELEASE_CERTIFIED_THROUGH
  ) {
    const aggregate = path.join(
      EVIDENCE_DIR,
      "mobile-release-canonical-live.json",
    );
    if (aggregate !== target) await writeFile(aggregate, payload, "utf8");
  }
  return target;
}

function exitFor(progress) {
  if (progress.status === "PASS") return MOBILE_RELEASE_EXIT.PASS;
  if (progress.status === "BLOCKED") return MOBILE_RELEASE_EXIT.BLOCKED;
  return MOBILE_RELEASE_EXIT.FAIL;
}

function printBlocked(report, progress) {
  console.log("");
  console.log("MOBILE-RELEASE");
  console.log("");
  console.log(report.status);
  console.log("");
  console.log(`blocked_at=${report.blocked_at}`);
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);
  return exitFor(progress);
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("MOBILE-RELEASE · Canonical runner");
  console.log(
    "Distribution · MR1–MR5 · Core → Capacitor → private delivery",
  );
  console.log("Evidence before Implementation · Core Integrity Rule");
  console.log(
    `mode: ${mode}${through ? ` · through=MR${through}` : ""} · CERTIFIED_THROUGH=${MOBILE_RELEASE_CERTIFIED_THROUGH}`,
  );
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only" || mode === "default") {
    const pipeline = [];
    const progress = evaluateMobileReleaseProgress(pipeline, {
      through: null,
    });
    const report = buildMobileReleaseEvidenceReport({
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

    const code = printBlocked(report, progress);
    const out = await writeEvidence(report, mode, null);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(code);
  }

  if (mode === "live") {
    const scope = through ?? MOBILE_RELEASE_CERTIFIED_THROUGH;

    if (scope < 1) {
      const pipeline = [];
      const progress = evaluateMobileReleaseProgress(pipeline, {
        through: null,
      });
      const report = buildMobileReleaseEvidenceReport({
        status: progress.status,
        reason: progress.reason,
        pipeline,
        validation: {
          duplicates: progress.duplicates,
          missing: progress.missing,
          out_of_order: progress.out_of_order,
          firstFailure: progress.firstFailure,
        },
        code_status: "CERTIFIED_THROUGH_0",
        progress,
        evidence: {},
      });
      const code = printBlocked(report, progress);
      const out = await writeEvidence(report, "live", null);
      console.log(`evidence_file: ${path.relative(ROOT, out)}`);
      process.exit(code);
    }

    console.log(`Driving MOBILE-RELEASE blocks (through=MR${scope})…`);
    const driver = runMobileReleaseCapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildMobileReleaseEvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "MOBILE-RELEASE capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(MOBILE_RELEASE_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateMobileReleaseProgress(observed, {
      through: scope,
    });
    const report = buildMobileReleaseEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_MR${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment:
            MOBILE_RELEASE_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatMobileReleaseComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=MR${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "live", through ?? scope);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? mobileReleaseStepsThrough(through)
      : [...MOBILE_RELEASE_CANONICAL_STEPS];
    const progress = evaluateMobileReleaseProgress(pipeline, { through });
    if (!through) {
      const classic = validateMobileReleasePipeline(pipeline);
      if (!classic.ok) {
        console.error(formatMobileReleaseComparisonTable(classic));
        process.exit(MOBILE_RELEASE_EXIT.FAIL);
      }
    }
    const report = buildMobileReleaseEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatMobileReleaseComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=MR${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateMobileReleaseProgress(pipeline, { through });
    const report = buildMobileReleaseEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
      evidence: {},
    });
    console.log(formatMobileReleaseComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    const out = await writeEvidence(report, "pipeline", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  console.error(`Unknown mode: ${mode}`);
  process.exit(MOBILE_RELEASE_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(MOBILE_RELEASE_EXIT.FAIL);
});
