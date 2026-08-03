/**
 * Unit tests for FLOW-05 B2 Authentication.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FLOW05_B2_PRECONDITIONS,
  runFlow05B2Authentication,
} from "./flow-05-b2-authentication.mjs";

function writeB2Fixtures(cwd, { gateOk = true, b1Ok = true } = {}) {
  const files = {
    "src/routes/auth.tsx": "await signInWithPassword({ email, password });\n",
    "src/auth/credentials.ts":
      "export async function signInWithPassword() {}\n",
    "src/auth/post-login-pipeline.ts":
      'export function hasCanonicalSession() {}\nconst s = "CANONICAL_SESSION";\n',
    "src/identity/supabase-identity-provider.tsx":
      '.from("tenant_members")\n',
    "src/permissions/route-guards.ts":
      "export async function requireAuthRoles() {}\n",
    "src/routes/_authenticated/route.tsx":
      "beforeLoad: async () => requireAuthenticatedUser(),\n",
    "src/lib/home-path.ts": '  return "/app";\n',
  };
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
  const gateDir = path.join(cwd, "docs/10-validation/flow-05");
  fs.mkdirSync(gateDir, { recursive: true });
  if (b1Ok) {
    fs.writeFileSync(
      path.join(gateDir, "FLOW05_001_B1_ACTA.md"),
      "# FLOW05-001 · B1 CERTIFIED\n",
    );
  }
  fs.writeFileSync(
    path.join(gateDir, "FLOW_05_GATE.md"),
    gateOk
      ? "# Gate\n**Estado:** ✅ **READY**\nFLOW05-002 · B2 Authentication\n"
      : "# Gate\n**Estado:** READY\nFLOW05-001 only\n",
  );
}

describe("flow-05-b2-authentication", () => {
  it("lists expected B2 check ids", () => {
    assert.equal(FLOW05_B2_PRECONDITIONS.length, 9);
    assert.ok(FLOW05_B2_PRECONDITIONS.includes("flow_05_b1_certified"));
    assert.ok(
      FLOW05_B2_PRECONDITIONS.includes("ready_for_order_creation_present"),
    );
  });

  it("PASS when B1 CERTIFIED and authentication chain anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b2-"));
    writeB2Fixtures(cwd);
    const r = runFlow05B2Authentication({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...FLOW05_B2_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "FLOW05_B2_STARTED",
      "FLOW05_B2_COMPLETED",
    ]);
  });

  it("FAIL when B1 acta is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b2-"));
    writeB2Fixtures(cwd, { b1Ok: false });
    const r = runFlow05B2Authentication({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /B1|FLOW05_001/);
  });

  it("FAIL when Gate does not authorize FLOW05-002", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "flow05-b2-"));
    writeB2Fixtures(cwd, { gateOk: false });
    const r = runFlow05B2Authentication({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /FLOW05-002/);
  });
});
