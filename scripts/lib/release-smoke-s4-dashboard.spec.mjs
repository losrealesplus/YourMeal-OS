/**
 * Unit tests for RELEASE-SMOKE S4 Dashboard capability.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_SMOKE_S4_MAPPED_TOKENS,
  runReleaseSmokeS4Dashboard,
} from "./release-smoke-s4-dashboard.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-smoke-s4-"));
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

function writeMinimalSurfaces(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:ps002-canonical-auth": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "src/auth"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "src/lib"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "src/routes"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src/auth/post-login-pipeline.ts"),
    [
      "HOME_PATH_RESOLVED",
      "NAVIGATE",
      "DASHBOARD_RENDERED",
    ].join("\n") + "\n",
  );
  fs.writeFileSync(
    path.join(cwd, "src/lib/resolve-home-path.ts"),
    'emit("HOME_PATH_RESOLVED")\n',
  );
  fs.writeFileSync(
    path.join(cwd, "src/routes/auth.tsx"),
    'log("NAVIGATE"); log("DASHBOARD_RENDERED");\n',
  );
}

describe("release-smoke-s4-dashboard", () => {
  it("exports dashboard tokens after ROLE_READY handoff", () => {
    assert.deepEqual(RELEASE_SMOKE_S4_MAPPED_TOKENS, [
      "HOME_PATH_RESOLVED",
      "NAVIGATE",
      "DASHBOARD_RENDERED",
    ]);
    assert.ok(!RELEASE_SMOKE_S4_MAPPED_TOKENS.includes("ROLE_READY"));
    assert.ok(!RELEASE_SMOKE_S4_MAPPED_TOKENS.includes("BOOTSTRAP_START"));
  });

  it("PASS when dashboard segment, tag, pipeline, and surfaces exist", () => {
    const cwd = tempGitRepo();
    writeMinimalSurfaces(cwd);

    const r = runReleaseSmokeS4Dashboard({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("fcr008_dashboard_segment_intact"));
    assert.ok(r.checks.includes("dashboard_surface_present"));
  });

  it("FAIL when post-login pipeline missing dashboard token", () => {
    const cwd = tempGitRepo();
    writeMinimalSurfaces(cwd);
    fs.writeFileSync(
      path.join(cwd, "src/auth/post-login-pipeline.ts"),
      "HOME_PATH_RESOLVED\nNAVIGATE\n",
    );

    const r = runReleaseSmokeS4Dashboard({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /DASHBOARD_RENDERED/);
  });
});
