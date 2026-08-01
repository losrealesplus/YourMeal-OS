/**
 * PS-002-C · UI timeout evidence (runner instrumentation only).
 *
 * Does not change Auth / product behavior. Classifies what Playwright saw
 * when the email form never became visible, so BLOCKED reasons are actionable.
 *
 * See: docs/10-validation/PS002C_TIMEOUT_EVIDENCE.md
 */
import fs from "node:fs";
import path from "node:path";

/** @typedef {'checkingSession'|'bootstrapError'|'nonStaffSession'|'form'|'redirect'|'bootstrap_mode'|'unknown'} Ps002cUiState */

/**
 * Pure classifier from DOM signals + URL + visible text.
 *
 * @param {{
 *   url?: string,
 *   bodyText?: string,
 *   route?: string,
 *   expectPath?: string,
 *   signals?: {
 *     hasEmailInput?: boolean,
 *     hasPasswordInput?: boolean,
 *     hasBootstrapProfile?: boolean,
 *     hasRetryButton?: boolean,
 *     hasSwitchAccount?: boolean,
 *   },
 * }} input
 * @returns {Ps002cUiState}
 */
export function classifyPs002cAuthUiState(input = {}) {
  const url = input.url ?? "";
  const bodyText = input.bodyText ?? "";
  const expectPath = input.expectPath ?? "/admin";
  const signals = input.signals ?? {};

  const leftAuth =
    Boolean(url) &&
    !url.includes("/auth") &&
    (url.includes(expectPath) || /\/(admin|app)(\/|$|\?)/.test(url));
  if (leftAuth) return "redirect";

  if (signals.hasBootstrapProfile) return "bootstrap_mode";

  if (signals.hasEmailInput && signals.hasPasswordInput) return "form";

  const text = bodyText.toLowerCase();

  if (
    !signals.hasEmailInput &&
    (signals.hasSwitchAccount ||
      /cliente\.|customer\.|not staff|no tiene acceso|cannot open the operations|non ha accesso|n'a pas accès|keinen zugang/i.test(
        bodyText,
      ))
  ) {
    if (
      signals.hasSwitchAccount ||
      /usar otra cuenta|use another account|andere konto|un autre compte|un altro account/i.test(
        bodyText,
      )
    ) {
      return "nonStaffSession";
    }
  }

  if (
    !signals.hasEmailInput &&
    (signals.hasRetryButton ||
      /no pudimos contactar|could not reach|no está disponible|not available yet|migración|rpc|bootstrap|caducado|expired|algo falló|something went wrong|falló la autenticación|authentication failed/i.test(
        bodyText,
      ))
  ) {
    return "bootstrapError";
  }

  if (
    !signals.hasEmailInput &&
    /cargando|loading|lädt|chargement|caricamento/.test(text)
  ) {
    return "checkingSession";
  }

  if (!signals.hasEmailInput && signals.hasSwitchAccount) {
    return "nonStaffSession";
  }

  return "unknown";
}

/**
 * @param {{
 *   uiState: Ps002cUiState,
 *   url: string,
 *   route: string,
 *   bodyText: string,
 *   screenshotRel?: string,
 *   htmlRel?: string,
 *   jsonRel?: string,
 *   waitError?: string,
 * }} ev
 */
