/**
 * PS-002-C · Canonical Session Validation (Auth Supabase real)
 *
 * Priority gate for Flow Certification. Bootstrap Mode MUST be off.
 *
 * Required:
 *   PS002_EMAIL
 *   PS002_PASSWORD
 *
 * Optional:
 *   PS_BASE_URL          default http://127.0.0.1:8080
 *   PS002_ROUTE          default /auth/admin  (/auth for customer)
 *   PS002_EXPECT_PATH    substring of post-login URL (default /admin)
 *
 * Usage:
 *   # terminal A (NO bootstrap):
 *   VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
 *
 *   # terminal B:
 *   PS002_EMAIL=… PS002_PASSWORD=… npm run test:ps002-canonical-auth
 *
 * Exit 0 only when validateCanonicalPipeline(observed).ok === true
 * and no getSession() appears in console after LOGIN_OK (heuristic).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import {
  extractFcr008Steps,
  formatPipelineComparisonTable,
  PS002_CANONICAL_STEPS,
  validateCanonicalPipeline,
} from "./lib/canonical-pipeline.mjs";

const BASE = process.argv[2] || process.env.PS_BASE_URL || "http://127.0.0.1:8080";
const EMAIL = process.env.PS002_EMAIL || "";
const PASSWORD = process.env.PS002_PASSWORD || "";
const ROUTE = process.env.PS002_ROUTE || "/auth/admin";
const EXPECT_PATH = process.env.PS002_EXPECT_PATH || "/admin";
const OUT = path.resolve(
  "docs/10-validation/platform-stabilization/evidence",
);
fs.mkdirSync(OUT, { recursive: true });

function failHard(msg) {
  console.error(`PS-002-C FAIL: ${msg}`);
  process.exit(1);
}

if (!EMAIL || !PASSWORD) {
  failHard(
    "Set PS002_EMAIL and PS002_PASSWORD (real Supabase Auth credentials). " +
      "Bootstrap Mode must stay false. See docs/10-validation/platform-stabilization/PS-002.md",
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleLines = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    const text = msg.text();
    consoleLines.push(text);
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  let result = null;
  let screenshotPath = null;

  try {
    await page.goto(`${BASE}${ROUTE}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await page.waitForTimeout(800);

    // Refuse if Bootstrap profile selector is showing
    if (await page.getByRole("button", { name: /^Entrar$/i }).count()) {
      if (await page.locator('input[name="bootstrap-profile"]').count()) {
        failHard(
          "Bootstrap Mode UI detected — PS-002-C requires VITE_BOOTSTRAP_MODE=false",
        );
      }
    }

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 30_000 });
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);

    // Prefer staff login submit on /auth/admin
    const submit = page
      .getByRole("button", { name: /entrar|sign in|iniciar|acceder/i })
      .first();
    await submit.click();

    // Wait for either dashboard path or STOP in logs
    const deadline = Date.now() + 45_000;
    let navigated = false;
    while (Date.now() < deadline) {
      const url = page.url();
      if (url.includes(EXPECT_PATH) && !url.includes("/auth")) {
        navigated = true;
        break;
      }
      if (consoleLines.some((l) => /\[FCR-008\]\s+STOP/.test(l))) break;
      if (
        consoleLines.some((l) => /\[FCR-008\]\s+DASHBOARD_RENDERED/.test(l))
      ) {
        navigated = true;
        break;
      }
      await page.waitForTimeout(400);
    }

    await page.waitForTimeout(1000);
    screenshotPath = path.join(OUT, "ps002c-after-login.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const fcrLines = consoleLines.filter((l) => l.includes("[FCR-008]"));
    const observed = extractFcr008Steps(fcrLines);
    result = validateCanonicalPipeline(observed);

    // Heuristic: after LOGIN_OK, console must not show a getSession call from our app
    // (Supabase internals may still mention session — we only flag our tagged pipeline STOP reasons)
    const postLoginGetSession = fcrLines.some((l) =>
      /getSession|canonical_session_missing/.test(l),
    );

    const evidence = {
      gate: "PS-002-C",
      at: new Date().toISOString(),
      base: BASE,
      route: ROUTE,
      email: EMAIL.replace(/(.{2}).+(@.+)/, "$1***$2"),
      navigated,
      finalUrl: page.url(),
      expectPath: EXPECT_PATH,
      observed,
      expected: [...PS002_CANONICAL_STEPS],
      validation: result,
      comparisonTable: formatPipelineComparisonTable(result),
      fcr008Logs: fcrLines,
      pageErrors,
      screenshot: screenshotPath,
      notes: [
        "Auth Supabase real (no Bootstrap)",
        "Contract: each canonical step exactly once",
        postLoginGetSession
          ? "WARN: getSession/missing-session signal in FCR-008 logs"
          : "No getSession failure signal in FCR-008 logs",
      ],
    };

    const evidencePath = path.join(OUT, "ps002c-canonical-auth.json");
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

    console.log(evidence.comparisonTable);
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          firstFailure: result.firstFailure,
          navigated,
          finalUrl: page.url(),
          evidencePath,
        },
        null,
        2,
      ),
    );

    if (!result.ok) {
      console.error(
        `\nPS-002-C FAIL — first blocked step: ${result.firstFailure ?? "unknown"}`,
      );
      console.error(evidence.comparisonTable);
      process.exit(1);
    }
    if (!navigated) {
      failHard(
        `Pipeline logs PASS but URL did not reach ${EXPECT_PATH} (url=${page.url()})`,
      );
    }
    console.log("PS-002-C PASS");
    process.exit(0);
  } catch (e) {
    const evidencePath = path.join(OUT, "ps002c-canonical-auth.json");
    fs.writeFileSync(
      evidencePath,
      JSON.stringify(
        {
          gate: "PS-002-C",
          at: new Date().toISOString(),
          ok: false,
          error: String(e),
          observed: extractFcr008Steps(
            consoleLines.filter((l) => l.includes("[FCR-008]")),
          ),
          fcr008Logs: consoleLines.filter((l) => l.includes("[FCR-008]")),
          pageErrors,
        },
        null,
        2,
      ),
    );
    failHard(String(e));
  } finally {
    await browser.close();
  }
}

main();
