/**
 * Unit tests for RELEASE-01 P4 Administration.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_P4_PRECONDITIONS,
  runRelease01P4Administration,
} from "./release-01-p4-administration.mjs";

function writeP4Fixtures(cwd, { certifyP3 = true } = {}) {
  const files = [
    "src/modules/accounting/application/accounting-service.ts",
    "src/routes/_authenticated/admin.reports.tsx",
    "src/routes/_authenticated/app.notifications.tsx",
    "src/services/audit-service.ts",
    "src/routes/_authenticated/admin.settings.tsx",
  ];
  for (const rel of files) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "// fixture\n");
  }
  const actaDir = path.join(cwd, "docs/10-validation/release-01");
  fs.mkdirSync(actaDir, { recursive: true });
  const estado = certifyP3
    ? "✅ **CERTIFIED desde `main`** · PASS through P3"
    : "▶ este PR · PASS through P3";
  fs.writeFileSync(
    path.join(actaDir, "RELEASE_01_003_P3_ACTA.md"),
    `# P3\n**Estado:** ${estado}\n`,
  );
}

describe("release-01-p4-administration", () => {
  it("lists expected administration check ids", () => {
    assert.equal(RELEASE_01_P4_PRECONDITIONS.length, 6);
    assert.ok(
      RELEASE_01_P4_PRECONDITIONS.includes("release_01_p3_acta_certified"),
    );
    assert.ok(RELEASE_01_P4_PRECONDITIONS.includes("billing_present"));
    assert.ok(RELEASE_01_P4_PRECONDITIONS.includes("configuration_present"));
  });

  it("PASS when P3 CERTIFIED and all five administration modules exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p4-"));
    writeP4Fixtures(cwd);
    const r = runRelease01P4Administration({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...RELEASE_01_P4_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_P4_STARTED",
      "RELEASE_01_P4_COMPLETED",
    ]);
  });

  it("FAIL when P3 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p4-"));
    writeP4Fixtures(cwd, { certifyP3: false });
    const r = runRelease01P4Administration({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
