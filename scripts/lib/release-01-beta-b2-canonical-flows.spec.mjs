/**
 * Unit tests for RELEASE-01-BETA B2 Canonical Flows.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_01_BETA_B2_PRECONDITIONS,
  runRelease01BetaB2CanonicalFlows,
} from "./release-01-beta-b2-canonical-flows.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b2-"));
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
  for (const tag of ["flow01-pass", "flow02-pass", "flow03-pass", "flow04-pass"]) {
    execFileSync("git", ["tag", tag], { cwd: dir, stdio: "ignore" });
  }
  return dir;
}

function writeB2Fixtures(cwd) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-01-beta"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-01"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-02"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-03"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-04"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md",
    ),
    "# B1\n**Estado:** ✅ **CERTIFIED desde `main`**\n",
  );
  for (const n of [1, 2, 3, 4]) {
    fs.writeFileSync(
      path.join(cwd, `docs/10-validation/flow-0${n}/FLOW0${n}_PASS_ACTA.md`),
      `# FLOW-0${n} PASS\n`,
    );
  }
}

describe("release-01-beta-b2-canonical-flows", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_01_BETA_B2_PRECONDITIONS.length, 9);
    assert.ok(
      RELEASE_01_BETA_B2_PRECONDITIONS.includes("flow01_pass_tag_present"),
    );
    assert.ok(
      RELEASE_01_BETA_B2_PRECONDITIONS.includes(
        "release_01_beta_b1_acta_certified",
      ),
    );
  });

  it("PASS when B1 CERTIFIED and all four Flow tags/actas exist", () => {
    const cwd = tempGitRepo();
    writeB2Fixtures(cwd);
    const r = runRelease01BetaB2CanonicalFlows({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("flow04_pass_tag_present"));
    assert.ok(r.checks.includes("flow01_pass_acta_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_BETA_B2_STARTED",
      "RELEASE_01_BETA_B2_COMPLETED",
    ]);
  });

  it("FAIL when a flow-pass tag is missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "flow03-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeB2Fixtures(cwd);
    const r = runRelease01BetaB2CanonicalFlows({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /flow03-pass/);
  });

  it("FAIL when B1 acta is not CERTIFIED from main", () => {
    const cwd = tempGitRepo();
    writeB2Fixtures(cwd);
    fs.writeFileSync(
      path.join(
        cwd,
        "docs/10-validation/release-01-beta/RELEASE_01_BETA_001_B1_ACTA.md",
      ),
      "# B1\n**Estado:** ▶ este PR\n",
    );
    const r = runRelease01BetaB2CanonicalFlows({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED from main/);
  });
});
