/**
 * Unit tests for FLOW-05 B5 Route Planning.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B5_PRECONDITIONS,
  runFlow05B5RoutePlanning,
} from "./flow-05-b5-route-planning.mjs";

function writeB5Fixtures(cwd, { gateOk = true, b4Ok = true } = {}) {
  const files = {
    "src/modules/operations/application/operations-service.ts":
      "async assignDelivery() {}\n",
    "src/modules/operations/domain/operational-status.ts":
      'prepared: ["ready_for_delivery"],\nready_for_delivery: ["out_for_delivery"],\n',
    "src/modules/operations/domain/delivery-assignment.ts":
      "export function assignDeliveryOrder() {}\n",
    "src/modules/delivery/application/route-service.ts":
      'status: "planned"\nasync setDriver() {}\nasync addStop() {}\n',
    "src/modules/delivery/domain/route-status.ts":
      "export function nextRouteStatuses() {}\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b4Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_004_B4_ACTA.md"),
      "# FLOW05-004 · B4 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-005 · B5 Route Planning\n"
      : "# Gate\n**Estado:** READY\nFLOW05-004 only\n",
  );
}

describe("flow-05-b5-route-planning", () => {
  it("lists expected B5 check ids", () => {
    assert.equal(FLOW05_B5_PRECONDITIONS.length, 10);
    assert.ok(FLOW05_B5_PRECONDITIONS.includes("flow_05_b4_certified"));
    assert.ok(FLOW05_B5_PRECONDITIONS.includes("ready_for_delivery_present"));
  });

  it("PASS when B4 CERTIFIED and route-planning chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b5-"));
    writeB5Fixtures(cwd);
    const r = runFlow05B5RoutePlanning({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B5_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B5_STARTED",
      "FLOW05_B5_COMPLETED",
    ]);
  });

  it("FAIL when B4 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b5-"));
    writeB5Fixtures(cwd, { b4Ok: false });
    const r = runFlow05B5RoutePlanning({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B4|FLOW05_004/);
  });

  it("FAIL when Gate does not authorize FLOW05-005", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b5-"));
    writeB5Fixtures(cwd, { gateOk: false });
    const r = runFlow05B5RoutePlanning({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-005/);
  });
});
