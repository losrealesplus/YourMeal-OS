/**
 * Unit tests for RELEASE-SMOKE S2 Auth capability.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_SMOKE_S2_MAPPED_TOKENS,
  runReleaseSmokeS2Auth,
} from "./release-smoke-s2-auth.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-smoke-s2-"));
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

describe("release-smoke-s2-auth", () => {
  it("exports mapped Auth tokens LOGIN → CANONICAL_SESSION", () => {
    assert.deepEqual(RELEASE_SMOKE_S2_MAPPED_TOKENS, [
      "LOGIN",
      "LOGIN_OK",
      "CANONICAL_SESSION",
    ]);
  });

  it("PASS when Auth runner, tag, credential slots, and surface exist", () => {
    const cwd = tempGitRepo();
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:ps002-canonical-auth": "node x.mjs" },
      }),
    );
    fs.writeFileSync(
      path.join(cwd, ".env.example"),
      "PS002_EMAIL=\nPS002_PASSWORD=\n",
    );
    fs.mkdirSync(path.join(cwd, "src", "auth"), { recursive: true });
    fs.writeFileSync(path.join(cwd, "src", "auth", "index.ts"), "export {}\n");

    const r = runReleaseSmokeS2Auth({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("ps002c_pass_tag_present"));
    assert.ok(r.checks.includes("fcr008_auth_prefix_intact"));
  });

  it("FAIL when ps002c-pass tag missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-smoke-s2-notag-"));
    execFileSync("git", ["init"], { cwd, stdio: "ignore" });
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:ps002-canonical-auth": "node x.mjs" },
      }),
    );
    fs.writeFileSync(
      path.join(cwd, ".env.example"),
      "PS002_EMAIL=\nPS002_PASSWORD=\n",
    );
    fs.mkdirSync(path.join(cwd, "src", "auth"), { recursive: true });

    const r = runReleaseSmokeS2Auth({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /ps002c-pass/);
  });
});
