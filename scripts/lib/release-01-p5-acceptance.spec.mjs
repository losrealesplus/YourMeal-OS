/**
 * Unit tests for RELEASE-01 P5 Product Acceptance.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_P5_PRECONDITIONS,
  runRelease01P5Acceptance,
} from "./release-01-p5-acceptance.mjs";

function writeP5Fixtures(cwd, { certifyP4 = true, certifyAll = true } = {}) {
  const actas = [
    ["RELEASE_01_001_P1_ACTA.md", "P1"],
    ["RELEASE_01_002_P2_ACTA.md", "P2"],
    ["RELEASE_01_003_P3_ACTA.md", "P3"],
    ["RELEASE_01_004_P4_ACTA.md", "P4"],
  ];
  const actaDir = path.join(cwd, "docs/10-validation/release-01");
  fs.mkdirSync(actaDir, { recursive: true });
  for (const [file, label] of actas) {
    const isP4 = label === "P4";
    const certified =
      certifyAll && (isP4 ? certifyP4 : true)
        ? "✅ **CERTIFIED desde `main`** · PASS"
        : isP4 && !certifyP4
          ? "▶ este PR · PASS through P4"
          : certifyAll
            ? "✅ **CERTIFIED desde `main`** · PASS"
            : "▶ este PR · PASS";
    // When certifyAll is false, leave non-P4 as uncertified for incomplete tests.
    const estado =
      !certifyAll && !isP4
        ? "▶ este PR · PASS"
        : isP4 && !certifyP4
          ? "▶ este PR · PASS through P4"
          : certified;
    fs.writeFileSync(
      path.join(actaDir, file),
      `# ${label}\n**Estado:** ${estado}\n`,
    );
  }
}

describe("release-01-p5-acceptance", () => {
  it("lists expected acceptance check ids", () => {
    assert.equal(RELEASE_01_P5_PRECONDITIONS.length, 5);
    assert.ok(
      RELEASE_01_P5_PRECONDITIONS.includes("release_01_p4_acta_certified"),
    );
    assert.ok(
      RELEASE_01_P5_PRECONDITIONS.includes("release_01_foundation_complete"),
    );
    assert.ok(
      RELEASE_01_P5_PRECONDITIONS.includes(
        "release_01_administration_complete",
      ),
    );
  });

  it("PASS when P1–P4 are CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p5-"));
    writeP5Fixtures(cwd);
    const r = runRelease01P5Acceptance({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...RELEASE_01_P5_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_P5_STARTED",
      "RELEASE_01_P5_COMPLETED",
    ]);
  });

  it("FAIL when P4 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p5-"));
    writeP5Fixtures(cwd, { certifyP4: false });
    const r = runRelease01P5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main|Land Check P4/);
  });
});
