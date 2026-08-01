import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runPs002cPreflight } from "./ps002c-preflight.mjs";

const okBrowser = () => ({ ok: true, executablePath: "/fake/chrome" });

describe("runPs002cPreflight", () => {
  /** @type {string[]} */
  const temps = [];

  afterEach(() => {
    for (const dir of temps.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function tempCwd(withEnvFile, envBody) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-preflight-"));
    temps.push(dir);
    if (withEnvFile) {
      fs.writeFileSync(
        path.join(dir, ".env"),
        envBody ??
          [
            "PS002_EMAIL=x",
            // Non-placeholder shape for DX tests (not a real project key).
            "VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_not_placeholder",
          ].join("\n"),
        "utf8",
      );
    }
    return dir;
  }

  it("BLOCKED when .env is missing", async () => {
    const cwd = tempCwd(false);
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /\.env/);
      assert.match(result.reason, /cp \.env\.example \.env/);
    }
  });

  it("BLOCKED when VITE_SUPABASE_PUBLISHABLE_KEY is REPLACE_ME", async () => {
    const cwd = tempCwd(
      true,
      [
        "PS002_EMAIL=x",
        'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"',
      ].join("\n"),
    );
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Invalid VITE_SUPABASE_PUBLISHABLE_KEY/);
      assert.match(result.reason, /placeholder|REPLACE_ME/i);
    }
  });

  it("BLOCKED when VITE_SUPABASE_PUBLISHABLE_KEY is empty", async () => {
    const cwd = tempCwd(true, "PS002_EMAIL=x\nVITE_SUPABASE_PUBLISHABLE_KEY=\n");
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Invalid VITE_SUPABASE_PUBLISHABLE_KEY/);
    }
  });

  it("BLOCKED when PS002_EMAIL is empty", async () => {
    const cwd = tempCwd(true);
    const result = await runPs002cPreflight({
      cwd,
      email: "",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /PS002_EMAIL/);
  });

  it("BLOCKED when PS002_PASSWORD is empty", async () => {
    const cwd = tempCwd(true);
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "  ",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /PS002_PASSWORD/);
  });

  it("BLOCKED when Playwright browser is missing", async () => {
    const cwd = tempCwd(true);
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: () => ({
        ok: false,
        reason:
          "Chromium binary is missing (required for channel: chromium).\nFix: npx playwright install chromium --no-shell",
      }),
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Chromium|channel: chromium/);
      assert.match(result.reason, /--no-shell|bootstrap:e2e|install chromium/);
    }
  });

  it("BLOCKED when server is down", async () => {
    const cwd = tempCwd(true);
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: false, error: "ECONNREFUSED" }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Dev server/);
      assert.match(result.reason, /ECONNREFUSED/);
    }
  });

  it("ok when all preconditions pass", async () => {
    const cwd = tempCwd(true);
    const result = await runPs002cPreflight({
      cwd,
      email: "a@b.c",
      password: "secret",
      resolveBrowser: okBrowser,
      probeServer: async () => ({ ok: true, status: 200 }),
    });
    assert.equal(result.ok, true);
  });
});
