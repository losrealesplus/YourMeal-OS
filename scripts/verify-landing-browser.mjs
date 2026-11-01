import { spawn } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;
const EVIDENCE_DIR = "/Users/alex/.gemini/antigravity/brain/a4aaca4a-b90c-4155-af68-d75937ee0731/landing-evidence";

async function waitServerReady(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) {
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server failed to start at ${url} within timeout`);
}

async function run() {
  console.log(`Starting Vite server on port ${PORT}...`);
  const server = spawn("npx", ["vite", "--port", String(PORT)], {
    cwd: "/Users/alex/Developer/YourMeal-OS",
    env: { ...process.env, PORT: String(PORT) },
    stdio: "pipe",
  });

  server.stdout.on("data", (d) => process.stdout.write(`[vite] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`[vite err] ${d}`));

  try {
    await waitServerReady(BASE_URL);
    console.log(`Vite server ready at ${BASE_URL}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const report = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      navigationTests: [],
      overflowTests: [],
      contrastEvidence: [],
      screenshots: [],
    };

    // 1. Navigation Anchor Verification at 1280px (Desktop)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const headerAnchors = ["#en-accion", "#modulos", "#flujo-operativo", "#contacto"];
    for (const anchor of headerAnchors) {
      const link = await page.$(`header nav a[href="${anchor}"]`);
      const targetElement = await page.$(anchor);
      const isVisible = targetElement ? await targetElement.isVisible() : false;

      // Click to test scroll jump
      if (link) {
        await link.click();
        await page.waitForTimeout(300);
      }

      report.navigationTests.push({
        anchor,
        linkFoundInHeader: !!link,
        targetElementFoundInDOM: !!targetElement,
        targetIsVisible: isVisible,
      });
    }

    // Capture hero & navigation screenshot
    const navShot = path.join(EVIDENCE_DIR, "desktop_1280_hero_nav.png");
    await page.screenshot({ path: navShot, clip: { x: 0, y: 0, width: 1280, height: 750 } });
    report.screenshots.push(navShot);

    // 2. Responsive & Horizontal Overflow Checks across breakpoints
    const viewports = [
      { name: "desktop-1440", width: 1440, height: 900 },
      { name: "laptop-1150", width: 1150, height: 800 },
      { name: "tablet-landscape-1024", width: 1024, height: 768 },
      { name: "tablet-portrait-768", width: 768, height: 1024 },
      { name: "mobile-375", width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(200);

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          scrollWidth: Math.max(docWidth, bodyWidth),
          innerWidth: winWidth,
          hasHorizontalOverflow: Math.max(docWidth, bodyWidth) > winWidth,
        };
      });

      report.overflowTests.push({
        viewport: vp.name,
        width: vp.width,
        scrollWidth: overflow.scrollWidth,
        hasHorizontalOverflow: overflow.hasHorizontalOverflow,
      });
    }

    // 3. OperationalFlow Screenshot at 1024px
    await page.setViewportSize({ width: 1024, height: 900 });
    const flowSection = await page.$("#flujo-operativo");
    if (flowSection) {
      const flowShot = path.join(EVIDENCE_DIR, "tablet_1024_operational_flow.png");
      await flowSection.screenshot({ path: flowShot });
      report.screenshots.push(flowShot);
    }

    // 4. Contact Section Screenshot
    const contactSection = await page.$("#contacto");
    if (contactSection) {
      const contactShot = path.join(EVIDENCE_DIR, "desktop_contacto_section.png");
      await contactSection.screenshot({ path: contactShot });
      report.screenshots.push(contactShot);
    }

    // 5. Mobile Overview Screenshot (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileShot = path.join(EVIDENCE_DIR, "mobile_375_hero.png");
    await page.screenshot({ path: mobileShot, clip: { x: 0, y: 0, width: 375, height: 812 } });
    report.screenshots.push(mobileShot);

    await browser.close();

    const reportFile = path.join(EVIDENCE_DIR, "browser_validation_report.json");
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n=== BROWSER VALIDATION REPORT SAVED TO ${reportFile} ===`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    server.kill("SIGTERM");
    console.log("Vite server terminated.");
  }
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
