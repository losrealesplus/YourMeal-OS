/**
 * Unit tests for RELEASE-01 P3 Operations.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_P3_PRECONDITIONS,
  runRelease01P3Operations,
} from "./release-01-p3-operations.mjs";

function writeP3Fixtures(cwd, { certifyP2 = true } = {}) {
  const files = [
    "src/routes/_authenticated/admin.production.tsx",
    "src/modules/weekly-menu/application/weekly-menu-service.ts",
    "src/modules/delivery/application/route-service.ts",
    "src/routes/_authenticated/admin.routes.deliveries.tsx",
    "src/modules/inventory/application/inventory-service.ts",
  ];
  for (const rel of files) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "// fixture\n");
  }
  const actaDir = path.join(cwd, "docs/10-validation/release-01");
  fs.mkdirSync(actaDir, { recursive: true });
  const estado = certifyP2
    ? "✅ **CERTIFIED desde `main`** · PASS through P2"
    : "▶ este PR · PASS through P2";
  fs.writeFileSync(
    path.join(actaDir, "RELEASE_01_002_P2_ACTA.md"),
    `# P2\n**Estado:** ${estado}\n`,
  );
}

describe("release-01-p3-operations", () => {
  it("lists expected operations check ids", () => {
    assert.equal(RELEASE_01_P3_PRECONDITIONS.length, 6);
    assert.ok(
      RELEASE_01_P3_PRECONDITIONS.includes("release_01_p2_acta_certified"),
    );
    assert.ok(RELEASE_01_P3_PRECONDITIONS.includes("production_present"));
    assert.ok(RELEASE_01_P3_PRECONDITIONS.includes("inventory_present"));
  });

  it("PASS when P2 CERTIFIED and all five operations modules exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p3-"));
    writeP3Fixtures(cwd);
    const r = runRelease01P3Operations({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...RELEASE_01_P3_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_P3_STARTED",
      "RELEASE_01_P3_COMPLETED",
    ]);
  });

  it("FAIL when P2 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p3-"));
    writeP3Fixtures(cwd, { certifyP2: false });
    const r = runRelease01P3Operations({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
