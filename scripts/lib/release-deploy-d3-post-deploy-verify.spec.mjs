/**
 * Unit tests for RELEASE-DEPLOY D3 Post-deploy Verify.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_DEPLOY_D3_PRECONDITIONS,
  runReleaseDeployD3PostDeployVerify,
} from "./release-deploy-d3-post-deploy-verify.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-deploy-d3-"));
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

function writeD3Fixtures(cwd, { certified = true } = {}) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-deploy"), {
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
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_002_D2_ACTA.md",
    ),
    certified
      ? "# ACTA\n**Estado:** ✅ **CERTIFIED desde `main`**\n"
      : "# ACTA\n**Estado:** ▶ este PR\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_VERIFY.md",
    ),
    [
      "# Verify",
      "## Canonical steps",
      "preview",
      "RELEASE_DEPLOY_D3_STARTED",
      "RELEASE_DEPLOY_D3_COMPLETED",
      "",
    ].join("\n"),
  );
}

describe("release-deploy-d3-post-deploy-verify", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_DEPLOY_D3_PRECONDITIONS.length, 5);
    assert.ok(
      RELEASE_DEPLOY_D3_PRECONDITIONS.includes(
        "release_deploy_verify_procedure_present",
      ),
    );
  });

  it("PASS when D2 CERTIFIED, verify procedure, preview, entry and tag exist", () => {
    const cwd = tempGitRepo();
    writeD3Fixtures(cwd);
    const r = runReleaseDeployD3PostDeployVerify({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_deploy_d2_acta_certified"));
    assert.ok(r.checks.includes("release_e2e_pass_tag_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_DEPLOY_D3_STARTED",
      "RELEASE_DEPLOY_D3_COMPLETED",
    ]);
  });

  it("FAIL when D2 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeD3Fixtures(cwd, { certified: false });
    const r = runReleaseDeployD3PostDeployVerify({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED/);
  });
});
