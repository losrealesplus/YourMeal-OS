/**
 * Unit tests for RELEASE-01-BETA B3 Platform Capabilities.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_01_BETA_B3_PRECONDITIONS,
  runRelease01BetaB3PlatformCapabilities,
} from "./release-01-beta-b3-platform-capabilities.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b3-"));
  execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "t@example.com"], {
    cwd: dir,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "t"], {
    cwd: dir,
    stdio: "ignore",
  });
  fs.writeFileSync(path.join(dir, "README.md"), "x\n");
  execFileSync("git", ["add", "README.md"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir, stdio: "ignore" });
  for (const tag of [
    "release-smoke-pass",
    "release-crossflow-pass",
    "release-e2e-pass",
  ]) {
    execFileSync("git", ["tag", tag], { cwd: dir, stdio: "ignore" });
  }
  return dir;
}

function writeB3Fixtures(cwd) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-01-beta"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-smoke"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-crossflow"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-e2e"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md",
    ),
    "# B2\n**Estado:** ✅ **CERTIFIED desde `main`**\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md",
    ),
    "# SMOKE PASS\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-crossflow/RELEASE_CROSSFLOW_PASS_ACTA.md",
    ),
    "# CROSSFLOW PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md"),
    "# E2E PASS\n",
  );
}

describe("release-01-beta-b3-platform-capabilities", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_01_BETA_B3_PRECONDITIONS.length, 7);
    assert.ok(
      RELEASE_01_BETA_B3_PRECONDITIONS.includes(
        "release_smoke_pass_tag_present",
      ),
    );
    assert.ok(
      RELEASE_01_BETA_B3_PRECONDITIONS.includes(
        "release_01_beta_b2_acta_certified",
      ),
    );
  });

  it("PASS when B2 CERTIFIED and Smoke/Cross-flow/E2E tags+actas exist", () => {
    const cwd = tempGitRepo();
    writeB3Fixtures(cwd);
    const r = runRelease01BetaB3PlatformCapabilities({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_e2e_pass_tag_present"));
    assert.ok(r.checks.includes("release_smoke_pass_acta_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_BETA_B3_STARTED",
      "RELEASE_01_BETA_B3_COMPLETED",
    ]);
  });

  it("FAIL when a platform-pass tag is missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "release-crossflow-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeB3Fixtures(cwd);
    const r = runRelease01BetaB3PlatformCapabilities({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /release-crossflow-pass/);
  });

  it("FAIL when B2 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeB3Fixtures(cwd);
    fs.writeFileSync(
      path.join(
        cwd,
        "docs/10-validation/release-01-beta/RELEASE_01_BETA_002_B2_ACTA.md",
      ),
      "# B2\n**Estado:** ▶ este PR\n",
    );
    const r = runRelease01BetaB3PlatformCapabilities({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
