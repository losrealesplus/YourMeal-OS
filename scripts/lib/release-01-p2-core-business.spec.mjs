/**
 * Unit tests for RELEASE-01 P2 Core Business Modules.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_P2_PRECONDITIONS,
  runRelease01P2CoreBusiness,
} from "./release-01-p2-core-business.mjs";

function writeP2Fixtures(cwd, { certifyP1 = true } = {}) {
  const files = [
    "src/modules/dish-library/domain/entities/dish.ts",
    "docs/12-domain-model/module-01/Ingredient.md",
    "docs/12-domain-model/module-01/Recipe.md",
    "src/modules/customer-directory/application/customer-directory-service.ts",
    "src/modules/orders/application/order-service.ts",
  ];
  for (const rel of files) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "// fixture\n");
  }
  const actaDir = path.join(cwd, "docs/10-validation/release-01");
  fs.mkdirSync(actaDir, { recursive: true });
  const estado = certifyP1
    ? "✅ **CERTIFIED desde `main`** · PASS through P1"
    : "▶ este PR · PASS through P1";
  fs.writeFileSync(
    path.join(actaDir, "RELEASE_01_001_P1_ACTA.md"),
    `# P1\n**Estado:** ${estado}\n`,
  );
}

describe("release-01-p2-core-business", () => {
  it("lists expected core-business check ids", () => {
    assert.equal(RELEASE_01_P2_PRECONDITIONS.length, 6);
    assert.ok(
      RELEASE_01_P2_PRECONDITIONS.includes("release_01_p1_acta_certified"),
    );
    assert.ok(RELEASE_01_P2_PRECONDITIONS.includes("dish_library_present"));
    assert.ok(RELEASE_01_P2_PRECONDITIONS.includes("orders_present"));
  });

  it("PASS when P1 CERTIFIED and all five modules exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p2-"));
    writeP2Fixtures(cwd);
    const r = runRelease01P2CoreBusiness({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...RELEASE_01_P2_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_P2_STARTED",
      "RELEASE_01_P2_COMPLETED",
    ]);
  });

  it("FAIL when P1 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p2-"));
    writeP2Fixtures(cwd, { certifyP1: false });
    const r = runRelease01P2CoreBusiness({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
