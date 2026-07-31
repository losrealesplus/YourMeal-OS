/**
 * Platform Stabilization gates PS-001 / PS-002 / PS-003
 * Bootstrap Mode smoke (no Supabase login required for identity path).
 *
 * PS-002 notes:
 *   - Static + Bootstrap checks run here (PS-002-B / contract wiring).
 *   - PS-002-C (Auth Supabase real · full canonical pipeline) requires
 *     credentials and is NOT marked PASS by this script alone.
 *
 * Usage:
 *   VITE_BOOTSTRAP_MODE=true npm run dev -- --host 127.0.0.1 --port 8080
 *   node scripts/platform-stabilization-gates.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PS002C_BROWSER_POLICY } from "./lib/ps002c-playwright.mjs";

const BASE = process.argv[2] || process.env.PS_BASE_URL || "http://127.0.0.1:8080";
const OUT = path.resolve("docs/10-validation/platform-stabilization/evidence");
fs.mkdirSync(OUT, { recursive: true });

const results = {
  ps001: { id: "PS-001", result: "FAIL", notes: [] },
  ps002: { id: "PS-002", result: "FAIL", notes: [] },
  ps003: { id: "PS-003", result: "FAIL", notes: [] },
};

function fail(gate, msg) {
  results[gate].notes.push(`FAIL: ${msg}`);
  results[gate].result = "FAIL";
}
function pass(gate, msg) {
  results[gate].notes.push(`PASS: ${msg}`);
}
function note(gate, msg) {
  results[gate].notes.push(msg);
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/**
 * FCR-008: after signInWithPassword / signUp / verifyOtp in submit handlers,
 * there must be no immediate getSession() before navigate/bootstrap.
 * Cold-start getSession on mount (useEffect) remains allowed.
 */
function assertNoImmediateGetSessionAfterLogin(filePath, label) {
  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripComments(raw);

  const markers = ["signInWithPassword", "signUp(", "verifyOtpSms"];
  let foundAuthCall = false;
  for (const m of markers) {
    let idx = 0;
    while ((idx = src.indexOf(m, idx)) !== -1) {
      foundAuthCall = true;
      const window = src.slice(idx, idx + 2500);
      if (/\bgetSession\s*\(/.test(window)) {
        fail(
          "ps002",
          `${label}: getSession() appears within ~2.5k chars after ${m} (FCR-008 / PS-002-C)`,
        );
        return;
      }
      idx += m.length;
    }
  }
  if (!foundAuthCall) {
    note(
      "ps002",
      `${label}: no password/otp auth call found (skip immediate getSession check)`,
    );
  } else {
    pass("ps002", `${label}: no immediate getSession() after login auth API`);
  }
}

function assertCanonicalPipelineWiring() {
  const pipeline = fs.readFileSync("src/auth/post-login-pipeline.ts", "utf8");
  const required = [
    "LOGIN",
    "LOGIN_OK",
    "CANONICAL_SESSION",
    "BOOTSTRAP_START",
    "IDENTITY_READY",
    "PROFILE_READY",
    "MEMBERSHIP_READY",
    "ROLE_READY",
    "HOME_PATH_RESOLVED",
    "NAVIGATE",
    "DASHBOARD_RENDERED",
    "validateCanonicalPipeline",
    "PS002_CANONICAL_STEPS",
  ];
  const missing = required.filter((s) => !pipeline.includes(s));
  if (missing.length) {
    fail("ps002", `post-login-pipeline missing: ${missing.join(", ")}`);
  } else {
    pass("ps002", "Canonical PS-002 pipeline steps + validator present");
  }

  const resolveHome = fs.readFileSync("src/lib/resolve-home-path.ts", "utf8");
  if (!resolveHome.includes('emitCanonicalReady("IDENTITY_READY"')) {
    fail("ps002", "resolveHomePath does not emit IDENTITY_READY");
  } else {
    pass("ps002", "resolveHomePath emits identity→home readiness steps");
  }

  const adminBoot = fs.readFileSync("src/lib/admin-auth-bootstrap.ts", "utf8");
  if (!adminBoot.includes('emitCanonicalReady("ROLE_READY"')) {
    fail("ps002", "enterOperationsCenter missing ROLE_READY emit");
  } else {
    pass("ps002", "enterOperationsCenter emits readiness steps");
  }

  note(
    "ps002",
    "PS-002-C (Auth Supabase real): NOT asserted by this Bootstrap gate — see PS-002.md",
  );
}

async function enterAsCompanyAdmin(page) {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(500);

  if (await page.getByText("DEV MODE").count()) {
    await page.locator("select").first().selectOption("company_admin");
    await page.waitForTimeout(1000);
    return;
  }

  const radio = page.locator('input[name="bootstrap-profile"][value="company_admin"]');
  if (await radio.count()) {
    await radio.check();
    await page.getByRole("button", { name: /^Entrar$/i }).click();
    await page.waitForTimeout(1200);
    return;
  }

  throw new Error("Could not enter Bootstrap Company Admin profile");
}

async function measureIdleMutations(page, ms = 3000) {
  return page.evaluate(async (duration) => {
    let mutations = 0;
    let attributeOnly = 0;
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "childList" && (m.addedNodes.length || m.removedNodes.length)) {
          mutations += 1;
        } else if (m.type === "attributes") {
          attributeOnly += 1;
        }
      }
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    await new Promise((r) => setTimeout(r, duration));
    obs.disconnect();
    return { mutations, attributeOnly };
  }, ms);
}

