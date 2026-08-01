/**
 * PS-002-C · Canonical Session Validation (Auth Supabase real)
 *
 * Outcomes (mutually exclusive):
 *   PASS    (exit 0) — pipeline ran and fulfilled the contract
 *   FAIL    (exit 1) — pipeline began and broke at a concrete step
 *   BLOCKED (exit 2) — pipeline never began (external preconditions)
 *
 * Required for PASS attempt (from `.env` or environment):
 *   PS002_EMAIL
 *   PS002_PASSWORD
 *
 * Optional:
 *   PS_BASE_URL          default http://127.0.0.1:8080
 *   PS002_ROUTE          default /auth/admin
 *   PS002_EXPECT_PATH    default /admin
 *
 * Usage:
 *   npm run bootstrap:e2e
 *   VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
 *   npm run test:ps002-canonical-auth
 *
 * Evidence: docs/10-validation/platform-stabilization/evidence/ps002c-canonical-auth.json
 *
 * Does NOT mock Auth · create users · bypass · or modify the application.
 */
import "dotenv/config";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import {
  buildPs002cEvidenceReport,
  checkPs002cPreconditions,
  classifyPs002cOutcome,
  computePipelineDurations,
  extractFcr008Steps,
  formatPipelineComparisonTable,
  parseFcr008ConsoleEvent,
  PS002C_EXIT,
  validateCanonicalPipeline,
} from "./lib/canonical-pipeline.mjs";
import { runPs002cPreflight } from "./lib/ps002c-preflight.mjs";
import { PS002C_BROWSER_POLICY } from "./lib/ps002c-playwright.mjs";
import { capturePs002cFormTimeoutEvidence } from "./lib/ps002c-ui-evidence.mjs";
import {
  buildHomePathGapEvidence,
  formatHomePathGapReport,
  parseFcr008Args,
  readPlaywrightConsoleArgs,
} from "./lib/ps002c-home-path-evidence.mjs";

const BASE = process.argv[2] || process.env.PS_BASE_URL || "http://127.0.0.1:8080";
const EMAIL = process.env.PS002_EMAIL || "";
const PASSWORD = process.env.PS002_PASSWORD || "";
const ROUTE = process.env.PS002_ROUTE || "/auth/admin";
const EXPECT_PATH = process.env.PS002_EXPECT_PATH || "/admin";
const OUT = path.resolve(
  "docs/10-validation/platform-stabilization/evidence",
);
fs.mkdirSync(OUT, { recursive: true });

function writeEvidence(payload) {
  const evidencePath = path.join(OUT, "ps002c-canonical-auth.json");
  fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2));
  return evidencePath;
}

function printBlocked(reason) {
  console.log(`
Status
BLOCKED

Reason
${reason}

Code Status
UNCHANGED
`);
}

function printFail(stop, rootCause) {
  console.log(`
Status
FAIL

STOP
${stop}

Root Cause
${rootCause}
`);
}

function printPass() {
  console.log(`
PS-002-C
PASS

Platform Stabilization
COMPLETE

Current Gate
CLOSED

Platform Ready
FLOW CERTIFICATION
`);
}

function emitBlocked(reason, extra = {}) {
  const evidencePath = writeEvidence(
    buildPs002cEvidenceReport({
      status: "BLOCKED",
      reason,
      pipeline: [],
      validation: null,
      duration_ms: null,
      code_status: "UNCHANGED",
      meta: {
        base: BASE,
        route: ROUTE,
        open_fcr: false,
        ...extra,
      },
    }),
  );
  printBlocked(reason);
  console.log(JSON.stringify({ status: "BLOCKED", reason, evidencePath }, null, 2));
  return PS002C_EXIT.BLOCKED;
}

