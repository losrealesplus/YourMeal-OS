import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startLabUi } from "./server.mjs";
test("local review UI: mobile/desktop, hashes visible, disabled production, no runtime errors", async () => {
  const ui = await startLabUi(0);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(ui.url);
    await page.waitForFunction(
      () => document.getElementById("project").textContent === "TEST_ONLY",
    );
    assert.equal(await page.locator("#migrations li").count(), 3);
    assert.match(await page.locator("#intent").textContent(), /^[0-9a-f]{64}$/);
    assert.equal(await page.locator("button").isDisabled(), true);
    assert.deepEqual(errors, []);
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.screenshot({ path: "/private/tmp/a5-root-ui-test.png", fullPage: true });
  } finally {
    if (browser) await browser.close();
    await ui.close();
  }
});
