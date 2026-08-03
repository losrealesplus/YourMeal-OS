/**
 * Unit tests for RELEASE-01-BETA B4 Release Stack.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_01_BETA_B4_PRECONDITIONS,
  runRelease01BetaB4ReleaseStack,
} from "./release-01-beta-b4-release-stack.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b4-"));
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
  for (const tag of ["release-deploy-pass", "release-rollback-pass"]) {
    execFileSync("git", ["tag", tag], { cwd: dir, stdio: "ignore" });
  }
  return dir;
}

function writeB4Fixtures(cwd) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-01-beta"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-deploy"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-rollback"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_003_B3_ACTA.md",
    ),
    "# B3\n**Estado:** ✅ **CERTIFIED desde `main`**\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md",
    ),
    "# DEPLOY PASS\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md",
    ),
    "# ROLLBACK PASS\n",
  );
}

describe("release-01-beta-b4-release-stack", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_01_BETA_B4_PRECONDITIONS.length, 5);
    assert.ok(
      RELEASE_01_BETA_B4_PRECONDITIONS.includes(
        "release_deploy_pass_tag_present",
      ),
    );
    assert.ok(
      RELEASE_01_BETA_B4_PRECONDITIONS.includes(
        "release_01_beta_b3_acta_certified",
      ),
    );
  });

  it("PASS when B3 CERTIFIED and Deploy/Rollback tags+actas exist", () => {
    const cwd = tempGitRepo();
    writeB4Fixtures(cwd);
    const r = runRelease01BetaB4ReleaseStack({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_rollback_pass_tag_present"));
    assert.ok(r.checks.includes("release_deploy_pass_acta_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_BETA_B4_STARTED",
      "RELEASE_01_BETA_B4_COMPLETED",
    ]);
  });

  it("FAIL when a stack-pass tag is missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "release-rollback-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeB4Fixtures(cwd);
    const r = runRelease01BetaB4ReleaseStack({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /release-rollback-pass/);
  });

  it("FAIL when B3 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeB4Fixtures(cwd);
    fs.writeFileSync(
      path.join(
        cwd,
        "docs/10-validation/release-01-beta/RELEASE_01_BETA_003_B3_ACTA.md",
      ),
      "# B3\n**Estado:** ▶ este PR\n",
    );
    const r = runRelease01BetaB4ReleaseStack({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
