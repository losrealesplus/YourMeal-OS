/**
 * Unit tests for FLOW-05 B1 Registration.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B1_PRECONDITIONS,
  runFlow05B1Registration,
} from "./flow-05-b1-registration.mjs";

function writeB1Fixtures(cwd, { gateReady = true } = {}) {
  const files = {
    "src/routes/auth.tsx": 'const mode: "signin" | "signup" = "signup";\n',
    "src/auth/credentials.ts": "export async function signUp() {}\n",
    "supabase/migrations/20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql":
      "CREATE FUNCTION handle_new_user()\n",
    "supabase/migrations/20260723183000_b2b_b2c_customer_model.sql":
      "CREATE FUNCTION ensure_individual_customer()\n",
    "src/auth/urls.ts":
      "export const AUTH_LOGIN_PATH = '/auth';\nexport function emailConfirmRedirectTo() {}\n",
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateReady
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-001 · B1\n"
      : "# Gate\n**Estado:** NOT READY\n",
  );
}

describe("flow-05-b1-registration", () => {
  it("lists expected B1 check ids", () => {
    assert.equal(FLOW05_B1_PRECONDITIONS.length, 6);
    assert.ok(FLOW05_B1_PRECONDITIONS.includes("flow_05_gate_ready"));
    assert.ok(FLOW05_B1_PRECONDITIONS.includes("account_creation_present"));
    assert.ok(
      FLOW05_B1_PRECONDITIONS.includes("ready_for_authentication_present"),
    );
  });

  it("PASS when Gate READY and registration chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b1-"));
    writeB1Fixtures(cwd);
    const r = runFlow05B1Registration({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B1_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B1_STARTED",
      "FLOW05_B1_COMPLETED",
    ]);
  });

  it("FAIL when Gate is not READY", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b1-"));
    writeB1Fixtures(cwd, { gateReady: false });
    const r = runFlow05B1Registration({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /READY|FLOW05-001/);
  });
});