export function formatPs002cFormTimeoutReason(ev) {
  const textPreview = (ev.bodyText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
  const lines = [
    "Auth form not available (timeout waiting for input[type=email]).",
    "",
    "URL:",
    ev.url || "(unknown)",
    "",
    "UI State:",
    ev.uiState,
    "",
    "Visible text:",
    textPreview ? `"${textPreview}"` : "(empty)",
  ];
  if (ev.screenshotRel) {
    lines.push("", "Screenshot:", ev.screenshotRel);
  }
  if (ev.htmlRel) {
    lines.push("", "HTML dump:", ev.htmlRel);
  }
  if (ev.jsonRel) {
    lines.push("", "Evidence JSON:", ev.jsonRel);
  }
  if (ev.waitError) {
    lines.push("", "Playwright:", ev.waitError);
  }
  lines.push(
    "",
    "Note: This is instrumentation only — Auth / product code unchanged.",
    "See: docs/10-validation/PS002C_TIMEOUT_EVIDENCE.md",
  );
  return lines.join("\n");
}

/**
 * Capture page state when the email form wait times out.
 * Runner-only; does not mutate application state.
 *
 * @param {import('playwright').Page} page
 * @param {{
 *   outDir: string,
 *   route?: string,
 *   expectPath?: string,
 *   waitError?: string,
 * }} opts
 */
export async function capturePs002cFormTimeoutEvidence(page, opts) {
  const outDir = opts.outDir;
  const route = opts.route ?? "/auth/admin";
  const expectPath = opts.expectPath ?? "/admin";
  fs.mkdirSync(outDir, { recursive: true });

  const url = page.url();
  const screenshotName = "ps002c-form-timeout.png";
  const htmlName = "ps002c-form-timeout.html";
  const jsonName = "ps002c-form-timeout.json";
  const textName = "ps002c-form-timeout.txt";
  const screenshotPath = path.join(outDir, screenshotName);
  const htmlPath = path.join(outDir, htmlName);
  const jsonPath = path.join(outDir, jsonName);
  const textPath = path.join(outDir, textName);

  await page
    .screenshot({ path: screenshotPath, fullPage: true })
    .catch(() => undefined);

  let bodyText = "";
  let mainHtml = "";
  try {
    const dump = await page.evaluate(() => {
      const body = document.body;
      const card =
        body?.querySelector("[class*='max-w']") ||
        body?.querySelector("form")?.closest("div") ||
        body?.querySelector("main") ||
        body;
      return {
        bodyText: body?.innerText ?? "",
        mainHtml: card ? card.outerHTML.slice(0, 16_000) : "",
      };
    });
    bodyText = dump.bodyText ?? "";
    mainHtml = dump.mainHtml ?? "";
  } catch (e) {
    bodyText = `(evaluate failed: ${e instanceof Error ? e.message : String(e)})`;
  }

  const count = async (locator) => {
    try {
      return await locator.count();
    } catch {
      return 0;
    }
  };

  const signals = {
    hasEmailInput: (await count(page.locator('input[type="email"]'))) > 0,
    hasPasswordInput: (await count(page.locator('input[type="password"]'))) > 0,
    hasBootstrapProfile:
      (await count(page.locator('input[name="bootstrap-profile"]'))) > 0,
    hasRetryButton:
      (await count(
        page.getByRole("button", {
          name: /reintentar|try again|riprova|erneut versuchen|réessayer/i,
        }),
      )) > 0,
    hasSwitchAccount:
      (await count(
        page.getByRole("button", {
          name: /usar otra cuenta|use another account|andere konto|un autre compte|un altro account/i,
        }),
      )) > 0,
  };

  const uiState = classifyPs002cAuthUiState({
    url,
    bodyText,
    route,
    expectPath,
    signals,
  });

  fs.writeFileSync(textPath, bodyText, "utf8");
  fs.writeFileSync(htmlPath, mainHtml || "(empty)", "utf8");

  const payload = {
    at: new Date().toISOString(),
    gate: "PS-002-C",
    kind: "form_timeout_evidence",
    url,
    route,
    expectPath,
    uiState,
    signals,
    bodyTextPreview: bodyText.replace(/\s+/g, " ").trim().slice(0, 800),
    artifacts: {
      screenshot: screenshotName,
      html: htmlName,
      text: textName,
      json: jsonName,
    },
    waitError: opts.waitError ?? null,
    note: "Instrumentation only — Auth / product unchanged",
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");

  const reason = formatPs002cFormTimeoutReason({
    uiState,
    url,
    route,
    bodyText,
    screenshotRel: path.relative(process.cwd(), screenshotPath),
    htmlRel: path.relative(process.cwd(), htmlPath),
    jsonRel: path.relative(process.cwd(), jsonPath),
    waitError: opts.waitError,
  });

  return {
    uiState,
    url,
    bodyText,
    mainHtml,
    signals,
    screenshotPath,
    htmlPath,
    jsonPath,
    textPath,
    payload,
    reason,
  };
}
