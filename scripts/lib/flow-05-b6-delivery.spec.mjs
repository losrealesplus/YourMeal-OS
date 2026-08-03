/**
 * Unit tests for FLOW-05 B6 Delivery.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B6_PRECONDITIONS,
  runFlow05B6Delivery,
} from "./flow-05-b6-delivery.mjs";

function writeB6Fixtures(cwd, { gateOk = true, b5Ok = true } = {}) {
  const files = {
    "src/modules/operations/domain/operational-status.ts":
      "export const DELIVERY_QUEUE_STATUSES = [];\n" +
      'ready_for_delivery: ["out_for_delivery"],\n' +
      'out_for_delivery: ["delivered", "delivery_issue"],\n',
    "src/modules/operations/application/operations-service.ts":
      "async startOutForDelivery() {}\nasync completeDelivery() {}\n",
    "src/modules/delivery/application/delivery-service.ts":
      "async recordAttempt() {}\n",
    "src/modules/delivery/application/route-service.ts":
      "async markOrderStopsDelivered() {}\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b5Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_005_B5_ACTA.md"),
      "# FLOW05-005 · B5 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-006 · B6 Delivery\n"
      : "# Gate\n**Estado:** READY\nFLOW05-005 only\n",
  );
}

describe("flow-05-b6-delivery", () => {
  it("lists expected B6 check ids", () => {
    assert.equal(FLOW05_B6_PRECONDITIONS.length, 9);
    assert.ok(FLOW05_B6_PRECONDITIONS.includes("flow_05_b5_certified"));
    assert.ok(
      FLOW05_B6_PRECONDITIONS.includes("delivered_end_transition_present"),
    );
  });

  it("PASS when B5 CERTIFIED and delivery chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b6-"));
    writeB6Fixtures(cwd);
    const r = runFlow05B6Delivery({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B6_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B6_STARTED",
      "FLOW05_B6_COMPLETED",
    ]);
  });

  it("FAIL when B5 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b6-"));
    writeB6Fixtures(cwd, { b5Ok: false });
    const r = runFlow05B6Delivery({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B5|FLOW05_005/);
  });

  it("FAIL when Gate does not authorize FLOW05-006", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b6-"));
    writeB6Fixtures(cwd, { gateOk: false });
    const r = runFlow05B6Delivery({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-006/);
  });
});
