/**
 * Unit tests for RELEASE-SMOKE S3 Bootstrap capability.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_SMOKE_S3_MAPPED_TOKENS,
  runReleaseSmokeS3Bootstrap,
} from "./release-smoke-s3-bootstrap.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-smoke-s3-"));
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
  execFileSync("git", ["tag", "ps002c-pass"], { cwd: dir, stdio: "ignore" });
  return dir;
}

describe("release-smoke-s3-bootstrap", () => {
  it("exports bootstrap tokens without Dashboard", () => {
    assert.deepEqual(RELEASE_SMOKE_S3_MAPPED_TOKENS, [
      "BOOTSTRAP_START",
      "IDENTITY_READY",
      "PROFILE_READY",
      "MEMBERSHIP_READY",
      "ROLE_READY",
    ]);
    assert.ok(!RELEASE_SMOKE_S3_MAPPED_TOKENS.includes("DASHBOARD_RENDERED"));
  });

  it("PASS when bootstrap segment, tag, pipeline, and surface exist", () => {
    const cwd = tempGitRepo();
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:ps002-canonical-auth": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "src/auth"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "src/lib"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "src/auth/post-login-pipeline.ts"),
      [
        "BOOTSTRAP_START",
        "IDENTITY_READY",
        "PROFILE_READY",
        "MEMBERSHIP_READY",
        "ROLE_READY",
        "DASHBOARD_RENDERED",
      ].join("\n") + "\n",
    );
    fs.writeFileSync(
      path.join(cwd, "src/lib/admin-auth-bootstrap.ts"),
      "export {}\n",
    );

    const r = runReleaseSmokeS3Bootstrap({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("fcr008_bootstrap_segment_intact"));
    assert.ok(r.checks.includes("bootstrap_surface_present"));
  });

  it("FAIL when post-login pipeline missing bootstrap token", () => {
    const cwd = tempGitRepo();
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:ps002-canonical-auth": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "src/auth"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "src/lib"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "src/auth/post-login-pipeline.ts"),
      "BOOTSTRAP_START\nIDENTITY_READY\n",
    );
    fs.writeFileSync(
      path.join(cwd, "src/lib/admin-auth-bootstrap.ts"),
      "export {}\n",
    );

    const r = runReleaseSmokeS3Bootstrap({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /PROFILE_READY|MEMBERSHIP_READY|ROLE_READY/);
  });
});
