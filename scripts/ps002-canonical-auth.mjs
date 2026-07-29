/**
 * PS-002-C · Canonical Session Validation (Auth Supabase real)
 *
 * Priority gate for Flow Certification. Bootstrap Mode MUST be off.
 * Credentials are part of the contract — do not simulate Auth.
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
 *   VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
 *   PS002_EMAIL=… PS002_PASSWORD=… npm run test:ps002-canonical-auth
 *
 * Evidence: docs/10-validation/platform-stabilization/evidence/ps002c-canonical-auth.json
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import {
  buildPs002cEvidenceReport,
  computePipelineDurations,
  extractFcr008Steps,
  formatPipelineComparisonTable,
  parseFcr008ConsoleEvent,
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
      "Bootstrap Mode must stay false. Credentials are part of the PS-002-C contract — do not mock Auth. " +
      "See docs/10-validation/platform-stabilization/PS-002.md",
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleLines = [];
  const pageErrors = [];
  /** @type {Record<string, number>} first-seen wall clock per step */
  const stepTimestamps = {};

  page.on("console", (msg) => {
    const text = msg.text();
    const atMs = Date.now();
    consoleLines.push(text);
    const ev = parseFcr008ConsoleEvent(text, atMs);
    if (ev && stepTimestamps[ev.step] == null) {
      stepTimestamps[ev.step] = ev.atMs;
    }
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  const writeEvidence = (payload) => {
    const evidencePath = path.join(OUT, "ps002c-canonical-auth.json");
    fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2));
    return evidencePath;
  };

  try {
    await page.goto(`${BASE}${ROUTE}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await page.waitForTimeout(800);

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

    const submit = page
      .getByRole("button", { name: /entrar|sign in|iniciar|acceder/i })
      .first();
    await submit.click();

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
    const screenshotPath = path.join(OUT, "ps002c-after-login.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const fcrLines = consoleLines.filter((l) => l.includes("[FCR-008]"));
    const pipeline = extractFcr008Steps(fcrLines);
    const validation = validateCanonicalPipeline(pipeline);
    const duration_ms = computePipelineDurations(stepTimestamps);

    const status =
      validation.ok && navigated
        ? "PASS"
        : validation.ok && !navigated
          ? "FAIL"
          : "FAIL";

    const postLoginGetSession = fcrLines.some((l) =>
      /getSession|canonical_session_missing/.test(l),
    );

    const evidence = buildPs002cEvidenceReport({
      status,
      pipeline,
      validation,
      duration_ms,
      meta: {
        base: BASE,
        route: ROUTE,
        email: EMAIL.replace(/(.{2}).+(@.+)/, "$1***$2"),
        navigated,
        finalUrl: page.url(),
        expectPath: EXPECT_PATH,
        stepTimestamps,
        comparisonTable: formatPipelineComparisonTable(validation),
        fcr008Logs: fcrLines,
        pageErrors,
        screenshot: screenshotPath,
        notes: [
          "Auth Supabase real (no Bootstrap, no mock)",
          "Contract: each canonical step exactly once",
          "duration_ms is diagnostic only — not a performance gate",
          postLoginGetSession
            ? "WARN: getSession/missing-session signal in FCR-008 logs"
            : "No getSession failure signal in FCR-008 logs",
        ],
      },
    });

    const evidencePath = writeEvidence(evidence);

    console.log(evidence.comparisonTable);
    console.log(
      JSON.stringify(
        {
          status: evidence.status,
          firstFailure: evidence.firstFailure,
          duplicates: evidence.duplicates,
          missing: evidence.missing,
          out_of_order: evidence.out_of_order,
          duration_ms: evidence.duration_ms,
          navigated,
          finalUrl: page.url(),
          evidencePath,
        },
        null,
        2,
      ),
    );

    if (status !== "PASS") {
      console.error(
        `\nPS-002-C FAIL — first blocked step: ${evidence.firstFailure ?? (navigated ? "unknown" : "NAVIGATE/DASHBOARD")}`,
      );
      console.error(evidence.comparisonTable);
      process.exit(1);
    }

    console.log("PS-002-C PASS");
    process.exit(0);
  } catch (e) {
    const pipeline = extractFcr008Steps(
      consoleLines.filter((l) => l.includes("[FCR-008]")),
    );
    const validation = validateCanonicalPipeline(pipeline);
    writeEvidence(
      buildPs002cEvidenceReport({
        status: "FAIL",
        pipeline,
        validation,
        duration_ms: computePipelineDurations(stepTimestamps),
        meta: {
          error: String(e),
          fcr008Logs: consoleLines.filter((l) => l.includes("[FCR-008]")),
          pageErrors,
          stepTimestamps,
        },
      }),
    );
    failHard(String(e));
  } finally {
    await browser.close();
  }
}

main();
