import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  PS002C_BROWSER_POLICY,
  findChromiumFrameworkBinary,
  getPlaywrightBrowsersCacheDir,
  inspectChromiumIntegrity,
  resolveChromiumBrowserDirectory,
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

/**
 * @param {string} root
 */
function writeLinuxComplete(root) {
  const browserDir = path.join(root, "chromium-1148");
  const chromeDir = path.join(browserDir, "chrome-linux");
  fs.mkdirSync(chromeDir, { recursive: true });
  const exe = path.join(chromeDir, "chrome");
  fs.writeFileSync(exe, "");
  fs.writeFileSync(path.join(chromeDir, "icudtl.dat"), "");
  fs.writeFileSync(path.join(chromeDir, "resources.pak"), "");
  fs.writeFileSync(path.join(browserDir, "INSTALLATION_COMPLETE"), "");
  return { browserDir, exe };
}

/**
 * Incomplete mac layout: launcher only (operator failure mode).
 * @param {string} root
 */
function writeMacIncomplete(root) {
  const browserDir = path.join(root, "chromium-1148");
  const macOs = path.join(
    browserDir,
    "chrome-mac",
    "Chromium.app",
    "Contents",
    "MacOS",
  );
  fs.mkdirSync(macOs, { recursive: true });
  const exe = path.join(macOs, "Chromium");
  fs.writeFileSync(exe, "");
  // No INSTALLATION_COMPLETE, no Framework
  return { browserDir, exe };
}

/**
 * Complete mac layout with Framework + Resources + marker.
 * @param {string} root
 */
function writeMacComplete(root) {
  const { browserDir, exe } = writeMacIncomplete(root);
  const contents = path.dirname(path.dirname(exe));
  fs.writeFileSync(path.join(contents, "Info.plist"), "<plist/>");
  const versionDir = path.join(
    contents,
    "Frameworks",
    "Chromium Framework.framework",
    "Versions",
    "131.0.6778.33",
  );
  fs.mkdirSync(path.join(versionDir, "Resources"), { recursive: true });
  fs.writeFileSync(path.join(versionDir, "Chromium Framework"), "");
  fs.symlinkSync(
    "131.0.6778.33",
    path.join(
      contents,
      "Frameworks",
      "Chromium Framework.framework",
      "Versions",
      "Current",
    ),
  );
  fs.writeFileSync(path.join(browserDir, "INSTALLATION_COMPLETE"), "");
  return { browserDir, exe };
}

describe("inspectChromiumIntegrity", () => {
  it("FAIL when macOS launcher exists but Framework is missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-int-"));
    const { exe } = writeMacIncomplete(root);
    const result = inspectChromiumIntegrity(exe, { platform: "darwin" });
    assert.equal(result.ok, false);
    assert.ok(
      result.missing.some((m) => /Chromium Framework\.framework/.test(m)),
    );
    assert.ok(result.missing.some((m) => /INSTALLATION_COMPLETE/.test(m)));
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("PASS when macOS Framework + marker + Resources exist", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-int-"));
    const { exe, browserDir } = writeMacComplete(root);
    const result = inspectChromiumIntegrity(exe, { platform: "darwin" });
    assert.equal(result.ok, true, result.missing.join("\n"));
    assert.equal(result.browserDirectory, browserDir);
    const fw = findChromiumFrameworkBinary(
      path.join(
        path.dirname(path.dirname(exe)),
        "Frameworks",
        "Chromium Framework.framework",
      ),
    );
    assert.ok(fw);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("PASS for complete linux layout", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-int-"));
    const { exe } = writeLinuxComplete(root);
    const result = inspectChromiumIntegrity(exe, { platform: "linux" });
    assert.equal(result.ok, true, result.missing.join("\n"));
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("FAIL for linux chrome without resources.pak", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-int-"));
    const { exe, browserDir } = writeLinuxComplete(root);
    fs.unlinkSync(path.join(path.dirname(exe), "resources.pak"));
    const result = inspectChromiumIntegrity(exe, { platform: "linux" });
    assert.equal(result.ok, false);
    assert.ok(result.missing.some((m) => /resources\.pak/.test(m)));
    assert.equal(
      resolveChromiumBrowserDirectory(exe),
      browserDir,
    );
    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe("resolvePs002cBrowser", () => {
  it("ok when executable + integrity pass (linux fixture)", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-pw-"));
    const { exe } = writeLinuxComplete(root);
    const result = resolvePs002cBrowser(
      {
        launch: async () => ({}),
        executablePath: () => exe,
      },
      { platform: "linux" },
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.executablePath, exe);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("BLOCKED with Chromium installation incomplete when Framework missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ps002c-pw-"));
    const { exe } = writeMacIncomplete(root);
    const result = resolvePs002cBrowser(
      {
        launch: async () => ({}),
        executablePath: () => exe,
      },
      { platform: "darwin" },
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /^Chromium installation incomplete/m);
      assert.match(result.reason, /Chromium Framework\.framework/);
      assert.match(result.reason, /rm -rf/);
    }
    fs.rmSync(root, { recursive: true, force: true });
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
