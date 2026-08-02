/**
 * Unit tests for RELEASE-ROLLBACK R2 Execute / Restore.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_ROLLBACK_R2_PRECONDITIONS,
  runReleaseRollbackR2ExecuteRestore,
} from "./release-rollback-r2-execute-restore.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-rollback-r2-"));
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

function writeR2Fixtures(cwd, { certified = true } = {}) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-rollback"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_001_R1_ACTA.md",
    ),
    certified
      ? "# ACTA\n**Estado:** ✅ **CERTIFIED desde `main`**\n"
      : "# ACTA\n**Estado:** ▶ este PR\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_EXECUTE.md",
    ),
    [
      "# Execute",
      "## Canonical steps",
      "release-deploy-pass",
      "RELEASE_ROLLBACK_R2_STARTED",
      "RELEASE_ROLLBACK_R2_COMPLETED",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_RUNNER.md",
    ),
    "# Runner\n",
  );
}

describe("release-rollback-r2-execute-restore", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_ROLLBACK_R2_PRECONDITIONS.length, 4);
    assert.ok(
      RELEASE_ROLLBACK_R2_PRECONDITIONS.includes(
        "release_rollback_execute_procedure_present",
      ),
    );
  });

  it("PASS when R1 CERTIFIED, execute procedure, deploy tag and Runner exist", () => {
    const cwd = tempGitRepo();
    writeR2Fixtures(cwd);
    const r = runReleaseRollbackR2ExecuteRestore({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_rollback_r1_acta_certified"));
    assert.ok(r.checks.includes("release_deploy_pass_tag_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_ROLLBACK_R2_STARTED",
      "RELEASE_ROLLBACK_R2_COMPLETED",
    ]);
  });

  it("FAIL when R1 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeR2Fixtures(cwd, { certified: false });
    const r = runReleaseRollbackR2ExecuteRestore({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED/);
  });
});
