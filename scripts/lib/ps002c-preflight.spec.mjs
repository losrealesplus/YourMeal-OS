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

  function tempCwd(withEnvFile) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-preflight-"));
    temps.push(dir);
    if (withEnvFile) {
      fs.writeFileSync(path.join(dir, ".env"), "PS002_EMAIL=x\n", "utf8");
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
        reason: "Chromium / headless_shell binary is not installed.\nFix: npm run bootstrap:e2e",
      }),
      probeServer: async () => ({ ok: true }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /headless_shell|bootstrap:e2e/);
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
