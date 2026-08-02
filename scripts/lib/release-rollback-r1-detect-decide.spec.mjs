/**
 * Unit tests for RELEASE-ROLLBACK R1 Detect / Decide.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_ROLLBACK_R1_PRECONDITIONS,
  runReleaseRollbackR1DetectDecide,
} from "./release-rollback-r1-detect-decide.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-rollback-r1-"));
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

function writeR1Fixtures(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:release-rollback": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-deploy"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-rollback"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md",
    ),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/RELEASE_ROLLBACK_SPEC.md"),
    "# Spec\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-rollback/RELEASE_ROLLBACK_GATE.md",
    ),
    "# Gate\n",
  );
}

describe("release-rollback-r1-detect-decide", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_ROLLBACK_R1_PRECONDITIONS.length, 6);
    assert.ok(
      RELEASE_ROLLBACK_R1_PRECONDITIONS.includes(
        "release_deploy_pass_tag_present",
      ),
    );
  });

  it("PASS when Rollback runner, Deploy tag/acta, Spec and Gate exist", () => {
    const cwd = tempGitRepo();
    writeR1Fixtures(cwd);
    const r = runReleaseRollbackR1DetectDecide({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_deploy_pass_tag_present"));
    assert.ok(r.checks.includes("release_rollback_canonical_pipeline_intact"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_ROLLBACK_R1_STARTED",
      "RELEASE_ROLLBACK_R1_COMPLETED",
    ]);
  });

  it("FAIL when release-deploy-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "release-deploy-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeR1Fixtures(cwd);
    const r = runReleaseRollbackR1DetectDecide({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /release-deploy-pass/);
  });
});
