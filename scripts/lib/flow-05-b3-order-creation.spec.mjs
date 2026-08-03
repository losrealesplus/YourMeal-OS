/**
 * Unit tests for FLOW-05 B3 Order Creation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B3_PRECONDITIONS,
  runFlow05B3OrderCreation,
} from "./flow-05-b3-order-creation.mjs";

function writeB3Fixtures(cwd, { gateOk = true, b2Ok = true } = {}) {
  const files = {
    "src/routes/_authenticated/app.schedule.tsx":
      "useProgramDraftOrder();\nuseWeeklyMenu();\nconst deliveryDay = 0;\ndeliveryAddress;\n",
    "src/modules/weekly-menu/infrastructure/weekly-menu-repository.ts":
      "async findPublishedByWeekStart() {}\n",
    "src/modules/order-intake/application/order-intake-service.ts":
      "async intakeDraft() {}\n",
    "src/modules/orders/application/order-service.ts":
      "findPublishedByWeekStart;\ninsertDraft;\nfindCustomerIdForUser;\n",
    "src/modules/orders/infrastructure/order-repository.ts":
      "async insertDraft() {}\n_tenant_id\n",
    "supabase/migrations/20260723120000_program_draft_order_atomic.sql":
      "_customer_id\n_tenant_id\n'draft'\n",
    "src/hooks/use-confirm-order.ts":
      "export function useConfirmOrder() {}\nOrderService.confirm\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b2Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_002_B2_ACTA.md"),
      "# FLOW05-002 · B2 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-003 · B3 Order Creation\n"
      : "# Gate\n**Estado:** READY\nFLOW05-002 only\n",
  );
}

describe("flow-05-b3-order-creation", () => {
  it("lists expected B3 check ids", () => {
    assert.equal(FLOW05_B3_PRECONDITIONS.length, 9);
    assert.ok(FLOW05_B3_PRECONDITIONS.includes("flow_05_b2_certified"));
    assert.ok(
      FLOW05_B3_PRECONDITIONS.includes("ready_for_production_present"),
    );
  });

  it("PASS when B2 CERTIFIED and order-creation chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b3-"));
    writeB3Fixtures(cwd);
    const r = runFlow05B3OrderCreation({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B3_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B3_STARTED",
      "FLOW05_B3_COMPLETED",
    ]);
  });

  it("FAIL when B2 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b3-"));
    writeB3Fixtures(cwd, { b2Ok: false });
    const r = runFlow05B3OrderCreation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B2|FLOW05_002/);
  });

  it("FAIL when Gate does not authorize FLOW05-003", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b3-"));
    writeB3Fixtures(cwd, { gateOk: false });
    const r = runFlow05B3OrderCreation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-003/);
  });
});
