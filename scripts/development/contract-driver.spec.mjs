/**
 * Environment Contract unit tests.
 * HOUSEKEEPING-003
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isPlaceholder,
  parseDotenv,
  runContractDriver,
} from "./contract-driver.mjs";
import { ENVIRONMENT_CONTRACT } from "./environment-contract.mjs";

describe("environment-contract", () => {
  it("defines required Supabase + JAVA_HOME entries", () => {
    const keys = ENVIRONMENT_CONTRACT.variables.map((v) => v.key);
    assert.ok(keys.includes("JAVA_HOME"));
    assert.ok(keys.includes("ANDROID_HOME"));
    assert.ok(keys.includes("VITE_SUPABASE_URL"));
    assert.ok(keys.includes("VITE_SUPABASE_PUBLISHABLE_KEY"));
    assert.ok(keys.includes("VITE_POSTHOG_KEY"));
  });

  it("parseDotenv handles quotes and comments", () => {
    const parsed = parseDotenv(`
# comment
FOO=bar
BAZ="qux"
EMPTY=
`);
    assert.equal(parsed.FOO, "bar");
    assert.equal(parsed.BAZ, "qux");
    assert.equal(parsed.EMPTY, "");
  });

  it("isPlaceholder detects REPLACE_ME", () => {
    assert.equal(isPlaceholder("sb_publishable_REPLACE_ME", ["REPLACE_ME"]), true);
    assert.equal(isPlaceholder("sb_publishable_live", ["REPLACE_ME"]), false);
    assert.equal(isPlaceholder(""), true);
  });

  it("ERROR when required VITE_SUPABASE_URL missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-contract-"));
    fs.writeFileSync(
      path.join(dir, ".env.development.example"),
      'VITE_SUPABASE_URL=""\nVITE_SUPABASE_PUBLISHABLE_KEY="x"\nVITE_SUPABASE_PROJECT_ID="x"\n',
    );
    fs.writeFileSync(path.join(dir, ".env"), "VITE_SUPABASE_PROJECT_ID=demo\n");
    const r = runContractDriver({
      cwd: dir,
      ci: false,
      env: {
        PATH: "/usr/bin",
        JAVA_HOME: "/opt/jdk-21",
        ANDROID_HOME: "/opt/android-sdk",
      },
      pathExists: (p) => fs.existsSync(p),
    });
    assert.equal(r.status, "ERROR");
    const items = r.evidence.items;
    const url = items.find((i) => i.key === "VITE_SUPABASE_URL");
    assert.equal(url.ok, false);
  });

  it("marks VITE_POSTHOG_KEY optional missing without failing required", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-contract-"));
    fs.writeFileSync(
      path.join(dir, ".env.development.example"),
      [
        'VITE_SUPABASE_URL="https://example.supabase.co"',
        'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_live_key"',
        'VITE_SUPABASE_PROJECT_ID="demo"',
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(dir, ".env"),
      [
        'VITE_SUPABASE_URL="https://example.supabase.co"',
        'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_live_key"',
        'VITE_SUPABASE_PROJECT_ID="demo"',
      ].join("\n"),
    );
    const r = runContractDriver({
      cwd: dir,
      ci: false,
      env: {
        PATH: "/usr/bin",
        JAVA_HOME: "/opt/jdk-21",
        ANDROID_HOME: "/opt/android-sdk",
      },
      pathExists: (p) => fs.existsSync(p),
    });
    const posthog = r.evidence.items.find((i) => i.key === "VITE_POSTHOG_KEY");
    assert.equal(posthog.ok, false);
    assert.equal(posthog.required, false);
    assert.ok(r.status === "WARNING" || r.status === "PASS");
    assert.equal(r.evidence.missingRequired, 0);
  });

  it("treats REPLACE_ME publishable key as missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-contract-"));
    fs.writeFileSync(
      path.join(dir, ".env.development.example"),
      'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"\n',
    );
    fs.writeFileSync(
      path.join(dir, ".env"),
      [
        'VITE_SUPABASE_URL="https://example.supabase.co"',
        'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"',
        'VITE_SUPABASE_PROJECT_ID="demo"',
      ].join("\n"),
    );
    const r = runContractDriver({
      cwd: dir,
      ci: true,
      env: { PATH: "/usr/bin" },
      pathExists: (p) => fs.existsSync(p),
    });
    const key = r.evidence.items.find(
      (i) => i.key === "VITE_SUPABASE_PUBLISHABLE_KEY",
    );
    assert.equal(key.ok, false);
    assert.equal(r.status, "ERROR");
  });
});
