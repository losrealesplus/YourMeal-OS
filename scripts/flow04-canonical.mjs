#!/usr/bin/env node
/**
 * FLOW-04 canonical runner — Evidence before Implementation.
 *
 * Default (no domain): BLOCKED at FLOW04_T1_STARTED.
 * Modes:
 *   (default)     Empty pipeline → BLOCKED (runner-only, no domain).
 *   --self-test   Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *   --through=T1|T2|T3   Scope delivery FLOW04-001..003 (prefix PASS).
 *   --live        Evaluate domain observations (progressive BLOCKED/PASS/FAIL).
 *
 *   npm run test:flow04-canonical
 *   npm run test:flow04-canonical -- --live --through=T1
 *   npm run test:flow04-001
 *
 * Spec: docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLOW04_CANONICAL_STEPS,
  FLOW04_EXIT,
  buildFlow04EvidenceReport,
  computeFlow04Durations,
  evaluateFlow04Progress,
  flow04StepsThrough,
  formatFlow04ComparisonTable,
  validateFlow04Pipeline,
} from "./lib/flow04-canonical-pipeline.mjs";
import { runFlow04DomainDriver } from "./lib/flow04-domain-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/flow-04/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(EVIDENCE_DIR, `flow04-00${through}-canonical-live.json`);
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "flow04-canonical-live.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `flow04-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "flow04-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "flow04-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "flow04-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") mode = "live";
    else if (a === "--self-test") mode = "self-test";
    else if (a.startsWith("--pipeline=")) {
      mode = "pipeline";
      pipelineArg = a
        .slice("--pipeline=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--through=")) {
      const raw = a.slice("--through=".length).toUpperCase().replace(/^T/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 3) through = /** @type {1|2|3} */ (n);
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
  if (progress.status === "PASS") return FLOW04_EXIT.PASS;
  if (progress.status === "BLOCKED") return FLOW04_EXIT.BLOCKED;
  return FLOW04_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("FLOW-04 · Canonical runner");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=T${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  // Default: executable contract with zero domain → BLOCKED at T1
  if (mode === "default") {
    const pipeline = [];
    const progress = evaluateFlow04Progress(pipeline, { through });
    const report = buildFlow04EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      duration_ms: computeFlow04Durations({}),
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    console.log("");
    console.log("FLOW-04");
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

  if (mode === "live") {
    console.log("Driving FLOW-04 domain (certified transitions)…");
    const driver = runFlow04DomainDriver({ root: ROOT, through });
    if (!driver.ok) {
      console.error("Domain driver failed (vitest):");
      console.error(driver.output.slice(-4000));
      const report = buildFlow04EvidenceReport({
        status: "FAIL",
        reason: "FLOW-04 domain driver failed",
        pipeline: driver.steps,
        code_status: "DOMAIN_DRIVER_FAIL",
        terminal: { consumption_status: null },
        evidence: {},
      });
      await writeEvidence(report, "live", through);
      process.exit(FLOW04_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateFlow04Progress(observed, { through });
    const duration_ms = computeFlow04Durations(syntheticTimestamps(observed));
    const statusForThrough = {
      1: "planned",
      2: "applied",
      3: "sealed",
    };
    const report = buildFlow04EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      duration_ms,
      code_status: `DOMAIN_DRIVER_T${progress.certified_through || 0}`,
      terminal: {
        consumption_status:
          statusForThrough[progress.certified_through] ?? null,
      },
      progress,
      evidence: {},
    });

    console.log(formatFlow04ComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=T${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );

    const out = await writeEvidence(report, "live", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);

    if (
      progress.status === "PASS" &&
      progress.flow_status === "PASS" &&
      progress.certified_through >= 3
    ) {
      console.log("FLOW-04 · FULL PASS · Inventory Consumption certified");
    } else if (
      progress.certified_through >= 1 &&
      progress.blocked_at === "FLOW04_T2_STARTED"
    ) {
      console.log("FLOW04-001 · PASS through T1 · BLOCKED at T2 (expected)");
    } else if (
      progress.certified_through >= 2 &&
      progress.blocked_at === "FLOW04_T3_STARTED"
    ) {
      console.log("FLOW04-002 · PASS through T2 · BLOCKED at T3 (expected)");
    }
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? flow04StepsThrough(through)
      : [...FLOW04_CANONICAL_STEPS];
    const progress = evaluateFlow04Progress(pipeline, { through });
    if (!through) {
      const classic = validateFlow04Pipeline(pipeline);
      if (!classic.ok) {
        console.error(formatFlow04ComparisonTable(classic));
        process.exit(FLOW04_EXIT.FAIL);
      }
    }
    const duration_ms = computeFlow04Durations(syntheticTimestamps(pipeline));
    const report = buildFlow04EvidenceReport({
      status: progress.status,
      reason: progress.reason || (through ? "" : "Contract self-test"),
      pipeline,
      validation: progress,
      duration_ms,
      code_status: "RUNNER_SELF_TEST",
      progress,
      evidence: {},
    });
    console.log(formatFlow04ComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    if (report.status === "PASS") {
      console.log(
        through
          ? `PASS — FLOW04-00${through} (full FLOW-04 still BLOCKED at ${report.blocked_at})`
          : "PASS — FLOW-04 evidence contract satisfied (self-test)",
      );
    }
    process.exit(exitFor(progress));
  }

  // --pipeline=
  const pipeline = pipelineArg ?? [];
  const progress = evaluateFlow04Progress(pipeline, { through });
  const duration_ms = computeFlow04Durations(syntheticTimestamps(pipeline));
  const report = buildFlow04EvidenceReport({
    status: progress.status,
    reason: progress.reason,
    pipeline,
    validation: progress,
    duration_ms,
    code_status: "OBSERVED_PIPELINE",
    progress,
    evidence: {},
  });

  console.log(formatFlow04ComparisonTable(progress));
  console.log("");
  console.log(
    `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
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
  process.exit(FLOW04_EXIT.FAIL);
});
