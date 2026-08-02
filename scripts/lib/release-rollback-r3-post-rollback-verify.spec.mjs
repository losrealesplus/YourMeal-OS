/**
 * Unit tests for RELEASE-ROLLBACK R3 Post-rollback Verify.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_ROLLBACK_R3_PRECONDITIONS,
  runReleaseRollbackR3PostRollbackVerify,
} from "./release-rollback-r3-post-rollback-verify.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-rollback-r3-"));
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
  execFileSync("git", ["tag", "release-deploy-pass"], {
    cwd: dir,
    stdio: "ignore",
  });
  return dir;
}

function writeR3Fixtures(cwd, { certified = true } = {}) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-rollback"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { preview: "vite preview" },
    }),
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_002_R2_ACTA.md",
    ),
    certified
      ? "# ACTA\n**Estado:** ✅ **CERTIFIED desde `main`**\n"
      : "# ACTA\n**Estado:** ▶ este PR\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_VERIFY.md",
    ),
    [
      "# Verify",
      "## Canonical steps",
      "preview",
      "RELEASE_ROLLBACK_R3_STARTED",
      "RELEASE_ROLLBACK_R3_COMPLETED",
      "",
    ].join("\n"),
  );
}

describe("release-rollback-r3-post-rollback-verify", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_ROLLBACK_R3_PRECONDITIONS.length, 5);
    assert.ok(
      RELEASE_ROLLBACK_R3_PRECONDITIONS.includes(
        "release_rollback_verify_procedure_present",
      ),
    );
  });

  it("PASS when R2 CERTIFIED, verify procedure, preview, entry and tag exist", () => {
    const cwd = tempGitRepo();
    writeR3Fixtures(cwd);
    const r = runReleaseRollbackR3PostRollbackVerify({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_rollback_r2_acta_certified"));
    assert.ok(r.checks.includes("release_deploy_pass_tag_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_ROLLBACK_R3_STARTED",
      "RELEASE_ROLLBACK_R3_COMPLETED",
    ]);
  });

  it("FAIL when R2 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeR3Fixtures(cwd, { certified: false });
    const r = runReleaseRollbackR3PostRollbackVerify({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED/);
  });
});
