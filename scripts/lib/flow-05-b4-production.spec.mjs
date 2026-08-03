/**
 * Unit tests for FLOW-05 B4 Production.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B4_PRECONDITIONS,
  runFlow05B4Production,
} from "./flow-05-b4-production.mjs";

function writeB4Fixtures(cwd, { gateOk = true, b3Ok = true } = {}) {
  const files = {
    "src/modules/operations/application/operations-service.ts":
      "async startProduction() {}\nasync completeProduction() {}\n",
    "src/modules/operations/domain/operational-status.ts":
      "export const KITCHEN_QUEUE_STATUSES = [];\nprepared: [\"ready_for_delivery\"],\n",
    "src/modules/operations/application/kitchen-execution-service.ts":
      '.from("kitchen_production_batches")\n',
    "src/modules/operations/application/production-report-service.ts":
      "async function loadRecipeLines() {}\n",
    "src/modules/operations/domain/production-report.ts":
      "ingredientSummary: [],\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b3Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_003_B3_ACTA.md"),
      "# FLOW05-003 · B3 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-004 · B4 Production\n"
      : "# Gate\n**Estado:** READY\nFLOW05-003 only\n",
  );
}

describe("flow-05-b4-production", () => {
  it("lists expected B4 check ids", () => {
    assert.equal(FLOW05_B4_PRECONDITIONS.length, 9);
    assert.ok(FLOW05_B4_PRECONDITIONS.includes("flow_05_b3_certified"));
    assert.ok(
      FLOW05_B4_PRECONDITIONS.includes("ready_for_route_planning_present"),
    );
  });

  it("PASS when B3 CERTIFIED and production chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b4-"));
    writeB4Fixtures(cwd);
    const r = runFlow05B4Production({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B4_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B4_STARTED",
      "FLOW05_B4_COMPLETED",
    ]);
  });

  it("FAIL when B3 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b4-"));
    writeB4Fixtures(cwd, { b3Ok: false });
    const r = runFlow05B4Production({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B3|FLOW05_003/);
  });

  it("FAIL when Gate does not authorize FLOW05-004", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b4-"));
    writeB4Fixtures(cwd, { gateOk: false });
    const r = runFlow05B4Production({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-004/);
  });
});
