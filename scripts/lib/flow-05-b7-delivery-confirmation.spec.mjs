/**
 * Unit tests for FLOW-05 B7 Delivery Confirmation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B7_PRECONDITIONS,
  runFlow05B7DeliveryConfirmation,
} from "./flow-05-b7-delivery-confirmation.mjs";

function writeB7Fixtures(cwd, { gateOk = true, b6Ok = true } = {}) {
  const files = {
    "src/modules/operations/application/operations-service.ts":
      'logFlow01Step("FLOW01_T4_COMPLETED", {});\n',
    "docs/10-validation/flow-01/FLOW01_004_T4_ACTA.md":
      "# FLOW01-004 · T4 Delivery confirmation · Acta\nFLOW01_T4_COMPLETED\n",
    "src/routes/_authenticated/app.orders.$orderId.tsx":
      'if (status === "delivered") return "delivered";\n',
    "src/modules/operations/application/flow01-evidence.ts":
      'if (step === "FLOW01_T4_COMPLETED") {\n  active.closed = true;\n}\n',
    "src/modules/operations/domain/operational-status.ts":
      'delivered: "Entregado",\n',
    "docs/00-status/FLOW_05_SPEC.md":
      "### B7 · Delivery Confirmation\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Entrega confirmada, lista para historial (B8) |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b6Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_006_B6_ACTA.md"),
      "# FLOW05-006 · B6 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-007 · B7 Delivery Confirmation\n"
      : "# Gate\n**Estado:** READY\nFLOW05-006 only\n",
  );
}

describe("flow-05-b7-delivery-confirmation", () => {
  it("lists expected B7 check ids", () => {
    assert.equal(FLOW05_B7_PRECONDITIONS.length, 8);
    assert.ok(FLOW05_B7_PRECONDITIONS.includes("flow_05_b6_certified"));
    assert.ok(
      FLOW05_B7_PRECONDITIONS.includes("confirmed_ready_for_history_present"),
    );
  });

  it("PASS when B6 CERTIFIED and confirmation chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b7-"));
    writeB7Fixtures(cwd);
    const r = runFlow05B7DeliveryConfirmation({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B7_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B7_STARTED",
      "FLOW05_B7_COMPLETED",
    ]);
  });

  it("FAIL when B6 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b7-"));
    writeB7Fixtures(cwd, { b6Ok: false });
    const r = runFlow05B7DeliveryConfirmation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B6|FLOW05_006/);
  });

  it("FAIL when Gate does not authorize FLOW05-007", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b7-"));
    writeB7Fixtures(cwd, { gateOk: false });
    const r = runFlow05B7DeliveryConfirmation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-007/);
  });
});
