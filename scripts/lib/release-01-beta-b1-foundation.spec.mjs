/**
 * Unit tests for RELEASE-01-BETA B1 Foundation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_01_BETA_B1_PRECONDITIONS,
  runRelease01BetaB1Foundation,
} from "./release-01-beta-b1-foundation.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-beta-b1-"));
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
  execFileSync("git", ["tag", "ps002c-pass"], {
    cwd: dir,
    stdio: "ignore",
  });
  return dir;
}

function writeB1Fixtures(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:release-01-beta": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/platform-stabilization"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-01-beta"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/PLATFORM_V1_CLOSED.md"),
    "# CLOSED\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/IDENTITY_FOUNDATION_LOCK_v1.md"),
    "# LOCKED\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/platform-stabilization/PS002C_PASS_ACTA.md",
    ),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/RELEASE_01_BETA_SPEC.md"),
    "# Spec\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-01-beta/RELEASE_01_BETA_GATE.md",
    ),
    "# Gate\n",
  );
}

describe("release-01-beta-b1-foundation", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_01_BETA_B1_PRECONDITIONS.length, 7);
    assert.ok(RELEASE_01_BETA_B1_PRECONDITIONS.includes("ps002c_pass_tag_present"));
    assert.ok(RELEASE_01_BETA_B1_PRECONDITIONS.includes("foundation_locks_present"));
  });

  it("PASS when Beta runner, foundation locks, ps002c tag/acta, Spec and Gate exist", () => {
    const cwd = tempGitRepo();
    writeB1Fixtures(cwd);
    const r = runRelease01BetaB1Foundation({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("ps002c_pass_tag_present"));
    assert.ok(r.checks.includes("release_01_beta_canonical_pipeline_intact"));
    assert.ok(r.checks.includes("foundation_locks_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_BETA_B1_STARTED",
      "RELEASE_01_BETA_B1_COMPLETED",
    ]);
  });

  it("FAIL when ps002c-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "ps002c-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeB1Fixtures(cwd);
    const r = runRelease01BetaB1Foundation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /ps002c-pass/);
  });
});
