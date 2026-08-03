/**
 * Unit tests for FLOW-05 B8 History.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B8_PRECONDITIONS,
  runFlow05B8History,
} from "./flow-05-b8-history.mjs";

function writeB8Fixtures(cwd, { gateOk = true, b7Ok = true } = {}) {
  const files = {
    "src/modules/operations/domain/operational-status.ts":
      'export const DELIVERY_QUEUE_STATUSES = [\n  "ready_for_delivery",\n  "out_for_delivery",\n  "delivery_issue",\n];\n',
    "src/modules/orders/application/order-queries.ts":
      'export async function fetchCustomerOrders() {\n  await db.from("orders").eq("customer_id", customerId).is("deleted_at", null);\n}\n',
    "src/hooks/use-customer-orders.ts":
      "/** CAP-007 — orders history for the signed-in customer. */\nimport { fetchCustomerOrders } from '@/modules/orders/application/order-queries';\n",
    "src/routes/_authenticated/app.orders.tsx":
      "/** Screen: Customer · Orders List (EP-002A.2 Historial)\n * - Capability: orders.list (CAP-007)\n */\n",
    "docs/00-status/FLOW_05_SPEC.md":
      "### B8 · History\n\n| | Contrato |\n|---|----------|\n| **¿Qué entrega?** | Ciclo cerrado — **END** · Order State **Archived** |\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b7Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_007_B7_ACTA.md"),
      "# FLOW05-007 · B7 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-008 · B8 History\n"
      : "# Gate\n**Estado:** READY\nFLOW05-007 only\n",
  );
}

describe("flow-05-b8-history", () => {
  it("lists expected B8 check ids", () => {
    assert.equal(FLOW05_B8_PRECONDITIONS.length, 8);
    assert.ok(FLOW05_B8_PRECONDITIONS.includes("flow_05_b7_certified"));
    assert.ok(
      FLOW05_B8_PRECONDITIONS.includes("archived_end_transition_present"),
    );
  });

  it("PASS when B7 CERTIFIED and history/archive chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b8-"));
    writeB8Fixtures(cwd);
    const r = runFlow05B8History({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B8_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B8_STARTED",
      "FLOW05_B8_COMPLETED",
    ]);
  });

  it("FAIL when B7 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b8-"));
    writeB8Fixtures(cwd, { b7Ok: false });
    const r = runFlow05B8History({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B7|FLOW05_007/);
  });

  it("FAIL when Gate does not authorize FLOW05-008", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b8-"));
    writeB8Fixtures(cwd, { gateOk: false });
    const r = runFlow05B8History({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-008/);
  });
});
