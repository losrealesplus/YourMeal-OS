/**
 * Unit tests for RELEASE-01-BETA B5 Beta Acceptance.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_BETA_B5_PRECONDITIONS,
  runRelease01BetaB5Acceptance,
} from "./release-01-beta-b5-acceptance.mjs";

function writeB5Fixtures(cwd) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-01-beta"), {
    recursive: true,
  });
  for (const n of [1, 2, 3, 4]) {
    const name =
      n === 1
        ? "RELEASE_01_BETA_001_B1_ACTA.md"
        : n === 2
          ? "RELEASE_01_BETA_002_B2_ACTA.md"
          : n === 3
            ? "RELEASE_01_BETA_003_B3_ACTA.md"
            : "RELEASE_01_BETA_004_B4_ACTA.md";
    fs.writeFileSync(
      path.join(cwd, "docs/10-validation/release-01-beta", name),
      `# B${n}\n**Estado:** ✅ **CERTIFIED desde \`main\`**\n`,
    );
  }
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_ACCEPTANCE.md",
    ),
    [
      "# Acceptance",
      "B1 Foundation",
      "B2 Canonical Flows",
      "B3 Platform Capabilities",
      "B4 Release Stack",
      "RELEASE_01_BETA_B5_STARTED",
      "RELEASE_01_BETA_B5_COMPLETED",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_GATE.md",
    ),
    "# Gate\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_RUNNER.md",
    ),
    "# Runner\n",
  );
}

describe("release-01-beta-b5-acceptance", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_01_BETA_B5_PRECONDITIONS.length, 7);
    assert.ok(
      RELEASE_01_BETA_B5_PRECONDITIONS.includes(
        "release_01_beta_b4_acta_certified",
      ),
    );
    assert.ok(
      RELEASE_01_BETA_B5_PRECONDITIONS.includes(
        "release_01_beta_acceptance_checklist_present",
      ),
    );
  });

  it("PASS when B1–B4 CERTIFIED and acceptance checklist + Gate/Runner exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b5-"));
    writeB5Fixtures(cwd);
    const r = runRelease01BetaB5Acceptance({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_01_beta_b1_acta_certified"));
    assert.ok(r.checks.includes("release_01_beta_gate_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_BETA_B5_STARTED",
      "RELEASE_01_BETA_B5_COMPLETED",
    ]);
  });

  it("FAIL when B4 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b5-"));
    writeB5Fixtures(cwd);
    fs.writeFileSync(
      path.join(
        cwd,
        "docs/10-validation/release-01-beta/RELEASE_01_BETA_004_B4_ACTA.md",
      ),
      "# B4\n**Estado:** ▶ este PR\n",
    );
    const r = runRelease01BetaB5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });

  it("FAIL when acceptance checklist is missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b5-"));
    writeB5Fixtures(cwd);
    fs.unlinkSync(
      path.join(
        cwd,
        "docs/10-validation/release-01-beta/RELEASE_01_BETA_ACCEPTANCE.md",
      ),
    );
    const r = runRelease01BetaB5Acceptance({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /ACCEPTANCE/);
  });
});
