import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  PS002C_BROWSER_POLICY,
  getPlaywrightBrowsersCacheDir,
  resolvePs002cBrowser,
} from "./ps002c-playwright.mjs";

describe("PS002C_BROWSER_POLICY", () => {
  it("uses official Chromium new headless (channel: chromium)", () => {
    assert.equal(PS002C_BROWSER_POLICY.launchOptions.headless, true);
    assert.equal(PS002C_BROWSER_POLICY.launchOptions.channel, "chromium");
    assert.deepEqual(PS002C_BROWSER_POLICY.installArgs, [
      "install",
      "chromium",
      "--no-shell",
    ]);
    assert.match(
      PS002C_BROWSER_POLICY.installCommand,
      /install chromium --no-shell/,
    );
  });

  it("does not recommend bare playwright install", () => {
    assert.notEqual(
      PS002C_BROWSER_POLICY.installCommand.trim(),
      "npx playwright install",
    );
  });
});

describe("getPlaywrightBrowsersCacheDir", () => {
  it("respects PLAYWRIGHT_BROWSERS_PATH", () => {
    const prev = process.env.PLAYWRIGHT_BROWSERS_PATH;
    process.env.PLAYWRIGHT_BROWSERS_PATH = "/tmp/pw-test-cache";
    try {
      assert.equal(getPlaywrightBrowsersCacheDir(), "/tmp/pw-test-cache");
    } finally {
      if (prev === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
      else process.env.PLAYWRIGHT_BROWSERS_PATH = prev;
    }
  });

  it("uses platform default under ms-playwright", () => {
    const prev = process.env.PLAYWRIGHT_BROWSERS_PATH;
    delete process.env.PLAYWRIGHT_BROWSERS_PATH;
    try {
      const dir = getPlaywrightBrowsersCacheDir();
      assert.match(dir, /ms-playwright$/);
      if (process.platform === "darwin") {
        assert.match(dir, /Library\/Caches/);
      }
    } finally {
      if (prev !== undefined) process.env.PLAYWRIGHT_BROWSERS_PATH = prev;
    }
  });
});

describe("resolvePs002cBrowser", () => {
  it("ok when executable exists and is not headless_shell", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-pw-"));
    const exe = path.join(dir, "chrome");
    fs.writeFileSync(exe, "");
    const result = resolvePs002cBrowser({
      launch: async () => ({}),
      executablePath: () => exe,
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.executablePath, exe);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("fails when executable missing", () => {
    const result = resolvePs002cBrowser({
      launch: async () => ({}),
      executablePath: () => "/no/such/chrome",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /Chromium binary is missing/);
      assert.match(result.reason, /--no-shell/);
      assert.doesNotMatch(result.reason, /^Fix: npx playwright install$/m);
      assert.match(result.reason, /Do not run bare/);
    }
  });

  it("fails when path looks like headless_shell", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-pw-"));
    const exe = path.join(dir, "headless_shell");
    fs.writeFileSync(exe, "");
    const result = resolvePs002cBrowser({
      launch: async () => ({}),
      executablePath: () => exe,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /headless_shell/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
