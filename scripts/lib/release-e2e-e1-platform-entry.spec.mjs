/**
 * Unit tests for RELEASE-E2E E1 Platform Entry.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_E2E_E1_MAPPED_TOKENS,
  runReleaseE2eE1PlatformEntry,
} from "./release-e2e-e1-platform-entry.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-e2e-e1-"));
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
  execFileSync("git", ["tag", "release-smoke-pass"], {
    cwd: dir,
    stdio: "ignore",
  });
  return dir;
}

describe("release-e2e-e1-platform-entry", () => {
  it("maps RELEASE-SMOKE S1…S4 tokens", () => {
    assert.equal(RELEASE_E2E_E1_MAPPED_TOKENS.length, 8);
    assert.equal(RELEASE_E2E_E1_MAPPED_TOKENS[0], "RELEASE_SMOKE_S1_STARTED");
    assert.equal(RELEASE_E2E_E1_MAPPED_TOKENS[7], "RELEASE_SMOKE_S4_COMPLETED");
  });

  it("PASS when Smoke script, tag, acta, and spec exist", () => {
    const cwd = tempGitRepo();
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:release-smoke": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "docs/10-validation/release-smoke"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "docs/10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md"),
      "# PASS\n",
    );
    fs.writeFileSync(
      path.join(cwd, "docs/00-status/RELEASE_SMOKE_SPEC.md"),
      "# Spec\n",
    );

    const r = runReleaseE2eE1PlatformEntry({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_smoke_pass_tag_present"));
    assert.ok(r.checks.includes("release_smoke_canonical_pipeline_intact"));
  });

  it("FAIL when release-smoke-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "release-smoke-pass"], {
      cwd,
      stdio: "ignore",
    });
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:release-smoke": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "docs/10-validation/release-smoke"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "docs/10-validation/release-smoke/RELEASE_SMOKE_PASS_ACTA.md"),
      "# PASS\n",
    );
    fs.writeFileSync(
      path.join(cwd, "docs/00-status/RELEASE_SMOKE_SPEC.md"),
      "# Spec\n",
    );

    const r = runReleaseE2eE1PlatformEntry({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /release-smoke-pass/);
  });
});