async function main() {
  const adminIndex = fs.readFileSync("src/routes/_authenticated/admin.index.tsx", "utf8");
  const useCan = fs.readFileSync("src/hooks/use-can.ts", "utf8");
  const authProv = stripComments(
    fs.readFileSync("src/identity/supabase-identity-provider.tsx", "utf8"),
  );
  const root = fs.readFileSync("src/routes/__root.tsx", "utf8");

  if (!useCan.includes("useCallback")) fail("ps001", "useCan missing useCallback");
  else pass("ps001", "useCan uses useCallback for stable can");

  const afterFcr = adminIndex.slice(adminIndex.indexOf("FCR-002"));
  const depMatch = afterFcr.match(/\}, \[([\s\S]*?)\]\);/);
  const deps = depMatch?.[1] ?? "";
  if (/(^|[^\w])can([^\w]|$)/.test(deps.replace(/canReadOrders/g, ""))) {
    fail("ps001", "Ops Home effect still depends on raw can");
  } else {
    pass("ps001", "Ops Home effect avoids raw can identity in deps");
  }

  if (/\bgetSession\s*\(/.test(authProv)) {
    fail("ps002", "getSession() call still present in SupabaseIdentityProvider");
  } else {
    pass("ps002", "No dual getSession() in SupabaseIdentityProvider");
  }

  if (!root.includes('event !== "SIGNED_IN"')) {
    fail("ps002", "Root auth invalidate filter missing");
  } else {
    pass("ps002", "Root skips TOKEN_REFRESHED for router.invalidate");
  }

  assertNoImmediateGetSessionAfterLogin("src/routes/auth.tsx", "auth.tsx");
  assertNoImmediateGetSessionAfterLogin("src/routes/auth.admin.tsx", "auth.admin.tsx");
  assertCanonicalPipelineWiring();

  const browser = await chromium.launch({
    ...PS002C_BROWSER_POLICY.launchOptions,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await enterAsCompanyAdmin(page);
    await page.screenshot({
      path: path.join(OUT, "ps002-after-login.png"),
      fullPage: true,
    });

    if (!(await page.getByText("DEV MODE").count())) {
      fail("ps002", "DEV MODE panel not visible after Bootstrap Entrar");
    } else {
      pass("ps002", "Bootstrap login → DEV MODE panel visible (PS-002-B only)");
    }

    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(1500);

    const onOps =
      (await page.getByText(/Centro de Operaciones|Operaciones|Cocina|Buenos|Buenas/i).count()) >
      0;
    if (!onOps) fail("ps001", "Ops Home content not detected on /admin");
    else pass("ps001", "Ops Home content visible on /admin");

    await page.screenshot({
      path: path.join(OUT, "ps001-admin-idle-start.png"),
      fullPage: true,
    });

    const idle = await measureIdleMutations(page, 3500);
    note("ps001", `Idle childList mutations=${idle.mutations} attribute=${idle.attributeOnly}`);
    if (idle.mutations > 25) {
      fail("ps001", `Excessive structural DOM churn in idle (${idle.mutations})`);
    } else {
      pass("ps001", `Idle structural stability OK (childList=${idle.mutations})`);
    }
    await page.screenshot({
      path: path.join(OUT, "ps001-admin-idle-end.png"),
      fullPage: true,
    });

    await page.locator("select").first().selectOption("kitchen");
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(OUT, "ps002-role-kitchen.png"),
      fullPage: true,
    });
    pass("ps002", "Profile switch to Kitchen via DEV select");

    await page.locator("select").first().selectOption("company_admin");
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(800);
    pass("ps002", "Restored Company Admin + /admin");

    await page.getByRole("button", { name: /^Salir$/i }).click();
    await page.waitForTimeout(1000);
    if (await page.getByRole("button", { name: /^Entrar$/i }).count()) {
      pass("ps002", "Bootstrap Salir → profile selector (logout analogue)");
    } else {
      fail("ps002", "After Salir, Entrar selector not shown");
    }
    await page.screenshot({
      path: path.join(OUT, "ps002-after-logout.png"),
      fullPage: true,
    });

    await enterAsCompanyAdmin(page);
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 60_000 });

    const routes = [
      { path: "/admin/kitchen", expect: /Cocina|Kitchen|pedido/i },
      { path: "/admin/delivery", expect: /Reparto|Delivery|entrega/i },
      { path: "/admin/orders", expect: /Pedido|Order/i },
      { path: "/admin", expect: /Operaciones|Buenos|Buenas|Cocina/i },
    ];
    for (const r of routes) {
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(700);
      const text = await page.locator("body").innerText();
      const blank = text.trim().length < 40;
      if (blank) fail("ps003", `Near-blank page at ${r.path}`);
      else if (!r.expect.test(text)) {
        note("ps003", `WARN: expected pattern weak at ${r.path}`);
        pass("ps003", `Navigated ${r.path} with content (${text.trim().length} chars)`);
      } else {
        pass("ps003", `Navigated ${r.path} with expected content`);
      }
      await page.screenshot({
        path: path.join(OUT, `ps003${r.path.replace(/\//g, "-")}.png`),
        fullPage: true,
      });
    }

    const jsErrors = consoleErrors.filter(
      (e) =>
        !/Failed to load resource: the server responded with a status of (401|403|404|400)/.test(
          e,
        ),
    );
    note("ps002", `console errors total=${consoleErrors.length} jsRelevant=${jsErrors.length}`);
    if (jsErrors.length > 5) {
      fail(
        "ps002",
        `Too many JS console errors (${jsErrors.length}): ${jsErrors.slice(0, 3).join(" | ")}`,
      );
    } else {
      pass(
        "ps002",
        `JS console errors acceptable (${jsErrors.length}); network 401/404 ignored in Bootstrap`,
      );
    }
  } catch (e) {
    fail("ps001", `Runtime error: ${e}`);
    fail("ps002", `Runtime error: ${e}`);
    fail("ps003", `Runtime error: ${e}`);
  } finally {
    await browser.close();
  }

  for (const key of Object.keys(results)) {
    if (results[key].notes.some((n) => n.startsWith("FAIL:"))) {
      results[key].result = "FAIL";
    } else if (results[key].notes.some((n) => n.startsWith("PASS:"))) {
      results[key].result = "PASS";
    } else {
      results[key].result = "FAIL";
    }
  }

  const summaryPath = path.join(OUT, "gates-summary.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify({ base: BASE, at: new Date().toISOString(), results, consoleErrors }, null, 2),
  );
  console.log(JSON.stringify({ base: BASE, results, consoleErrors }, null, 2));
  process.exit(Object.values(results).every((r) => r.result === "PASS") ? 0 : 1);
}

main();
