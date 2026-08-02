/**
 * Unit tests for RELEASE-DEPLOY D1 Preflight.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_DEPLOY_D1_PRECONDITIONS,
  runReleaseDeployD1Preflight,
} from "./release-deploy-d1-preflight.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-deploy-d1-"));
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
  execFileSync("git", ["tag", "release-e2e-pass"], {
    cwd: dir,
    stdio: "ignore",
  });
  return dir;
}

function writeD1Fixtures(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:release-deploy": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-e2e"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-deploy"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md"),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/RELEASE_DEPLOY_SPEC.md"),
    "# Spec\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/release-deploy/RELEASE_DEPLOY_GATE.md"),
    "# Gate\n",
  );
}

describe("release-deploy-d1-preflight", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_DEPLOY_D1_PRECONDITIONS.length, 6);
    assert.ok(
      RELEASE_DEPLOY_D1_PRECONDITIONS.includes("release_e2e_pass_tag_present"),
    );
  });

  it("PASS when Deploy runner, E2E tag/acta, Spec and Gate exist", () => {
    const cwd = tempGitRepo();
    writeD1Fixtures(cwd);
    const r = runReleaseDeployD1Preflight({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_e2e_pass_tag_present"));
    assert.ok(r.checks.includes("release_deploy_canonical_pipeline_intact"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_DEPLOY_D1_STARTED",
      "RELEASE_DEPLOY_D1_COMPLETED",
    ]);
  });

  it("FAIL when release-e2e-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "release-e2e-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeD1Fixtures(cwd);
    const r = runReleaseDeployD1Preflight({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /release-e2e-pass/);
  });
});
