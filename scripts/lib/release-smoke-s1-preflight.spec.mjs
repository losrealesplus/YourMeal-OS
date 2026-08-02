/**
 * Unit tests for RELEASE-SMOKE S1 preflight.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_SMOKE_OFFICIAL_PROJECT_ID,
  runReleaseSmokeS1Preflight,
} from "./release-smoke-s1-preflight.mjs";

function tempDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-smoke-s1-"));
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), body, "utf8");
  }
  return dir;
}

const GOOD_ENV = `
SUPABASE_PROJECT_ID="${RELEASE_SMOKE_OFFICIAL_PROJECT_ID}"
VITE_SUPABASE_PROJECT_ID="${RELEASE_SMOKE_OFFICIAL_PROJECT_ID}"
VITE_SUPABASE_URL="https://${RELEASE_SMOKE_OFFICIAL_PROJECT_ID}.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
`;

const GOOD_PKG = JSON.stringify({
  scripts: { "test:release-smoke": "node scripts/release-smoke-canonical.mjs" },
});

describe("release-smoke-s1-preflight", () => {
  it("PASS when env contract + runner script are documented", () => {
    const cwd = tempDir({
      ".env.example": GOOD_ENV,
      "package.json": GOOD_PKG,
    });
    const r = runReleaseSmokeS1Preflight({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("env_example_exists"));
    assert.ok(r.checks.includes("test_release_smoke_script_present"));
  });

  it("FAIL when .env.example missing", () => {
    const cwd = tempDir({ "package.json": GOOD_PKG });
    const r = runReleaseSmokeS1Preflight({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /Missing \.env\.example/);
  });

  it("FAIL when publishable key invents a non-placeholder value", () => {
    const cwd = tempDir({
      ".env.example": GOOD_ENV.replace(
        "sb_publishable_REPLACE_ME",
        "sb_publishable_real_looking_key",
      ),
      "package.json": GOOD_PKG,
    });
    const r = runReleaseSmokeS1Preflight({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /REPLACE_ME/);
  });

  it("FAIL when test:release-smoke script missing", () => {
    const cwd = tempDir({
      ".env.example": GOOD_ENV,
      "package.json": JSON.stringify({ scripts: {} }),
    });
    const r = runReleaseSmokeS1Preflight({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /test:release-smoke/);
  });
});