async function main() {
  const preflight = await runPs002cPreflight({
    email: EMAIL,
    password: PASSWORD,
    baseUrl: BASE,
    route: ROUTE,
  });
  if (!preflight.ok) {
    process.exit(emitBlocked(preflight.reason));
  }

  // Defensive: keep legacy precondition helper aligned with preflight.
  const creds = checkPs002cPreconditions({
    email: EMAIL,
    password: PASSWORD,
    serverReachable: true,
  });
  if (!creds.ok) {
    process.exit(emitBlocked(creds.reason));
  }

  let browser;
  try {
    // Playwright 1.49+ new headless — no chromium_headless_shell required.
    // See docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md
    browser = await chromium.launch({ ...PS002C_BROWSER_POLICY.launchOptions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const looksMissingBrowser =
      /Executable doesn't exist|browserType\.launch|chromium_headless_shell|Failed to launch/i.test(
        msg,
      );
    process.exit(
      emitBlocked(
        looksMissingBrowser
          ? [
              "Playwright Chromium binary is missing or incomplete.",
              "PS-002-C uses Chromium new headless (channel: chromium) — not headless_shell.",
              `Fix: ${PS002C_BROWSER_POLICY.installCommand}`,
              "Or: npm run bootstrap:e2e",
              "Do not run bare `npx playwright install` (may hang).",
              "See: docs/10-validation/PS002C_PLAYWRIGHT_HEADLESS_SHELL.md",
              `Detail: ${msg}`,
            ].join("\n")
          : `Playwright/browser unavailable: ${msg}`,
      ),
    );
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleLines = [];
  const pageErrors = [];
  /** @type {Record<string, number>} */
  const stepTimestamps = {};
  /** @type {import("./lib/ps002c-home-path-evidence.mjs").Fcr008Event[]} */
  const fcr008Events = [];
  /** @type {Promise<void>[]} */
  const consoleParsePending = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const atMs = Date.now();
    consoleLines.push(text);
    // Legacy step timestamps from text (kept for duration_ms).
    const evText = parseFcr008ConsoleEvent(text, atMs);
    if (evText && stepTimestamps[evText.step] == null) {
      stepTimestamps[evText.step] = evText.atMs;
    }
    // HOME-PATH-002: capture structured payloads via jsonValue (Auth unchanged).
    if (!text.includes("[FCR-008]")) return;
    consoleParsePending.push(
      (async () => {
        const args = await readPlaywrightConsoleArgs(msg);
        const ev = parseFcr008Args(args, text, atMs);
        if (!ev) return;
        fcr008Events.push(ev);
        if (stepTimestamps[ev.step] == null) {
          stepTimestamps[ev.step] = ev.atMs;
        }
      })(),
    );
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  let exitCode = PS002C_EXIT.FAIL;

  try {
    try {
      await page.goto(`${BASE}${ROUTE}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
    } catch (e) {
      exitCode = emitBlocked(
        `Dev server unavailable: ${e instanceof Error ? e.message : String(e)}`,
      );
      return;
    }

    await page.waitForTimeout(800);

    if (await page.getByRole("button", { name: /^Entrar$/i }).count()) {
      if (await page.locator('input[name="bootstrap-profile"]').count()) {
        exitCode = emitBlocked(
          "Bootstrap Mode UI detected — set VITE_BOOTSTRAP_MODE=false",
        );
        return;
      }
    }

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    try {
      await emailInput.waitFor({ state: "visible", timeout: 30_000 });
    } catch (e) {
      // Instrumentation only — classify which auth.admin UI branch Playwright saw.
      // Does not change Auth / product behavior (FOPEBA: evidence before fix).
      const waitError = e instanceof Error ? e.message : String(e);
      let evidence;
      try {
        evidence = await capturePs002cFormTimeoutEvidence(page, {
          outDir: OUT,
          route: ROUTE,
          expectPath: EXPECT_PATH,
          waitError,
        });
      } catch (captureErr) {
        exitCode = emitBlocked(
          [
            `Auth form not available at ${ROUTE}.`,
            `UI evidence capture failed: ${captureErr instanceof Error ? captureErr.message : String(captureErr)}`,
            `Playwright: ${waitError}`,
          ].join("\n"),
          { waitError },
        );
        return;
      }
      exitCode = emitBlocked(evidence.reason, {
        form_timeout: evidence.payload,
        uiState: evidence.uiState,
        finalUrl: evidence.url,
        screenshot: evidence.screenshotPath,
      });
      return;
    }

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
    await Promise.all(consoleParsePending);
    const screenshotPath = path.join(OUT, "ps002c-after-login.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const fcrLines = consoleLines.filter((l) => l.includes("[FCR-008]"));
    const pipeline =
      fcr008Events.length > 0
        ? fcr008Events.map((e) => e.step)
        : extractFcr008Steps(fcrLines);
    const validation = validateCanonicalPipeline(pipeline);
    const duration_ms = computePipelineDurations(stepTimestamps);
    const pipelineStarted = pipeline.includes("LOGIN") || pipeline.length > 0;
    const home_path_gap = buildHomePathGapEvidence(fcr008Events);

    const outcome = classifyPs002cOutcome({
      preconditionOk: true,
      pipelineStarted,
      validationOk: validation.ok,
      navigated,
      firstFailure: validation.firstFailure,
    });

    // Submit ran but no FCR-008 events → FAIL at LOGIN (app path exercised).
    let status = outcome.status;
    let reason = outcome.reason;
    let stop = outcome.stop;
    if (!pipelineStarted) {
      status = "FAIL";
      stop = "LOGIN";
      reason = "No [FCR-008] pipeline events after submit (LOGIN never logged)";
    }

    const evidence = buildPs002cEvidenceReport({
      status,
      reason,
      pipeline,
      validation,
      duration_ms,
      code_status: "UNCHANGED",
      meta: {
        base: BASE,
        route: ROUTE,
        email: EMAIL.replace(/(.{2}).+(@.+)/, "$1***$2"),
        navigated,
        finalUrl: page.url(),
        expectPath: EXPECT_PATH,
        stop,
        open_fcr: status === "FAIL",
        stepTimestamps,
        comparisonTable: formatPipelineComparisonTable(validation),
        fcr008Logs: fcrLines,
        fcr008Events: fcr008Events.map((e) => ({
          step: e.step,
          detail: e.detail,
          atMs: e.atMs,
        })),
        home_path_gap,
        pageErrors,
        screenshot: screenshotPath,
        notes: [
          "Auth Supabase real (no Bootstrap, no mock)",
          "PASS | FAIL | BLOCKED — BLOCKED is not a code defect",
          "duration_ms is diagnostic only — not a performance gate",
          "HOME-PATH-002: home_path_gap captures ROLE_READY/STOP payloads (instrumentation only)",
        ],
      },
    });

    const evidencePath = writeEvidence(evidence);

    if (status === "PASS") {
      printPass();
      console.log(
        JSON.stringify(
          {
            status: "PASS",
            duplicates: evidence.duplicates,
            missing: evidence.missing,
            out_of_order: evidence.out_of_order,
            duration_ms: evidence.duration_ms,
            evidencePath,
          },
          null,
          2,
        ),
      );
      exitCode = PS002C_EXIT.PASS;
      return;
    }

    if (status === "BLOCKED") {
      printBlocked(reason);
      console.log(JSON.stringify({ status, reason, evidencePath }, null, 2));
      exitCode = PS002C_EXIT.BLOCKED;
      return;
    }

    printFail(stop ?? "LOGIN", reason);
    console.log(evidence.comparisonTable);
    if (
      home_path_gap.diagnosis.gap === "ROLE_READY_WITHOUT_HOME_PATH_RESOLVED" ||
      home_path_gap.stop
    ) {
      console.log(`\n${formatHomePathGapReport(home_path_gap)}\n`);
    }
    console.log(
      JSON.stringify(
        {
          status: "FAIL",
          stop,
          reason,
          duplicates: evidence.duplicates,
          missing: evidence.missing,
          out_of_order: evidence.out_of_order,
          duration_ms: evidence.duration_ms,
          home_path_gap: {
            stop_reason: home_path_gap.diagnosis.stop_reason,
            is_not_staff: home_path_gap.diagnosis.is_not_staff,
            roles_at_role_ready: home_path_gap.diagnosis.roles_at_role_ready,
            gap: home_path_gap.diagnosis.gap,
          },
          evidencePath,
        },
        null,
        2,
      ),
    );
    exitCode = PS002C_EXIT.FAIL;
  } catch (e) {
    const pipeline = extractFcr008Steps(
      consoleLines.filter((l) => l.includes("[FCR-008]")),
    );
    const validation = validateCanonicalPipeline(pipeline);
    const pipelineStarted = pipeline.length > 0;
    const msg = e instanceof Error ? e.message : String(e);

    if (!pipelineStarted) {
      exitCode = emitBlocked(`Environment error before LOGIN: ${msg}`, {
        error: msg,
        pageErrors,
      });
      return;
    }

    const evidencePath = writeEvidence(
      buildPs002cEvidenceReport({
        status: "FAIL",
        reason: msg,
        pipeline,
        validation,
        duration_ms: computePipelineDurations(stepTimestamps),
        code_status: "UNCHANGED",
        meta: {
          stop: validation.firstFailure ?? "LOGIN",
          error: msg,
          pageErrors,
          open_fcr: true,
        },
      }),
    );
    printFail(validation.firstFailure ?? "LOGIN", msg);
    console.log(JSON.stringify({ status: "FAIL", evidencePath }, null, 2));
    exitCode = PS002C_EXIT.FAIL;
  } finally {
    await browser.close().catch(() => undefined);
  }

  process.exit(exitCode);
}

main();
